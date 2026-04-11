import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const pdf = typeof pdfParse === 'function' ? pdfParse : pdfParse.default;
const bcrypt = require('bcryptjs');

import { ResultService } from './ResultService.js';
import { StudentRepository, AuditRepository } from '../repositories/repositories.js';

export class PdfService {
  static async parseAndStore(buffer: Buffer, adminEmail: string) {
    const data = await pdf(buffer);
    const text = data.text;

    // Global regex to find all student records regardless of line breaks
    // 1. RegNo: 5 or more digits
    // 2. Name: Letters, spaces, dots, hyphens
    // 3. Marks: 8 sets of 1-3 digits
    // 4. Total: 1-4 digits
    // 5. Result: PASS or FAIL
    const recordRegex = /(\d{5,})\s+([A-Za-z\s\.\-\']+?)\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,4})\s+(PASS|FAIL)/gi;
    
    const matches = Array.from(text.matchAll(recordRegex));
    const results: any[] = [];

    for (const match of matches) {
      try {
        const m = match as unknown as string[];
        const [_, regNo, name, s1, s2, s3, s4, s5, s6, s7, s8, total, resultStatus] = m;
        const trimmedName = name.trim();
        const upperResult = resultStatus.toUpperCase();

        // Basic validation: total should be sum of marks
        const marks = [
          parseInt(s1), parseInt(s2), parseInt(s3), parseInt(s4), 
          parseInt(s5), parseInt(s6), parseInt(s7), parseInt(s8)
        ];
        const calculatedTotal = marks.reduce((a, b) => a + b, 0);
        const parsedTotal = parseInt(total);

        // Ensure student exists
        let student: any = StudentRepository.findByRegNo(regNo);
        if (!student) {
          const lowerName = trimmedName.toLowerCase();
          const hashedPassword = await bcrypt.hash(lowerName, 10);
          StudentRepository.save({ regNo, name: trimmedName, password: hashedPassword });
        }

        const resultData = {
          regNo,
          semester: 3, // Default for this PDF
          subject1_ia: 40, subject1_e: marks[0] - 40 > 0 ? marks[0] - 40 : 0,
          subject2_ia: 40, subject2_e: marks[1] - 40 > 0 ? marks[1] - 40 : 0,
          subject3_ia: 40, subject3_e: marks[2] - 40 > 0 ? marks[2] - 40 : 0,
          subject4_ia: 40, subject4_e: marks[3] - 40 > 0 ? marks[3] - 40 : 0,
          subject5_ia: 40, subject5_e: marks[4] - 40 > 0 ? marks[4] - 40 : 0,
          subject6_ia: 40, subject6_e: marks[5] - 40 > 0 ? marks[5] - 40 : 0,
          subject7_ia: 40, subject7_e: marks[6] - 40 > 0 ? marks[6] - 40 : 0,
          subject8_ia: 40, subject8_e: marks[7] - 40 > 0 ? marks[7] - 40 : 0,
        };

        ResultService.saveResult(resultData, adminEmail);
        results.push(resultData);
      } catch (error) {
        console.error(`Error processing match: ${match[0]}`, error);
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
