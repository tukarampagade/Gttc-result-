import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'gttc_results.db');
const db = new Database(dbPath);

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
    subject1 INTEGER DEFAULT 0,
    subject2 INTEGER DEFAULT 0,
    subject3 INTEGER DEFAULT 0,
    subject4 INTEGER DEFAULT 0,
    subject5 INTEGER DEFAULT 0,
    subject6 INTEGER DEFAULT 0,
    subject7 INTEGER DEFAULT 0,
    subject8 INTEGER DEFAULT 0,
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
`);

// Migration: Add details column to audit_logs if it doesn't exist
const auditTableInfo = db.prepare("PRAGMA table_info(audit_logs)").all();
const hasDetails = auditTableInfo.some((col: any) => col.name === 'details');
if (!hasDetails) {
  db.exec("ALTER TABLE audit_logs ADD COLUMN details TEXT");
}

// Migration: Add new columns to students if they don't exist
const studentTableInfo = db.prepare("PRAGMA table_info(students)").all();
const studentCols = studentTableInfo.map((col: any) => col.name);

if (!studentCols.includes('email')) db.exec("ALTER TABLE students ADD COLUMN email TEXT");
if (!studentCols.includes('department')) db.exec("ALTER TABLE students ADD COLUMN department TEXT");
if (!studentCols.includes('semester')) db.exec("ALTER TABLE students ADD COLUMN semester INTEGER");
if (!studentCols.includes('dob')) db.exec("ALTER TABLE students ADD COLUMN dob TEXT");
if (!studentCols.includes('status')) db.exec("ALTER TABLE students ADD COLUMN status TEXT DEFAULT 'Active'");

// Migration: Update results table for historical support
const resultTableInfo = db.prepare("PRAGMA table_info(results)").all();
const resultCols = resultTableInfo.map((col: any) => col.name);

if (!resultCols.includes('semester')) {
  console.log('Migrating results table for historical support...');
  db.transaction(() => {
    // 1. Create new table with correct schema
    db.exec(`
      CREATE TABLE results_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        regNo TEXT NOT NULL,
        semester INTEGER NOT NULL,
        subject1 INTEGER DEFAULT 0,
        subject2 INTEGER DEFAULT 0,
        subject3 INTEGER DEFAULT 0,
        subject4 INTEGER DEFAULT 0,
        subject5 INTEGER DEFAULT 0,
        subject6 INTEGER DEFAULT 0,
        subject7 INTEGER DEFAULT 0,
        subject8 INTEGER DEFAULT 0,
        total INTEGER DEFAULT 0,
        avg REAL DEFAULT 0,
        result TEXT DEFAULT 'FAIL',
        UNIQUE(regNo, semester)
      )
    `);

    // 2. Copy data from old table, assuming existing results are for semester 3 (as per previous context)
    db.exec(`
      INSERT INTO results_new (regNo, semester, subject1, subject2, subject3, subject4, subject5, subject6, subject7, subject8, total, avg, result)
      SELECT regNo, 3, subject1, subject2, subject3, subject4, subject5, subject6, subject7, subject8, total, avg, result
      FROM results
    `);

    // 3. Drop old table and rename new one
    db.exec("DROP TABLE results");
    db.exec("ALTER TABLE results_new RENAME TO results");
  })();
}

// Seed Admin if not exists
const adminEmail = 'tukarampagade781@gmail.com';
const adminPassword = 'Tukaram@2007'; // Will be hashed in the service, but for seeding we need a way.
// Actually, I'll seed it in the AuthService or a separate seed script.

export default db;
