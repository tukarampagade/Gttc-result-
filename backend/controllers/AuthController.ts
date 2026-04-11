import type { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { ApiResponse } from '../util/ApiResponse.js';

export class AuthController {
  static async login(req: Request, res: Response) {
    const { username, password, regNo, email } = req.body;
    const loginId = username || regNo || email;

    if (!loginId || !password) {
      return res.status(400).json(ApiResponse.error('Username/RegNo/Email and password are required'));
    }

    // Try student login first (loginId is regNo)
    let token = await AuthService.studentLogin(loginId, password);
    if (token) {
      return res.json(ApiResponse.ok('Login successful', { token, role: 'STUDENT' }));
    }

    // Try admin login (loginId is email)
    token = await AuthService.adminLogin(loginId, password);
    if (token) {
      return res.json(ApiResponse.ok('Admin login successful', { token, role: 'ADMIN' }));
    }

    res.status(401).json(ApiResponse.error('Invalid Roll Number or Full Name. Please check your details and try again.'));
  }
}
