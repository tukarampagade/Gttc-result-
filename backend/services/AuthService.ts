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
      { regNo: '8080114', name: 'H FHIMUDDIN', marks: [[39,6],[47,25],[44,27],[42,16],[49,0],[44,25],[41,37],[38,37]] },
      { regNo: '8080115', name: 'HARSH PATIL', marks: [[48,36],[55,50],[66,50],[63,42],[67,50],[65,45],[66,45],[59,45]] },
      { regNo: '8080117', name: 'KHUSHI TARALE', marks: [[50,36],[46,49],[54,49],[57,39],[64,50],[60,46],[55,46],[59,46]] },
      { regNo: '8080118', name: 'MAHALAKSHMEE MANJUNATH BADIGER', marks: [[55,25],[50,44],[49,44],[64,16],[66,40],[67,47],[56,48],[53,40]] },
      { regNo: '8080119', name: 'MAHESH MAHADEV NESARKAR', marks: [[35,10],[43,18],[40,31],[38,4],[49,5],[38,10],[44,29],[35,25]] },
      { regNo: '8080120', name: 'MEHRUNBEE DASTGEER MULLA', marks: [[58,34],[59,50],[66,49],[66,35],[66,50],[63,48],[58,46],[65,49]] },
      { regNo: '8080121', name: 'MOHAMADANIYAZ JAKIRHUSEN BAGAWAN', marks: [[68,47],[70,50],[70,50],[69,47],[70,50],[70,50],[67,49],[63,49]] },
      { regNo: '8080122', name: 'MOHAMMADIBRAHIM FAROOQ BASARIKATTI', marks: [[37,17],[45,26],[44,35],[46,25],[52,25],[44,25],[49,32],[50,35]] },
      { regNo: '8080123', name: 'NAGAVENI PATIL', marks: [[56,41],[60,50],[63,50],[61,38],[56,50],[67,50],[68,50],[63,49]] },
      { regNo: '8080124', name: 'NAVEED DAFEDAR', marks: [[35,14],[44,25],[42,36],[43,26],[50,25],[43,25],[47,30],[43,25]] },
      { regNo: '8080125', name: 'NAVEENKUMAR NAGARAJ SARAVARI', marks: [[35,2],[37,5],[40,17],[35,5],[45,0],[36,0],[0,0],[36,25]] },
      { regNo: '8080126', name: 'PRAJWAL RAJU GADIWADDAR', marks: [[39,14],[40,26],[42,25],[48,14],[48,25],[52,5],[44,40],[46,38]] },
      { regNo: '8080127', name: 'RAKSHITA RAMESH KAMBLE', marks: [[48,18],[47,42],[53,40],[59,34],[59,40],[64,25],[55,45],[57,35]] },
      { regNo: '8080128', name: 'SALONI BELGAONKAR', marks: [[39,25],[48,34],[51,39],[49,25],[63,45],[48,25],[55,47],[49,31]] },
      { regNo: '8080129', name: 'SAMARTH NARAYAN SUNTHAKAR', marks: [[46,25],[45,50],[50,47],[55,25],[66,49],[63,25],[58,43],[57,44]] },
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
