import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

import db from '../config/db.js';
import { StudentRepository, AdminRepository, AuditRepository, ResultRepository } from '../repositories/repositories.js';
import { ResultService } from './ResultService.js';
import { generateToken } from '../util/JwtUtil.js';

export class AuthService {
  static async studentLogin(regNo: string, passwordInput: string) {
    const trimmedRegNo = regNo.trim();
    console.log(`Attempting student login for regNo: ${trimmedRegNo}`);
    const student: any = StudentRepository.findByRegNo(trimmedRegNo);
    if (!student) {
      console.log(`Student with regNo ${trimmedRegNo} not found`);
      return null;
    }

    // Password is case-insensitive, stored as lowercase hashed, and normalized spaces
    const lowerPassword = passwordInput.trim().toLowerCase().replace(/\s+/g, ' ');
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

    // Clear existing data to ensure a fresh start
    db.prepare('DELETE FROM results').run();
    db.prepare('DELETE FROM students').run();
    console.log('Existing data cleared.');

    // Seed students from PDF (Sl No 1-45)
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
      { regNo: '8080130', name: 'SANAN ASIF MOMIN', marks: [[40,4],[44,25],[42,28],[42,11],[48,25],[44,25],[55,41],[46,37]] },
      { regNo: '8080132', name: 'SANKET GOVINDRAY MESTA', marks: [[38,20],[45,34],[43,44],[49,19],[52,5],[53,25],[48,40],[48,38]] },
      { regNo: '8080133', name: 'SANKET NARAYAN TAMMANACHE', marks: [[37,10],[41,7],[40,9],[43,4],[43,10],[39,25],[36,25],[38,29]] },
      { regNo: '8080134', name: 'SATISH SHASHIKUMAR CHIMANAPPAGOL', marks: [[40,0],[46,18],[41,19],[43,8],[43,36],[45,25],[40,29],[47,31]] },
      { regNo: '8080135', name: 'SHREEHARI SANADI', marks: [[36,10],[46,25],[48,25],[47,5],[51,0],[44,25],[39,25],[42,26]] },
      { regNo: '8080136', name: 'SHREYAS KISAN NILAJKAR', marks: [[35,8],[47,0],[41,25],[39,2],[43,25],[39,25],[35,0],[38,31]] },
      { regNo: '8080137', name: 'SOURABH NARAYAN APTEKAR', marks: [[35,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[39,26]] },
      { regNo: '8080138', name: 'SUDEEP MAHESH HUCHCHARAYAPPAGOL', marks: [[35,0],[41,25],[43,31],[42,11],[40,25],[38,25],[44,25],[36,25]] },
      { regNo: '8080139', name: 'SURAJ YALLAPPA BHANDARI', marks: [[35,15],[42,25],[44,25],[50,14],[42,10],[43,25],[40,27],[44,31]] },
      { regNo: '8080140', name: 'SWAYAM SANDEEP ROKADE', marks: [[37,9],[44,26],[41,27],[36,7],[50,12],[43,12],[42,44],[52,29]] },
      { regNo: '8080141', name: 'TEJAS CHANDRAKANT PATHARVAT', marks: [[38,9],[51,20],[44,30],[44,10],[52,25],[57,25],[49,35],[60,48]] },
      { regNo: '8080142', name: 'TUKARAM PRAKASH PAGADE', marks: [[53,27],[47,35],[59,43],[53,25],[65,49],[64,50],[68,47],[47,26]] },
      { regNo: '8080146', name: 'AKASH N SHINGANNAVAR', marks: [[35,14],[38,25],[42,31],[39,7],[40,41],[43,25],[35,25],[55,44]] },
      { regNo: '8080147', name: 'MOHAMMAD TAHIR ABDUL BASIT SOUDAGAR', marks: [[39,3],[45,8],[40,26],[38,8],[49,10],[38,25],[43,30],[53,49]] },
      { regNo: '8080150', name: 'ADITI SATISH PATIL', marks: [[62,36],[50,34],[44,50],[60,32],[63,25],[51,25],[55,43],[55,44]] },
      { regNo: '8080151', name: 'AMRUTA YALLANAGOUDA CHIKKANAGOUDAR', marks: [[54,27],[52,28],[41,36],[51,25],[56,40],[52,25],[57,38],[53,49]] },
      { regNo: '8080152', name: 'DAYANANDA', marks: [[55,25],[51,40],[45,41],[44,26],[55,37],[54,25],[42,25],[46,35]] },
      { regNo: '8080153', name: 'PREETHI G R', marks: [[64,32],[54,46],[54,50],[51,28],[66,48],[68,35],[52,42],[39,33]] },
      { regNo: '8080154', name: 'SAJIDA JAILANI SHAIKH', marks: [[58,25],[58,47],[53,45],[44,39],[65,50],[64,50],[57,46],[59,45]] },
      { regNo: '8080155', name: 'SOMARAJ A', marks: [[68,42],[59,44],[61,50],[49,37],[58,39],[65,50],[45,26],[53,43]] },
      { regNo: '8080156', name: 'VAISHNAVI SADASHIV MIRAJAKAR', marks: [[57,18],[47,41],[42,48],[66,25],[58,45],[63,30],[57,38],[52,43]] },
      { regNo: '8080157', name: 'VIKAS MAHANTESH YAMAKANAMARDI', marks: [[40,10],[40,30],[46,42],[56,20],[42,0],[42,0],[42,0],[38,43]] }
    ];

    const secondSemResults = [
      { regNo: '8080101', name: 'ABHINANDAN NAMDEV JADHAV', marks: [[67,48],[63,49],[68,45],[55,47],[67,49],[69,50],[63,33],[35,0]] },
      { regNo: '8080102', name: 'ADINATH B VASULKAR', marks: [[54,29],[49,46],[52,25],[54,48],[48,48],[64,42],[62,32],[42,0]] },
      { regNo: '8080103', name: 'ADITYA DEELIP GODASE', marks: [[35,25],[43,33],[38,27],[35,25],[38,30],[36,27],[35,31],[35,0]] },
      { regNo: '8080104', name: 'ADITYA SHRINIVAS SARODE', marks: [[60,43],[55,48],[62,30],[36,28],[63,47],[68,45],[53,43],[43,0]] },
      { regNo: '8080105', name: 'ANKIT BAGEWADI', marks: [[35,0],[35,0],[35,0],[35,0],[35,0],[35,0],[35,0],[35,0]] },
      { regNo: '8080106', name: 'ANKIT MALLIKARJUN GAVIMATH', marks: [[35,0],[35,0],[35,0],[35,0],[35,0],[35,0],[35,25],[35,0]] },
      { regNo: '8080107', name: 'ARIHANT DEVENDRA PATIL', marks: [[37,18],[39,25],[41,26],[37,28],[40,31],[52,32],[51,25],[41,0]] },
      { regNo: '8080108', name: 'ARUN RAJENDRA BHAGANNAVAR', marks: [[44,33],[43,32],[46,31],[35,25],[38,33],[47,37],[46,25],[35,0]] },
      { regNo: '8080109', name: 'ARUN SHANKAR RAVAL', marks: [[35,0],[35,0],[35,0],[35,0],[35,0],[35,0],[35,0],[35,0]] },
      { regNo: '8080110', name: 'ATHARV SHETTY', marks: [[56,46],[63,48],[67,48],[52,44],[65,49],[69,50],[47,37],[50,0]] },
      { regNo: '8080111', name: 'BALAPPA GUNDU DODDAKALLANNAVAR', marks: [[68,39],[65,50],[66,34],[51,38],[59,47],[68,42],[45,34],[37,0]] },
      { regNo: '8080113', name: 'DARSHAN LAXMAN GUNJETKAR', marks: [[35,0],[35,0],[35,0],[35,0],[35,0],[35,0],[35,0],[35,0]] },
      { regNo: '8080114', name: 'H FHIMUDDIN', marks: [[35,19],[39,17],[39,20],[36,28],[37,32],[37,27],[35,25],[35,0]] },
      { regNo: '8080115', name: 'HARSH PATIL', marks: [[56,30],[54,42],[53,28],[52,47],[58,45],[68,42],[47,29],[44,0]] },
      { regNo: '8080116', name: 'JILANI SHABBIR VAKKUND', marks: [[35,0],[35,0],[35,0],[35,0],[35,0],[35,0],[35,0],[35,0]] },
      { regNo: '8080117', name: 'KHUSHI TARALE', marks: [[50,47],[53,46],[65,35],[51,45],[51,45],[68,37],[44,34],[38,0]] },
      { regNo: '8080118', name: 'MAHALAKSHMEE MANJUNATH BADIGER', marks: [[50,33],[51,45],[53,36],[51,41],[59,43],[65,40],[50,37],[48,0]] },
      { regNo: '8080119', name: 'MAHESH MAHADEV NESARKAR', marks: [[35,10],[42,25],[39,25],[35,25],[38,25],[43,30],[35,25],[45,0]] },
      { regNo: '8080120', name: 'MEHRUNBEE DASTGEER MULLA', marks: [[57,48],[54,50],[65,46],[55,46],[65,49],[69,48],[69,49],[36,0]] },
      { regNo: '8080121', name: 'MOHAMADANIYAZ JAKIRHUSEN BAGAWAN', marks: [[70,48],[69,49],[70,44],[59,47],[69,50],[69,50],[70,49],[37,0]] },
      { regNo: '8080122', name: 'MOHAMMADIBRAHIM FAROOQ BASARIKATTI', marks: [[42,27],[42,40],[48,25],[48,35],[39,43],[56,38],[41,30],[40,0]] },
      { regNo: '8080123', name: 'NAGAVENI PATIL', marks: [[58,45],[65,50],[63,40],[49,40],[62,50],[69,45],[58,42],[55,0]] },
      { regNo: '8080124', name: 'NAVEED DAFEDAR', marks: [[35,27],[38,17],[38,30],[35,25],[36,34],[52,32],[35,25],[45,0]] },
      { regNo: '8080125', name: 'NAVEENKUMAR NAGARAJ SARAVARI', marks: [[35,10],[37,8],[37,12],[35,25],[35,25],[35,25],[35,30],[35,0]] },
      { regNo: '8080126', name: 'PRAJWAL RAJU GADIWADDAR', marks: [[35,38],[43,30],[51,33],[35,25],[37,42],[51,42],[42,34],[35,0]] },
      { regNo: '8080127', name: 'RAKSHITA RAMESH KAMBLE', marks: [[50,40],[43,42],[50,33],[51,42],[54,43],[56,32],[46,35],[35,0]] },
      { regNo: '8080128', name: 'SALONI BELGAONKAR', marks: [[55,38],[47,37],[60,31],[56,35],[55,48],[67,40],[42,37],[48,0]] },
      { regNo: '8080129', name: 'SAMARTH NARAYAN SUNTHAKAR', marks: [[60,38],[59,50],[67,36],[53,42],[62,45],[59,50],[51,25],[39,0]] },
      { regNo: '8080130', name: 'SANAN ASIF MOMIN', marks: [[35,29],[39,34],[41,32],[35,25],[37,39],[57,40],[44,36],[42,0]] },
      { regNo: '8080132', name: 'SANKET GOVINDRAY MESTA', marks: [[35,39],[39,43],[49,34],[36,26],[37,28],[37,25],[25,39],[35,0]] },
      { regNo: '8080133', name: 'SANKET NARAYAN TAMMANACHE', marks: [[35,31],[38,25],[44,31],[35,25],[37,0],[42,25],[40,28],[43,0]] },
      { regNo: '8080134', name: 'SATISH SHASHIKUMAR CHIMANAPPAGOL', marks: [[35,30],[38,33],[41,29],[35,25],[37,34],[51,30],[35,25],[45,0]] },
      { regNo: '8080135', name: 'SHREEHARI SANADI', marks: [[38,26],[38,33],[39,33],[35,25],[37,35],[48,30],[35,25],[35,0]] },
      { regNo: '8080136', name: 'SHREYAS KISAN NILAJKAR', marks: [[35,25],[39,33],[38,32],[35,25],[37,30],[38,30],[35,25],[50,0]] },
      { regNo: '8080137', name: 'SOURABH NARAYAN APTEKAR', marks: [[35,20],[38,4],[38,30],[35,25],[37,0],[37,25],[35,25],[35,0]] },
      { regNo: '8080138', name: 'SUDEEP MAHESH HUCHCHARAYAPPAGOL', marks: [[37,26],[38,28],[42,27],[37,27],[36,43],[36,30],[35,0],[36,0]] },
      { regNo: '8080139', name: 'SURAJ YALLAPPA BHANDARI', marks: [[35,29],[39,25],[38,27],[35,27],[36,38],[42,32],[35,28],[35,0]] },
      { regNo: '8080140', name: 'SWAYAM SANDEEP ROKADE', marks: [[35,27],[43,30],[59,30],[36,25],[37,35],[43,40],[35,25],[35,0]] },
      { regNo: '8080141', name: 'TEJAS CHANDRAKANT PATHARVAT', marks: [[35,27],[39,27],[39,27],[38,25],[39,39],[58,31],[35,31],[44,0]] },
      { regNo: '8080142', name: 'TUKARAM PRAKASH PAGADE', marks: [[50,39],[52,45],[56,36],[54,42],[58,43],[68,46],[45,37],[46,0]] },
      { regNo: '8080144', name: 'VIGNESH NARASIMHA BALLARI', marks: [[36,0],[35,0],[42,0],[35,25],[35,0],[35,0],[35,0],[35,0]] },
      { regNo: '8080146', name: 'AKASH N SHINGANNAVAR', marks: [[35,16],[40,11],[42,25],[36,25],[38,0],[37,28],[47,25],[42,0]] },
      { regNo: '8080147', name: 'MOHAMMAD TAHIR ABDUL BASIT SOUDAGAR', marks: [[35,13],[39,25],[46,25],[35,25],[35,34],[39,30],[61,32],[38,0]] },
      { regNo: '8080149', name: 'NEIL SHAHAPETI', marks: [[35,12],[40,13],[38,14],[35,25],[36,25],[36,25],[35,25],[37,0]] }
    ];

    for (const s of pdfStudents) {
      const password = await bcrypt.hash(s.name.trim().toLowerCase().replace(/\s+/g, ' '), 10);
      StudentRepository.save({
        regNo: s.regNo,
        name: s.name,
        department: 'Artificial Intelligence & Machine Learning',
        semester: 3,
        status: 'Active',
        password
      });
      
      const resultData: any = {
        regNo: s.regNo,
        semester: 3
      };

      for (let i = 0; i < 8; i++) {
        resultData[`subject${i+1}_ia`] = s.marks[i][0];
        resultData[`subject${i+1}_e`] = s.marks[i][1];
      }

      ResultService.saveResult(resultData, email);
    }

    for (const s of secondSemResults) {
      const resultData: any = {
        regNo: s.regNo,
        semester: 2
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
