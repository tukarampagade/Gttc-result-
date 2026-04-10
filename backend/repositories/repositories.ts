import db from '../config/db.js';

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

  static findAll(page: number = 1, limit: number = 10, status?: string) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM students';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY regNo ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  }

  static count(status?: string) {
    let query = 'SELECT COUNT(*) as count FROM students';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    return (db.prepare(query).get(...params) as any).count;
  }

  static findByDepartment(dept: string) {
    return db.prepare('SELECT * FROM students WHERE department = ?').all(dept);
  }

  static bulkUpdateStatus(regNos: string[], status: string) {
    const placeholders = regNos.map(() => '?').join(',');
    return db.prepare(`UPDATE students SET status = ? WHERE regNo IN (${placeholders})`).run(status, ...regNos);
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
      INSERT OR REPLACE INTO results (
        regNo, semester, 
        subject1_ia, subject1_e, subject1_t,
        subject2_ia, subject2_e, subject2_t,
        subject3_ia, subject3_e, subject3_t,
        subject4_ia, subject4_e, subject4_t,
        subject5_ia, subject5_e, subject5_t,
        subject6_ia, subject6_e, subject6_t,
        subject7_ia, subject7_e, subject7_t,
        subject8_ia, subject8_e, subject8_t,
        total, avg, result
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      result.regNo,
      result.semester || 3,
      result.subject1_ia, result.subject1_e, result.subject1_t,
      result.subject2_ia, result.subject2_e, result.subject2_t,
      result.subject3_ia, result.subject3_e, result.subject3_t,
      result.subject4_ia, result.subject4_e, result.subject4_t,
      result.subject5_ia, result.subject5_e, result.subject5_t,
      result.subject6_ia, result.subject6_e, result.subject6_t,
      result.subject7_ia, result.subject7_e, result.subject7_t,
      result.subject8_ia, result.subject8_e, result.subject8_t,
      result.total,
      result.avg,
      result.result
    );
  }

  static findAll(page: number = 1, limit: number = 10, semester?: number, status?: string) {
    const offset = (page - 1) * limit;
    let query = 'SELECT r.*, s.status as studentStatus FROM results r JOIN students s ON r.regNo = s.regNo';
    const params: any[] = [];
    const conditions: string[] = [];

    if (semester) {
      conditions.push('r.semester = ?');
      params.push(semester);
    }

    if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.regNo ASC, r.semester DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  }

  static count(semester?: number, status?: string) {
    let query = 'SELECT COUNT(*) as count FROM results r JOIN students s ON r.regNo = s.regNo';
    const params: any[] = [];
    const conditions: string[] = [];

    if (semester) {
      conditions.push('r.semester = ?');
      params.push(semester);
    }

    if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    return (db.prepare(query).get(...params) as any).count;
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
    if (log.timestamp) {
      const stmt = db.prepare('INSERT INTO audit_logs (action, user, details, timestamp) VALUES (?, ?, ?, ?)');
      return stmt.run(log.action, log.user, log.details || null, log.timestamp);
    }
    const stmt = db.prepare('INSERT INTO audit_logs (action, user, details) VALUES (?, ?, ?)');
    return stmt.run(log.action, log.user, log.details || null);
  }

  static findAll(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    return db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?').all(limit, offset);
  }

  static count() {
    return (db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as any).count;
  }
}

export class SettingsRepository {
  static get(key: string) {
    const res = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
    return res ? res.value : null;
  }

  static set(key: string, value: string) {
    return db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }
}
