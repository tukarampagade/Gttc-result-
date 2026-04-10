import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

import { ResultService } from './ResultService.ts';
import { StudentRepository, AuditRepository } from '../repositories/repositories.ts';
import bcrypt from 'bcryptjs';

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
          subject1: marks[0],
          subject2: marks[1],
          subject3: marks[2],
          subject4: marks[3],
          subject5: marks[4],
          subject6: marks[5],
          subject7: marks[6],
          subject8: marks[7],
          total: calculatedTotal,
          avg: calculatedTotal / 8,
          result: upperResult
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
