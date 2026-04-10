import type { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { ApiResponse } from '../util/ApiResponse.js';

export class AuthController {
  static async login(req: Request, res: Response) {
    const { username, password } = req.body;

    // Try student login first (username is regNo)
    let token = await AuthService.studentLogin(username, password);
    if (token) {
      return res.json(ApiResponse.ok('Login successful', { token, role: 'STUDENT' }));
    }

    // Try admin login (username is email)
    token = await AuthService.adminLogin(username, password);
    if (token) {
      return res.json(ApiResponse.ok('Admin login successful', { token, role: 'ADMIN' }));
    }

    res.status(401).json(ApiResponse.error('Invalid email or password. Please check your details and try again.'));
  }
}
