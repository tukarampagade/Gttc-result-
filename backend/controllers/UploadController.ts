import type { Request, Response } from 'express';
import { PdfService } from '../services/PdfService.js';
import { CsvService } from '../services/CsvService.js';
import { ApiResponse } from '../util/ApiResponse.js';

export class UploadController {
  static async uploadPdf(req: any, res: Response) {
    if (!req.file) {
      return res.status(400).json(ApiResponse.error('No file uploaded'));
    }

    try {
      const results = await PdfService.parseAndStore(req.file.buffer, req.user.email);
      res.json(ApiResponse.ok('PDF processed successfully', { count: results.length }));
    } catch (error: any) {
      res.status(500).json(ApiResponse.error('Error processing PDF: ' + error.message));
    }
  }

  static async uploadCsv(req: any, res: Response) {
    if (!req.file) {
      return res.status(400).json(ApiResponse.error('No file uploaded'));
    }

    try {
      const results = await CsvService.parseAndStore(req.file.buffer, req.user.email);
      res.json(ApiResponse.ok('CSV processed successfully', { count: results.length }));
    } catch (error: any) {
      res.status(500).json(ApiResponse.error('Error processing CSV: ' + error.message));
    }
  }
}
