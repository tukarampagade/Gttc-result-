import { ResultRepository, StudentRepository, AuditRepository } from '../repositories/repositories.js';
import { ResultCalculator, PassFailLogic } from '../domain/ResultLogic.js';

export class ResultService {
  static getResult(regNo: string, semester?: number) {
    const student: any = StudentRepository.findByRegNo(regNo);
    const result: any = ResultRepository.findByRegNo(regNo, semester);

    if (!student || !result) return null;

    const rank = ResultRepository.getRank(regNo, result.semester);
    AuditRepository.save({ action: 'RESULT_VIEW', user: regNo });

    return {
      regNo: student.regNo,
      name: student.name,
      department: student.department,
      rank,
      ...result
    };
  }

  static getResultByRegNo(regNo: string, semester?: number) {
    const student: any = StudentRepository.findByRegNo(regNo);
    const result: any = ResultRepository.findByRegNo(regNo, semester);

    if (!student || !result) return null;

    const rank = ResultRepository.getRank(regNo, result.semester);
    return {
      regNo: student.regNo,
      name: student.name,
      department: student.department,
      rank,
      ...result
    };
  }

  static getHistory(regNo: string) {
    const student: any = StudentRepository.findByRegNo(regNo);
    if (!student) return null;

    const results = ResultRepository.findAllByRegNo(regNo);
    return {
      student: {
        regNo: student.regNo,
        name: student.name,
        department: student.department
      },
      history: results
    };
  }

  static saveResult(data: any, adminEmail?: string) {
    const subjectMarks = [
      { ia: data.subject1_ia, e: data.subject1_e },
      { ia: data.subject2_ia, e: data.subject2_e },
      { ia: data.subject3_ia, e: data.subject3_e },
      { ia: data.subject4_ia, e: data.subject4_e },
      { ia: data.subject5_ia, e: data.subject5_e },
      { ia: data.subject6_ia, e: data.subject6_e },
      { ia: data.subject7_ia, e: data.subject7_e },
      { ia: data.subject8_ia, e: data.subject8_e }
    ];

    const totals = subjectMarks.map(m => (m.ia || 0) + (m.e || 0));
    const total = ResultCalculator.calculateTotal(totals);
    const avg = ResultCalculator.calculateAvg(total, totals.length);
    const resultStatus = PassFailLogic.getResult(subjectMarks);

    const resultData = {
      ...data,
      subject1_t: totals[0],
      subject2_t: totals[1],
      subject3_t: totals[2],
      subject4_t: totals[3],
      subject5_t: totals[4],
      subject6_t: totals[5],
      subject7_t: totals[6],
      subject8_t: totals[7],
      semester: data.semester || 3,
      total,
      avg,
      result: resultStatus
    };

    const isUpdate = !!ResultRepository.findByRegNo(data.regNo, data.semester);
    const result = ResultRepository.save(resultData);
    if (adminEmail) {
      AuditRepository.save({ 
        action: isUpdate ? 'UPDATE_RESULT' : 'ADD_RESULT', 
        user: adminEmail,
        details: `RegNo: ${data.regNo}, Total: ${total}, Status: ${resultStatus}`
      });
    }
    return result;
  }
}
