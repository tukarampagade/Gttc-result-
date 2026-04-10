import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../util/JwtUtil.ts';
import { ApiResponse } from '../util/ApiResponse.ts';

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(ApiResponse.error('Access denied. No token provided.'));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json(ApiResponse.error('Invalid or expired token.'));
  }

  req.user = decoded;
  next();
};

export const authorizeAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json(ApiResponse.error('Access denied. Admin role required.'));
  }
};
