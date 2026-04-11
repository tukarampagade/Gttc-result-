import type { Request, Response } from 'express';
import { AdminService } from '../services/AdminService.js';
import { ResultService } from '../services/ResultService.js';
import { ApiResponse } from '../util/ApiResponse.js';
import { verifyToken } from '../util/JwtUtil.js';

export class AdminController {
  static async addStudent(req: any, res: Response) {
    try {
      await AdminService.addStudent(req.body, req.user.email || req.user.regNo);
      res.json(ApiResponse.ok('Student added successfully'));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  static async updateStudent(req: any, res: Response) {
    try {
      await AdminService.updateStudent(req.body, req.user.email || req.user.regNo);
      res.json(ApiResponse.ok('Student updated successfully'));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  static async deleteStudent(req: any, res: Response) {
    try {
      await AdminService.deleteStudent(req.params.regNo, req.user.email || req.user.regNo);
      res.json(ApiResponse.ok('Student deleted successfully'));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  static async getStudents(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const sort = req.query.sort as string || 'regNo';
      const order = req.query.order as string || 'ASC';
      const students = AdminService.getStudents(page, limit, status, sort, order);
      res.json(ApiResponse.ok('Students retrieved', students));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  static async getStudentResult(req: any, res: Response) {
    try {
      const semester = req.query.semester ? parseInt(req.query.semester as string) : undefined;
      const result = await ResultService.getResultByRegNo(req.params.regNo, semester);
      res.json(ApiResponse.ok('Result retrieved', result));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  static async addResult(req: any, res: Response) {
    try {
      await ResultService.saveResult(req.body, req.user.email || req.user.regNo);
      res.json(ApiResponse.ok('Result added successfully'));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  static async updateResult(req: any, res: Response) {
    try {
      await ResultService.saveResult(req.body, req.user.email || req.user.regNo);
      res.json(ApiResponse.ok('Result updated successfully'));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  static async getResults(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const semester = req.query.semester ? parseInt(req.query.semester as string) : undefined;
      const status = req.query.status as string;
      const results = AdminService.getResults(page, limit, semester, status);
      res.json(ApiResponse.ok('Results retrieved', results));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  static getAnalytics(req: Request, res: Response) {
    const analytics = AdminService.getAnalytics();
    res.json(ApiResponse.ok('Analytics retrieved', analytics));
  }

  static getAuditLogs(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const logs = AdminService.getAuditLogs(page, limit);
      res.json(ApiResponse.ok('Audit logs retrieved', logs));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  static getThemeColor(req: Request, res: Response) {
    const color = AdminService.getThemeColor();
    res.json(ApiResponse.ok('Theme color retrieved', color));
  }

  static async updateThemeColor(req: any, res: Response) {
    try {
      const { color } = req.body;
      if (!color) throw new Error('Color is required');
      await AdminService.updateThemeColor(color, req.user.email || req.user.regNo);
      res.json(ApiResponse.ok('Theme color updated successfully'));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  static async bulkUpdateStudentStatus(req: any, res: Response) {
    try {
      const { regNos, status } = req.body;
      if (!regNos || !status) throw new Error('regNos and status are required');
      await AdminService.bulkUpdateStudentStatus(regNos, status, req.user.email || req.user.regNo);
      res.json(ApiResponse.ok('Student statuses updated successfully'));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  static async bulkDeleteResults(req: any, res: Response) {
    try {
      const { regNos, semester } = req.body;
      if (!regNos || !semester) throw new Error('regNos and semester are required');
      await AdminService.bulkDeleteResults(regNos, parseInt(semester), req.user.email || req.user.regNo);
      res.json(ApiResponse.ok('Results deleted successfully'));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  static async analyzeStudent(req: any, res: Response) {
    try {
      const { regNo } = req.params;
      const student: any = await AdminService.getStudentByRegNo(regNo);
      if (!student) throw new Error('Student not found');

      const historyData = await ResultService.getHistory(regNo);
      const results = historyData?.history || [];

      if (results.length === 0) {
        throw new Error('No results found for this student to analyze');
      }

      const { GeminiService } = await import('../services/GeminiService.js');
      const analysis = await GeminiService.analyzePerformance(student, results);
      res.json(ApiResponse.ok('Analysis completed', analysis));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }
}
