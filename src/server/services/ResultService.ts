import { ResultRepository, StudentRepository, AuditRepository } from '../repositories/repositories.ts';
import { ResultCalculator, PassFailLogic } from '../domain/ResultLogic.ts';

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
    const marks = [
      data.subject1, data.subject2, data.subject3, data.subject4, 
      data.subject5, data.subject6, data.subject7, data.subject8
    ];
    const total = ResultCalculator.calculateTotal(marks);
    const avg = ResultCalculator.calculateAvg(total, marks.length);
    const resultStatus = PassFailLogic.getResult(marks);

    const resultData = {
      ...data,
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
