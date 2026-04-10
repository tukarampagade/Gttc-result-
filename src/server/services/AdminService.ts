import { StudentRepository, ResultRepository, AuditRepository } from '../repositories/repositories.ts';
import bcrypt from 'bcryptjs';

export class AdminService {
  static async addStudent(data: any, adminEmail: string) {
    const lowerName = data.name.toLowerCase();
    const hashedPassword = await bcrypt.hash(lowerName, 10);
    const student = { ...data, password: hashedPassword };
    const result = StudentRepository.save(student);
    AuditRepository.save({ 
      action: `ADD_STUDENT: ${data.regNo}`, 
      user: adminEmail,
      details: `Added student ${data.name} with RegNo ${data.regNo}`
    });
    return result;
  }

  static async updateStudent(data: any, adminEmail: string) {
    const oldStudent: any = StudentRepository.findByRegNo(data.regNo);
    const result = StudentRepository.update(data);
    
    let changes = [];
    if (oldStudent && oldStudent.name !== data.name) {
      changes.push(`name: "${oldStudent.name}" -> "${data.name}"`);
    }
    
    AuditRepository.save({ 
      action: `UPDATE_STUDENT: ${data.regNo}`, 
      user: adminEmail,
      details: changes.length > 0 ? `Updated fields: ${changes.join(', ')}` : 'No fields changed'
    });
    return result;
  }

  static async deleteStudent(regNo: string, adminEmail: string) {
    const student: any = StudentRepository.findByRegNo(regNo);
    const result = StudentRepository.deleteByRegNo(regNo);
    ResultRepository.deleteByRegNo(regNo);
    AuditRepository.save({ 
      action: `DELETE_STUDENT: ${regNo}`, 
      user: adminEmail,
      details: student ? `Deleted student ${student.name} (RegNo: ${regNo}) and their results` : `Deleted RegNo: ${regNo}`
    });
    return result;
  }

  static getStudents() {
    return StudentRepository.findAll();
  }

  static getResults() {
    return ResultRepository.findAll();
  }

  static getAnalytics() {
    const students = StudentRepository.findAll();
    const results = ResultRepository.findAll();
    
    const totalStudents = students.length;
    const totalResults = results.length;
    const passed = results.filter((r: any) => r.result === 'PASS').length;
    const failed = totalResults - passed;

    // Grade Distribution
    const grades = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'D': 0, 'F': 0 };
    results.forEach((r: any) => {
      const p = (r.total / 960) * 100;
      if (p >= 90) grades['A+']++;
      else if (p >= 80) grades['A']++;
      else if (p >= 70) grades['B+']++;
      else if (p >= 60) grades['B']++;
      else if (p >= 50) grades['C+']++;
      else if (p >= 40) grades['D']++;
      else grades['F']++;
    });

    // Department-wise Pass Rate
    const deptStats: any = {};
    results.forEach((r: any) => {
      const student: any = students.find((s: any) => s.regNo === r.regNo);
      if (student && student.department) {
        if (!deptStats[student.department]) {
          deptStats[student.department] = { total: 0, passed: 0 };
        }
        deptStats[student.department].total++;
        if (r.result === 'PASS') deptStats[student.department].passed++;
      }
    });

    const deptPassRates = Object.keys(deptStats).map(dept => ({
      department: dept,
      passRate: (deptStats[dept].passed / deptStats[dept].total) * 100
    }));

    return {
      totalStudents,
      totalResults,
      passed,
      failed,
      passRate: totalResults > 0 ? (passed / totalResults) * 100 : 0,
      failRate: totalResults > 0 ? (failed / totalResults) * 100 : 0,
      gradeDistribution: grades,
      deptPassRates
    };
  }

  static getAuditLogs() {
    return AuditRepository.findAll();
  }
}
