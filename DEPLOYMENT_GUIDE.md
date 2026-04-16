# GTTC Result Management System - Beginner's Deployment Guide

This guide is designed for beginners to help you deploy the **GTTC Result Management System** from scratch with zero errors.

---

## 🛠 Prerequisites
1. **GitHub Account**: To host your code.
2. **Railway.app Account**: To host your Backend and Database (Free tier available).
3. **Vercel Account**: To host your Frontend (Free tier available).
4. **Node.js installed**: For local testing.

---

## 📁 Project Structure Overview
- `/frontend`: The React/HTML/JS user interface.
- `/backend`: The Express.js server and API logic.
- `gttc_results.db`: The local SQLite database (for development).

---

## 🚀 Step 1: Prepare Your Code
1. **Push to GitHub**:
   - Create a new repository on GitHub.
   - Initialize git in your project folder: `git init`
   - Add files: `git add .`
   - Commit: `git commit -m "Initial commit"`
   - Push to GitHub: `git remote add origin <your-repo-url>` and `git push -u origin main`

---

## 🗄 Step 2: Database Setup (MySQL)
While the app uses SQLite locally, **MySQL** is better for production.

1. **On Railway.app**:
   - Click **"New Project"** -> **"Provision MySQL"**.
   - Once created, click on the MySQL service and go to the **"Variables"** tab.
   - Copy these values: `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`.

2. **Initialize Tables**:
   - Use a tool like **MySQL Workbench** or Railway's built-in **Query Editor**.
   - Copy and run the SQL script from `mysql_setup.md` or the bottom of this guide.

---

## ⚙️ Step 3: Backend Deployment (Railway)
1. **On Railway.app**:
   - Click **"New Project"** -> **"GitHub Repo"** -> Select your repository.
   - Go to **"Variables"** and add:
     - `MYSQL_URL`: (Railway provides this automatically if you linked the services)
     - `JWT_SECRET`: `your_random_secret_key_here` (Make it long and complex 
     - `NODE_ENV`: `production`
     - `PORT`: `3000`
   - Go to **"Settings"** -> **"Public Networking"** -> Click **"Generate Domain"**.
   - **Copy your Backend URL** (e.g., `https://backend-production-xxxx.up.railway.app`).

---

## 💻 Step 4: Frontend Deployment (Vercel)
1. **On Vercel.com**:
   - Click **"Add New"** -> **"Project"**.
   - Import your GitHub repository.
   - **Configure Project**:
     - Framework Preset: `Vite` (or `Other` if using plain HTML).
     - **Environment Variables**:
       - `VITE_API_URL`: Paste your **Backend URL** followed by `/api` (e.g., `https://backend-production-xxxx.up.railway.app/api`).
       - `VITE_GEMINI_API_KEY`: Paste your **Gemini API Key** (This is needed for frontend AI features).
   - Click **"Deploy"**.

---

## 📝 SQL Initialization Script
Run this to set up your production database:

```sql
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  regNo VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  department VARCHAR(100),
  semester INT,
  dob DATE,
  status VARCHAR(20) DEFAULT 'Active',
  password VARCHAR(255) NOT NULL
);

CREATE TABLE results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  regNo VARCHAR(50) NOT NULL,
  semester INT NOT NULL,
  subject1_ia INT, subject1_e INT, subject1_t INT,
  subject2_ia INT, subject2_e INT, subject2_t INT,
  subject3_ia INT, subject3_e INT, subject3_t INT,
  subject4_ia INT, subject4_e INT, subject4_t INT,
  subject5_ia INT, subject5_e INT, subject5_t INT,
  subject6_ia INT, subject6_e INT, subject6_t INT,
  subject7_ia INT, subject7_e INT, subject7_t INT,
  subject8_ia INT, subject8_e INT, subject8_t INT,
  total INT, avg FLOAT, result VARCHAR(10),
  UNIQUE(regNo, semester)
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
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
  `key` VARCHAR(50) PRIMARY KEY,
  `value` TEXT
);

-- Default Admin (Password: Tukaram@2007)
INSERT INTO admins (email, password) VALUES ('tukarampagade781@gmail.com', '$2b$10$7Z6zE8.z5qZ6zE8.z5qZ6zE8.z5qZ6zE8.z5qZ6zE8.z5qZ6zE8.z5q');
```

---

## 🔍 Troubleshooting & Common Pitfalls
1. **CORS Error**: 
   - **Symptom**: Frontend cannot talk to Backend.
   - **Fix**: Ensure `VITE_API_URL` in Vercel is exactly your Railway URL + `/api`.
2. **Gemini API Key**: 
   - **Symptom**: AI Insights don't work.
   - **Fix**: Ensure `VITE_GEMINI_API_KEY` is set in Vercel.
3. **Database Connection**: 
   - **Symptom**: Server crashes on start.
   - **Fix**: Ensure you have provisioned MySQL on Railway and the `MYSQL_URL` variable is present.
4. **Login Issues**:
   - **Symptom**: "Invalid credentials" even with correct password.
   - **Fix**: Ensure the `JWT_SECRET` is set.
5. **Port Binding**:
   - **Symptom**: Railway deployment fails with "Port not found".
   - **Fix**: Ensure your `server.ts` uses `process.env.PORT || 3000`.

---
*Created by Tukaram Pagade*
