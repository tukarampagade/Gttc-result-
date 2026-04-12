import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const bcrypt = require('bcryptjs');

import { ResultService } from './ResultService.js';
import { StudentRepository, AuditRepository } from '../repositories/repositories.js';

export class PdfService {
  static async parseAndStore(buffer: Buffer, adminEmail: string) {
    const pdf = typeof pdfParse === 'function' ? pdfParse : (pdfParse.default || pdfParse);
    if (typeof pdf !== 'function') {
      throw new Error('PDF parsing library failed to load correctly.');
    }
    const data = await pdf(buffer);
    const text = data.text as string;

    // Improved regex to match: SlNo RegNo Name FatherName [IA E T]x8 Total Result
    // Handles 'AB' for absent and flexible whitespace
    const recordRegex = /(\d{1,3})\s+(\d{7})\s+([A-Z\s\.\-\']+?)\s+([A-Z\s\.\-\']+?)\s+((?:(?:(?:\d{1,3}|AB)\s+){3}){8})(\d{1,4})\s+(PASS|FAIL)/gi;
    
    const matches = Array.from(text.matchAll(recordRegex));
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
          // subjectData[`subject${i+1}_t`] = allMarks[baseIdx + 2]; // Calculated by ResultService
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
        console.error(`Error processing match in PDF:`, error);
      }
    }

    AuditRepository.save({ 
      action: 'PDF_UPLOAD', 
      user: adminEmail,
      details: `Successfully processed ${results.length} student records from PDF`
    });
    return results;
  }
}
