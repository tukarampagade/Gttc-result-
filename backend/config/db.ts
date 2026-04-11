import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'gttc_results.db');
let db: any;

function initDb() {
  try {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    
    // Initialize tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        regNo TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        department TEXT,
        semester INTEGER,
        dob TEXT,
        status TEXT DEFAULT 'Active',
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        regNo TEXT NOT NULL,
        semester INTEGER NOT NULL,
        subject1_ia INTEGER DEFAULT 0, subject1_e INTEGER DEFAULT 0, subject1_t INTEGER DEFAULT 0,
        subject2_ia INTEGER DEFAULT 0, subject2_e INTEGER DEFAULT 0, subject2_t INTEGER DEFAULT 0,
        subject3_ia INTEGER DEFAULT 0, subject3_e INTEGER DEFAULT 0, subject3_t INTEGER DEFAULT 0,
        subject4_ia INTEGER DEFAULT 0, subject4_e INTEGER DEFAULT 0, subject4_t INTEGER DEFAULT 0,
        subject5_ia INTEGER DEFAULT 0, subject5_e INTEGER DEFAULT 0, subject5_t INTEGER DEFAULT 0,
        subject6_ia INTEGER DEFAULT 0, subject6_e INTEGER DEFAULT 0, subject6_t INTEGER DEFAULT 0,
        subject7_ia INTEGER DEFAULT 0, subject7_e INTEGER DEFAULT 0, subject7_t INTEGER DEFAULT 0,
        subject8_ia INTEGER DEFAULT 0, subject8_e INTEGER DEFAULT 0, subject8_t INTEGER DEFAULT 0,
        total INTEGER DEFAULT 0,
        avg REAL DEFAULT 0,
        result TEXT DEFAULT 'FAIL',
        UNIQUE(regNo, semester)
      );

      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        user TEXT NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Seed default theme color
    const defaultColor = db.prepare('SELECT * FROM settings WHERE key = ?').get('theme_color');
    if (!defaultColor) {
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('theme_color', '#0f172a');
    }

    // Migrations
    const auditTableInfo = db.prepare("PRAGMA table_info(audit_logs)").all();
    if (!auditTableInfo.some((col: any) => col.name === 'details')) {
      db.exec("ALTER TABLE audit_logs ADD COLUMN details TEXT");
    }

    const studentTableInfo = db.prepare("PRAGMA table_info(students)").all();
    const studentCols = studentTableInfo.map((col: any) => col.name);
    if (!studentCols.includes('email')) db.exec("ALTER TABLE students ADD COLUMN email TEXT");
    if (!studentCols.includes('department')) db.exec("ALTER TABLE students ADD COLUMN department TEXT");
    if (!studentCols.includes('semester')) db.exec("ALTER TABLE students ADD COLUMN semester INTEGER");
    if (!studentCols.includes('dob')) db.exec("ALTER TABLE students ADD COLUMN dob TEXT");
    if (!studentCols.includes('status')) db.exec("ALTER TABLE students ADD COLUMN status TEXT DEFAULT 'Active'");

  } catch (err: any) {
    if (err.code === 'SQLITE_CORRUPT' || err.message.includes('malformed')) {
      console.error('Database corruption detected. Recreating...', err);
      if (db) db.close();
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      initDb(); // Retry once
    } else {
      throw err;
    }
  }
}

initDb();

export default db;
