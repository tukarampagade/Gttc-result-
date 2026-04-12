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

    // Extract semester from text
    let semester = 3;
    const upperText = text.toUpperCase();
    if (upperText.includes('SECOND SEMESTER') || upperText.includes('2ND SEMESTER') || upperText.includes('II SEMESTER')) semester = 2;
    else if (upperText.includes('THIRD SEMESTER') || upperText.includes('3RD SEMESTER') || upperText.includes('III SEMESTER')) semester = 3;
    else if (upperText.includes('FIRST SEMESTER') || upperText.includes('1ST SEMESTER') || upperText.includes('I SEMESTER')) semester = 1;
    else if (upperText.includes('FOURTH SEMESTER') || upperText.includes('4TH SEMESTER') || upperText.includes('IV SEMESTER')) semester = 4;

    // Improved regex to match: SlNo RegNo Name FatherName Marks... Total Result
    // Flexible enough to handle 7-9 subjects and 'AB' or '--'
    const recordRegex = /(\d{1,3})\s+(\d{7})\s+([A-Z\s\.\-\']+?)\s+([A-Z\s\.\-\']+?)\s+((?:(?:(?:\d{1,3}|AB|--)\s+){1,3}){7,10})(\d{1,4})\s+(PASS|FAIL)/gi;
    
    const matches = Array.from(text.matchAll(recordRegex));
    if (matches.length === 0) {
      throw new Error('No valid student records found in the PDF. Please ensure the PDF follows the required provisional result sheet format (C-24).');
    }
    const results: any[] = [];

    for (const match of matches) {
      try {
        const [_, slNo, regNo, name, fatherName, marksText, total, resultStatus] = match;
        const trimmedName = name.trim();
        
        // Parse marks: split by whitespace and filter out empty strings
        const allMarks = marksText.trim().split(/\s+/).map(m => {
          const upper = m.toUpperCase();
          if (upper === 'AB' || upper === '--') return 0;
          return parseInt(m) || 0;
        });
        
        const subjectData: any = {
          regNo,
          semester,
        };

        // For 2nd sem (C-24), we have 7 subjects with 3 marks each, then 2 with 1 mark
        if (semester === 2) {
          for (let i = 0; i < 7; i++) {
            const baseIdx = i * 3;
            subjectData[`subject${i+1}_ia`] = allMarks[baseIdx] || 0;
            subjectData[`subject${i+1}_e`] = allMarks[baseIdx + 1] || 0;
          }
          // 8th subject (SS-II) and 9th (BK-II) are IA only in this format
          // We'll map BK-II to subject8 as it's the one the user cares about
          // In C-24 format, if there are 23 marks, the 23rd is BK-II
          if (allMarks.length >= 23) {
            subjectData[`subject8_ia`] = allMarks[22];
          } else {
            subjectData[`subject8_ia`] = allMarks[21] || 0;
          }
          subjectData[`subject8_e`] = 0;
        } else {
          // Default 8 subjects with 3 marks each
          for (let i = 0; i < 8; i++) {
            const baseIdx = i * 3;
            subjectData[`subject${i+1}_ia`] = allMarks[baseIdx] || 0;
            subjectData[`subject${i+1}_e`] = allMarks[baseIdx + 1] || 0;
          }
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
