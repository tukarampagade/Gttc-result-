import db from './config/db.ts';

const students = db.prepare('SELECT regNo, name, password FROM students').all();
console.log('Students in DB:', JSON.stringify(students, null, 2));

const admins = db.prepare('SELECT email FROM admins').all();
console.log('Admins in DB:', JSON.stringify(admins, null, 2));
