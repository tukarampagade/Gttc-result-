import db from '../config/db.ts';

export class StudentRepository {
  static findByRegNo(regNo: string) {
    return db.prepare('SELECT * FROM students WHERE regNo = ?').get(regNo);
  }

  static save(student: any) {
    const stmt = db.prepare('INSERT INTO students (regNo, name, email, department, semester, dob, status, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    return stmt.run(student.regNo, student.name, student.email || null, student.department || null, student.semester || null, student.dob || null, student.status || 'Active', student.password);
  }

  static update(student: any) {
    const stmt = db.prepare('UPDATE students SET name = ?, email = ?, department = ?, semester = ?, dob = ?, status = ? WHERE regNo = ?');
    return stmt.run(student.name, student.email || null, student.department || null, student.semester || null, student.dob || null, student.status || 'Active', student.regNo);
  }

  static deleteByRegNo(regNo: string) {
    return db.prepare('DELETE FROM students WHERE regNo = ?').run(regNo);
  }

  static findAll() {
    return db.prepare('SELECT * FROM students').all();
  }

  static count() {
    return (db.prepare('SELECT COUNT(*) as count FROM students').get() as any).count;
  }

  static findByDepartment(dept: string) {
    return db.prepare('SELECT * FROM students WHERE department = ?').all(dept);
  }
}

export class ResultRepository {
  static findByRegNo(regNo: string, semester?: number) {
    if (semester) {
      return db.prepare('SELECT * FROM results WHERE regNo = ? AND semester = ?').get(regNo, semester);
    }
    // Return latest semester result if not specified
    return db.prepare('SELECT * FROM results WHERE regNo = ? ORDER BY semester DESC LIMIT 1').get(regNo);
  }

  static findAllByRegNo(regNo: string) {
    return db.prepare('SELECT * FROM results WHERE regNo = ? ORDER BY semester DESC').all(regNo);
  }

  static save(result: any) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO results (regNo, semester, subject1, subject2, subject3, subject4, subject5, subject6, subject7, subject8, total, avg, result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      result.regNo,
      result.semester || 3, // Default to 3 if not provided
      result.subject1,
      result.subject2,
      result.subject3,
      result.subject4,
      result.subject5,
      result.subject6,
      result.subject7,
      result.subject8,
      result.total,
      result.avg,
      result.result
    );
  }

  static findAll() {
    return db.prepare('SELECT * FROM results').all();
  }

  static count() {
    return (db.prepare('SELECT COUNT(*) as count FROM results').get() as any).count;
  }

  static deleteByRegNo(regNo: string) {
    return db.prepare('DELETE FROM results WHERE regNo = ?').run(regNo);
  }

  static getRank(regNo: string, semester: number) {
    const query = `
      SELECT COUNT(*) + 1 as rank
      FROM results r
      JOIN students s ON r.regNo = s.regNo
      WHERE r.semester = ? 
      AND s.department = (SELECT department FROM students WHERE regNo = ?)
      AND r.total > (SELECT total FROM results WHERE regNo = ? AND semester = ?)
    `;
    const result = db.prepare(query).get(semester, regNo, regNo, semester) as any;
    return result ? result.rank : null;
  }
}

export class AdminRepository {
  static findByEmail(email: string) {
    return db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  }

  static save(admin: any) {
    const stmt = db.prepare('INSERT INTO admins (email, password) VALUES (?, ?)');
    return stmt.run(admin.email, admin.password);
  }
}

export class AuditRepository {
  static save(log: any) {
    const stmt = db.prepare('INSERT INTO audit_logs (action, user, details) VALUES (?, ?, ?)');
    return stmt.run(log.action, log.user, log.details || null);
  }

  static findAll() {
    return db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC').all();
  }
}
