import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

import db from '../config/db.js';
import { StudentRepository, AdminRepository, AuditRepository, ResultRepository } from '../repositories/repositories.js';
import { ResultService } from './ResultService.js';
import { generateToken } from '../util/JwtUtil.js';

export class AuthService {
  static async studentLogin(regNo: string, passwordInput: string) {
    console.log(`Attempting student login for regNo: ${regNo}`);
    const student: any = StudentRepository.findByRegNo(regNo);
    if (!student) {
      console.log(`Student with regNo ${regNo} not found`);
      return null;
    }

    // Password is case-insensitive, stored as lowercase hashed
    const lowerPassword = passwordInput.toLowerCase();
    console.log(`Comparing password for ${regNo}`);
    const isValid = await bcrypt.compare(lowerPassword, student.password);
    console.log(`Password valid for ${regNo}: ${isValid}`);

    if (isValid) {
      AuditRepository.save({ 
        action: 'STUDENT_LOGIN', 
        user: regNo,
        details: `Successful login for student ${student.name}`
      });
      return generateToken({ id: student.id, regNo: student.regNo, role: 'STUDENT' });
    } else {
      AuditRepository.save({ 
        action: 'STUDENT_LOGIN_FAILED', 
        user: regNo,
        details: 'Invalid password attempt'
      });
    }
    return null;
  }

  static async adminLogin(email: string, passwordInput: string) {
    console.log(`Attempting admin login for email: ${email}`);
    const admin: any = AdminRepository.findByEmail(email);
    if (!admin) {
      console.log(`Admin with email ${email} not found in database`);
      AuditRepository.save({ 
        action: 'ADMIN_LOGIN_FAILED', 
        user: email,
        details: 'Admin email not found'
      });
      return null;
    }

    console.log(`Comparing admin password for ${email}`);
    try {
      const isValid = await bcrypt.compare(passwordInput, admin.password);
      console.log(`Admin password valid for ${email}: ${isValid}`);
      if (isValid) {
        AuditRepository.save({ 
          action: 'ADMIN_LOGIN', 
          user: email,
          details: 'Successful admin login'
        });
        return generateToken({ id: admin.id, email: admin.email, role: 'ADMIN' });
      } else {
        console.log(`Invalid password for admin ${email}`);
        AuditRepository.save({ 
          action: 'ADMIN_LOGIN_FAILED', 
          user: email,
          details: 'Invalid password attempt'
        });
      }
    } catch (err) {
      console.error(`Error during bcrypt compare for admin ${email}:`, err);
    }
    return null;
  }

  static async seedAdmin() {
    const email = 'tukarampagade781@gmail.com';
    const hashedPassword = await bcrypt.hash('Tukaram@2007', 10);
    
    const existing = AdminRepository.findByEmail(email);
    if (!existing) {
      AdminRepository.save({ email, password: hashedPassword });
      console.log('Admin seeded successfully');
    } else {
      db.prepare('UPDATE admins SET password = ? WHERE email = ?').run(hashedPassword, email);
      console.log('Admin password reset successfully');
    }

    // Only seed if no students exist
    const studentCount = (db.prepare('SELECT COUNT(*) as count FROM students').get() as any).count;
    if (studentCount > 0) {
      console.log('Database already contains data, skipping fresh seed.');
      return;
    }

    // Seed students from PDF (Sl No 1-23)
    const pdfStudents = [
      { regNo: '8080101', name: 'ABHINANDAN NAMDEV JADHAV', marks: [[62,38],[64,50],[65,50],[63,42],[65,49],[67,50],[66,48],[60,48]] },
      { regNo: '8080102', name: 'ADINATH B VASULKAR', marks: [[47,10],[49,35],[54,37],[49,18],[61,40],[56,35],[64,45],[54,39]] },
      { regNo: '8080103', name: 'ADITYA DEELIP GODASE', marks: [[35,14],[48,25],[41,25],[42,14],[46,32],[40,25],[35,0],[38,25]] },
      { regNo: '8080104', name: 'ADITYA SHRINIVAS SARODE', marks: [[56,34],[60,50],[64,47],[60,38],[65,49],[64,50],[68,50],[60,45]] },
      { regNo: '8080107', name: 'ARIHANT DEVENDRA PATIL', marks: [[38,18],[45,20],[43,27],[41,12],[47,25],[42,10],[50,29],[42,31]] },
      { regNo: '8080108', name: 'ARUN RAJENDRA BHAGANNAVAR', marks: [[36,13],[48,43],[45,48],[42,18],[44,25],[39,13],[39,30],[51,37]] },
      { regNo: '8080110', name: 'ATHARV SHETTY', marks: [[55,39],[59,50],[64,49],[60,41],[65,49],[62,50],[62,48],[62,49]] },
      { regNo: '8080111', name: 'BALAPPA GUNDU DODDAKALLANNAVAR', marks: [[59,29],[61,49],[65,49],[61,36],[68,49],[68,50],[68,48],[55,46]] },
      { regNo: '8080142', name: 'TUKARAM PRAKASH PAGADE', marks: [[53,27],[47,35],[59,43],[53,25],[65,49],[64,50],[68,47],[47,26]] }
    ];

    for (const s of pdfStudents) {
      const password = await bcrypt.hash(s.name.toLowerCase(), 10);
      StudentRepository.save({
        regNo: s.regNo,
        name: s.name,
        department: 'DAIML – Data Science & AI/ML',
        semester: 4,
        status: 'Active',
        password
      });
      
      const resultData: any = {
        regNo: s.regNo,
        semester: 4
      };

      for (let i = 0; i < 8; i++) {
        resultData[`subject${i+1}_ia`] = s.marks[i][0];
        resultData[`subject${i+1}_e`] = s.marks[i][1];
      }

      ResultService.saveResult(resultData, email);
    }
    console.log('Fresh data seeded successfully');
  }
}
