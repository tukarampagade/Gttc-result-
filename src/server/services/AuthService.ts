import bcrypt from 'bcryptjs';
import db from '../config/db.ts';
import { StudentRepository, AdminRepository, AuditRepository, ResultRepository } from '../repositories/repositories.ts';
import { generateToken } from '../util/JwtUtil.ts';

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
      // Force update password to ensure it matches our known value
      db.prepare('UPDATE admins SET password = ? WHERE email = ?').run(hashedPassword, email);
      console.log('Admin password reset successfully');
    }

      // Seed some test audit logs for result history
      AuditRepository.save({
        action: 'ADD_RESULT',
        user: email,
        details: 'RegNo: 8080142, Total: 850, Status: PASS',
        timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      });
      AuditRepository.save({
        action: 'UPDATE_RESULT',
        user: email,
        details: 'RegNo: 8080142, Total: 865, Status: PASS',
        timestamp: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
      });
      AuditRepository.save({
        action: 'ADD_RESULT',
        user: email,
        details: 'RegNo: 8080143, Total: 420, Status: FAIL',
        timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      });

    // Seed a test student (independent of admin check)
    const studentRegNo = '8080142';
    const studentName = 'Tukaram Pagade';
    console.log(`Seeding test student ${studentRegNo}...`);
    const studentPassword = await bcrypt.hash(studentName.toLowerCase(), 10);
    
    // Force re-seed to ensure name and password match our test credentials
    const existingStudent: any = StudentRepository.findByRegNo(studentRegNo);
    if (existingStudent) {
      console.log(`Student ${studentRegNo} exists, updating name and password...`);
      db.prepare('UPDATE students SET name = ?, password = ? WHERE regNo = ?')
        .run(studentName, studentPassword, studentRegNo);
    } else {
      console.log(`Student ${studentRegNo} does not exist, saving...`);
      StudentRepository.save({
        regNo: studentRegNo,
        name: studentName,
        email: 'tukaram@example.com',
        department: 'Artificial Intelligence',
        semester: 3,
        dob: '2007-01-01',
        status: 'Active',
        password: studentPassword
      });
    }

    // Ensure a result exists for the student
    const existingResult = ResultRepository.findByRegNo(studentRegNo);
    if (!existingResult) {
      ResultRepository.save({
        regNo: studentRegNo,
        subject1: 95,
        subject2: 88,
        subject3: 92,
        subject4: 85,
        subject5: 110,
        subject6: 105,
        subject7: 98,
        subject8: 112,
        total: 785,
        avg: 98.125,
        result: 'PASS'
      });
      console.log('Result seeded successfully');
    }
  }
}
