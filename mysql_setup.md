# MySQL Setup for GTTC Result Management System

To switch from SQLite to MySQL, follow these steps:

### 1. Install MySQL Driver
Run the following command in your terminal:
```bash
npm install mysql2
```

### 2. Update Database Configuration
Modify `backend/config/db.ts` to use `mysql2` instead of `better-sqlite3`.

```typescript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Tukaram@2007',
  database: 'gttc_results',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
```

### 3. Update Repositories
You will need to update the repository methods to use `async/await` and the MySQL pool syntax.

Example:
```typescript
static async findByRegNo(regNo: string) {
  const [rows] = await db.execute('SELECT * FROM students WHERE regNo = ?', [regNo]);
  return (rows as any[])[0];
}
```

### 4. Create Database and Tables
Run the following SQL in your MySQL Workbench or CLI:

```sql
CREATE DATABASE gttc_results;
USE gttc_results;

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  regNo VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  regNo VARCHAR(50) UNIQUE NOT NULL,
  subject1 INT DEFAULT 0,
  subject2 INT DEFAULT 0,
  subject3 INT DEFAULT 0,
  subject4 INT DEFAULT 0,
  subject5 INT DEFAULT 0,
  total INT DEFAULT 0,
  avg FLOAT DEFAULT 0,
  result VARCHAR(10) DEFAULT 'FAIL'
);

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  user VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Exporting the Project
To get a ZIP file of the project:
1. Go to the **Settings** menu (gear icon) in the top right of the AI Studio interface.
2. Select **Export to ZIP**.
3. This will download all the current files, including the new theme picker and MySQL instructions.
