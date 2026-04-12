import { getTextExtractor } from 'office-text-extractor';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

import { ResultService } from './ResultService.js';
import { StudentRepository, AuditRepository } from '../repositories/repositories.js';

export class OfficeService {
  static async parseAndStore(buffer: Buffer, adminEmail: string, filename: string) {
    const extractor = getTextExtractor();
    const text = (await extractor.extractText({ input: buffer, type: 'buffer' })) as string;

    // Improved regex to match: SlNo RegNo Name FatherName [IA E T]x8 Total Result
    const recordRegex = /(\d{1,3})\s+(\d{7})\s+([A-Z\s\.\-\']+?)\s+([A-Z\s\.\-\']+?)\s+((?:(?:(?:\d{1,3}|AB)\s+){3}){8})(\d{1,4})\s+(PASS|FAIL)/gi;
    
    const matches = Array.from(text.matchAll(recordRegex));
    if (matches.length === 0) {
      throw new Error('No valid student records found in the document. Please ensure the file follows the required provisional result sheet format.');
    }
    const results: any[] = [];

    for (const match of matches) {
      try {
        const [_, slNo, regNo, name, fatherName, marksText, total, resultStatus] = match;
        const trimmedName = name.trim();
        
        // Parse marks: split by whitespace and filter out empty strings
        const allMarks = marksText.trim().split(/\s+/).map(m => m.toUpperCase() === 'AB' ? 0 : parseInt(m));
        
        // allMarks should have 24 values (IA, E, T for 8 subjects)
        const subjectData: any = {
          regNo,
          semester: 3, // Default for this format
        };

        for (let i = 0; i < 8; i++) {
          const baseIdx = i * 3;
          subjectData[`subject${i+1}_ia`] = allMarks[baseIdx];
          subjectData[`subject${i+1}_e`] = allMarks[baseIdx + 1];
        }

        // Ensure student exists
        let student: any = StudentRepository.findByRegNo(regNo);
        if (!student) {
          const lowerName = trimmedName.toLowerCase();
          const hashedPassword = await bcrypt.hash(lowerName, 10);
          StudentRepository.save({ regNo, name: trimmedName, password: hashedPassword });
        }

        ResultService.saveResult(subjectData, adminEmail);
        results.push(subjectData);
      } catch (error) {
        console.error(`Error processing match in ${filename}:`, error);
      }
    }

    const fileType = filename.split('.').pop()?.toUpperCase() || 'OFFICE';
    AuditRepository.save({ 
      action: `${fileType}_UPLOAD`, 
      user: adminEmail,
      details: `Successfully processed ${results.length} student records from ${filename}`
    });
    return results;
  }
}
