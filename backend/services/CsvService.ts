import { parse } from 'csv-parse/sync';
import { StudentRepository, ResultRepository, AuditRepository } from '../repositories/repositories.js';
import { PassFailLogic } from '../domain/ResultLogic.js';

export class CsvService {
  static async parseAndStore(buffer: Buffer, adminEmail: string) {
    const content = buffer.toString();
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const results = [];

    for (const record of records as any[]) {
      const { regNo, name, semester } = record;
      
      if (!regNo || regNo.trim() === '') {
        console.warn('Skipping row with missing regNo');
        continue;
      }
      
      // 1. Ensure student exists
      let student = await StudentRepository.findByRegNo(regNo);
      if (!student) {
        await StudentRepository.save({
          regNo,
          name,
          department: 'General', 
          semester: parseInt(semester),
          dob: '',
          status: 'Active'
        });
      }

      // 2. Prepare marks
      const marks = {
        subject1_ia: parseInt(record.sub1_ia || '0'),
        subject1_e: parseInt(record.sub1_e || '0'),
        subject2_ia: parseInt(record.sub2_ia || '0'),
        subject2_e: parseInt(record.sub2_e || '0'),
        subject3_ia: parseInt(record.sub3_ia || '0'),
        subject3_e: parseInt(record.sub3_e || '0'),
        subject4_ia: parseInt(record.sub4_ia || '0'),
        subject4_e: parseInt(record.sub4_e || '0'),
        subject5_ia: parseInt(record.sub5_ia || '0'),
        subject5_e: parseInt(record.sub5_e || '0'),
        subject6_ia: parseInt(record.sub6_ia || '0'),
        subject6_e: parseInt(record.sub6_e || '0'),
        subject7_ia: parseInt(record.sub7_ia || '0'),
        subject7_e: parseInt(record.sub7_e || '0'),
        subject8_ia: parseInt(record.sub8_ia || '0'),
        subject8_e: parseInt(record.sub8_e || '0'),
      };

      // Calculate totals
      const subject1_t = marks.subject1_ia + marks.subject1_e;
      const subject2_t = marks.subject2_ia + marks.subject2_e;
      const subject3_t = marks.subject3_ia + marks.subject3_e;
      const subject4_t = marks.subject4_ia + marks.subject4_e;
      const subject5_t = marks.subject5_ia + marks.subject5_e;
      const subject6_t = marks.subject6_ia + marks.subject6_e;
      const subject7_t = marks.subject7_ia + marks.subject7_e;
      const subject8_t = marks.subject8_ia + marks.subject8_e;

      const total = subject1_t + subject2_t + subject3_t + subject4_t + subject5_t + subject6_t + subject7_t + subject8_t;
      const avg = total / 8;
      
      // Use PassFailLogic for pass/fail
      const subjectMarks = [
        { ia: marks.subject1_ia, e: marks.subject1_e },
        { ia: marks.subject2_ia, e: marks.subject2_e },
        { ia: marks.subject3_ia, e: marks.subject3_e },
        { ia: marks.subject4_ia, e: marks.subject4_e },
        { ia: marks.subject5_ia, e: marks.subject5_e },
        { ia: marks.subject6_ia, e: marks.subject6_e },
        { ia: marks.subject7_ia, e: marks.subject7_e },
        { ia: marks.subject8_ia, e: marks.subject8_e },
      ];
      
      const resultStatus = PassFailLogic.getResult(subjectMarks);
      
      const result = {
        regNo,
        semester: parseInt(semester),
        ...marks,
        subject1_t, subject2_t, subject3_t, subject4_t, subject5_t, subject6_t, subject7_t, subject8_t,
        total,
        avg,
        result: resultStatus
      };

      await ResultRepository.save(result);
      
      await AuditRepository.save({
        action: 'CSV_UPLOAD',
        user: adminEmail,
        details: `Bulk upload result for ${regNo}`,
        timestamp: new Date().toISOString()
      });

      results.push(result);
    }

    return results;
  }
}
