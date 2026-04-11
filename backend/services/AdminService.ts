import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

import { StudentRepository, ResultRepository, AuditRepository, SettingsRepository } from '../repositories/repositories.js';

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
    if (oldStudent) {
      if (oldStudent.name !== data.name) changes.push(`name: "${oldStudent.name}" -> "${data.name}"`);
      if (oldStudent.email !== data.email) changes.push(`email: "${oldStudent.email}" -> "${data.email}"`);
      if (oldStudent.department !== data.department) changes.push(`department: "${oldStudent.department}" -> "${data.department}"`);
      if (oldStudent.semester !== data.semester) changes.push(`semester: "${oldStudent.semester}" -> "${data.semester}"`);
      if (oldStudent.dob !== data.dob) changes.push(`dob: "${oldStudent.dob}" -> "${data.dob}"`);
      if (oldStudent.status !== data.status) changes.push(`status: "${oldStudent.status}" -> "${data.status}"`);
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

  static getStudents(page: number = 1, limit: number = 10, status?: string, sort: string = 'regNo', order: string = 'ASC') {
    const students = StudentRepository.findAll(page, limit, status, sort, order);
    const total = StudentRepository.count(status);
    return {
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static getResults(page: number = 1, limit: number = 10, semester?: number, status?: string) {
    const results = ResultRepository.findAll(page, limit, semester, status);
    const total = ResultRepository.count(semester, status);
    return {
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
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

  static getAuditLogs(page: number = 1, limit: number = 10) {
    const logs = AuditRepository.findAll(page, limit);
    const total = AuditRepository.count();
    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static getThemeColor() {
    return SettingsRepository.get('theme_color') || '#2563eb';
  }

  static updateThemeColor(color: string, adminEmail: string) {
    const result = SettingsRepository.set('theme_color', color);
    AuditRepository.save({ 
      action: 'UPDATE_THEME_COLOR', 
      user: adminEmail,
      details: `Updated theme color to ${color}`
    });
    return result;
  }

  static async bulkUpdateStudentStatus(regNos: string[], status: string, adminEmail: string) {
    StudentRepository.bulkUpdateStatus(regNos, status);
    AuditRepository.save({
      action: 'BULK_STATUS_UPDATE',
      user: adminEmail,
      details: `Updated status to ${status} for ${regNos.length} students: ${regNos.join(', ')}`
    });
    return { success: true };
  }

  static async bulkDeleteResults(regNos: string[], semester: number, adminEmail: string) {
    ResultRepository.bulkDelete(regNos, semester);
    AuditRepository.save({
      action: 'BULK_RESULT_DELETE',
      user: adminEmail,
      details: `Deleted results for Semester ${semester} for ${regNos.length} students: ${regNos.join(', ')}`
    });
    return { success: true };
  }

  static async getStudentByRegNo(regNo: string) {
    return StudentRepository.findByRegNo(regNo);
  }
}
