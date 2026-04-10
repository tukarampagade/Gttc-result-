import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import { AuthController } from './controllers/AuthController.ts';
import { ResultController } from './controllers/ResultController.ts';
import { AdminController } from './controllers/AdminController.ts';
import { UploadController } from './controllers/UploadController.ts';
import { authenticateToken, authorizeAdmin } from './config/JwtFilter.ts';
import { AuthService } from './services/AuthService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Auth Routes
app.post('/api/auth/login', AuthController.login);

// Student Routes
app.get('/api/result/get', authenticateToken, ResultController.getResult);
app.get('/api/result/history', authenticateToken, ResultController.getHistory);

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
app.post('/api/admin/upload-pdf', authenticateToken, authorizeAdmin, upload.single('pdf'), UploadController.uploadPdf);

// Fallback to index.html for SPA behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Seed Admin and Start Server
AuthService.seedAdmin().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
