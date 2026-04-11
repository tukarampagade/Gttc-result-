import type { Request, Response } from 'express';
import { PdfService } from '../services/PdfService.js';
import { CsvService } from '../services/CsvService.js';
import { OfficeService } from '../services/OfficeService.js';
import { ApiResponse } from '../util/ApiResponse.js';

export class UploadController {
  static async uploadFile(req: any, res: Response) {
    if (!req.file) {
      return res.status(400).json(ApiResponse.error('No file uploaded'));
    }

    const filename = req.file.originalname.toLowerCase();
    const buffer = req.file.buffer;
    const adminEmail = req.user.email;

    try {
      let results;
      if (filename.endsWith('.pdf')) {
        results = await PdfService.parseAndStore(buffer, adminEmail);
      } else if (filename.endsWith('.csv')) {
        results = await CsvService.parseAndStore(buffer, adminEmail);
      } else if (filename.endsWith('.docx') || filename.endsWith('.pptx')) {
        results = await OfficeService.parseAndStore(buffer, adminEmail, filename);
      } else {
        return res.status(400).json(ApiResponse.error('Unsupported file format. Please upload PDF, CSV, DOCX, or PPTX.'));
      }

      res.json(ApiResponse.ok(`${filename.split('.').pop()?.toUpperCase()} processed successfully`, { count: results.length }));
    } catch (error: any) {
      res.status(500).json(ApiResponse.error(`Error processing ${filename}: ` + error.message));
    }
  }

  static async uploadPdf(req: any, res: Response) {
    return UploadController.uploadFile(req, res);
  }

  static async uploadCsv(req: any, res: Response) {
    return UploadController.uploadFile(req, res);
  }
}
