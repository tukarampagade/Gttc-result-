import type { Request, Response } from 'express';
import { ResultService } from '../services/ResultService.js';
import { ApiResponse } from '../util/ApiResponse.js';

export class ResultController {
  static getResult(req: any, res: Response) {
    try {
      const { regNo } = req.user;
      const semester = req.query.semester ? parseInt(req.query.semester as string) : undefined;
      const result = ResultService.getResult(regNo, semester);

      if (result) {
        res.json(ApiResponse.ok('Result found', result));
      } else {
        res.status(404).json(ApiResponse.error('Result not found'));
      }
    } catch (error: any) {
      res.status(500).json(ApiResponse.error(error.message));
    }
  }

  static getHistory(req: any, res: Response) {
    try {
      const { regNo } = req.user;
      const history = ResultService.getHistory(regNo);

      if (history) {
        res.json(ApiResponse.ok('History found', history));
      } else {
        res.status(404).json(ApiResponse.error('History not found'));
      }
    } catch (error: any) {
      res.status(500).json(ApiResponse.error(error.message));
    }
  }
}
