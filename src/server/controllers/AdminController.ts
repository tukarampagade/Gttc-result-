import type { Request, Response } from 'express';
import { AdminService } from '../services/AdminService.ts';
import { ResultService } from '../services/ResultService.ts';
import { ApiResponse } from '../util/ApiResponse.ts';
import { verifyToken } from '../util/JwtUtil.ts';

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
      const students = AdminService.getStudents();
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
      const results = AdminService.getResults();
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
    const logs = AdminService.getAuditLogs();
    res.json(ApiResponse.ok('Audit logs retrieved', logs));
  }
}
