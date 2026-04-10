// ✅ ADD THIS AT VERY TOP
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import { AuthController } from './controllers/AuthController.js';
import { ResultController } from './controllers/ResultController.js';
import { AdminController } from './controllers/AdminController.js';
import { UploadController } from './controllers/UploadController.js';
import { authenticateToken, authorizeAdmin } from './config/JwtFilter.js';
import { AuthService } from './services/AuthService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Auth Routes
app.post('/api/auth/login', AuthController.login);

// Student Routes
app.get('/api/result/get', authenticateToken, ResultController.getResult);
app.get('/api/result/history', authenticateToken, ResultController.getHistory);
app.get('/api/theme/color', AdminController.getThemeColor);

// Admin Routes
app.get('/api/admin/students', authenticateToken, authorizeAdmin, AdminController.getStudents);
app.get('/api/admin/results', authenticateToken, authorizeAdmin, AdminController.getResults);
app.post('/api/admin/add-student', authenticateToken, authorizeAdmin, AdminController.addStudent);
app.put('/api/admin/update-student', authenticateToken, authorizeAdmin, AdminController.updateStudent);
app.delete('/api/admin/delete-student/:regNo', authenticateToken, authorizeAdmin, AdminController.deleteStudent);
app.get('/api/admin/result/:regNo', authenticateToken, authorizeAdmin, AdminController.getStudentResult);
app.post('/api/admin/add-result', authenticateToken, authorizeAdmin, AdminController.addResult);
app.put('/api/admin/update-result', authenticateToken, authorizeAdmin, AdminController.updateResult);
app.get('/api/admin/analytics', authenticateToken, authorizeAdmin, AdminController.getAnalytics);
app.get('/api/admin/audit-logs', authenticateToken, authorizeAdmin, AdminController.getAuditLogs);
app.post('/api/admin/update-theme', authenticateToken, authorizeAdmin, AdminController.updateThemeColor);
app.post('/api/admin/bulk-update-status', authenticateToken, authorizeAdmin, AdminController.bulkUpdateStudentStatus);
app.get('/api/admin/analyze-student/:regNo', authenticateToken, authorizeAdmin, AdminController.analyzeStudent);
app.post('/api/admin/upload-pdf', authenticateToken, authorizeAdmin, upload.single('pdf'), UploadController.uploadPdf);
app.post('/api/admin/upload-csv', authenticateToken, authorizeAdmin, upload.single('csv'), UploadController.uploadCsv);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
AuthService.seedAdmin().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
});