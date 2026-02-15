import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types';

/**
 * Authentication Middleware
 * 
 * - Extracts JWT token from Authorization header
 * - Verifies the token using JWT secret
 * - Attaches decoded userId to request object
 * - Blocks request if token is missing or invalid
 */
export function auth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {

  // Extract token from Authorization header
  // Expected format: "Bearer <token>"
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // If no token is provided, deny access
  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  try {
    // Verify the token using JWT secret
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;

    // Attach userId from decoded token to request object
    // This allows protected routes to know which user is making the request
    req.userId = decoded.userId;

    // Move to next middleware or controller
    next();

  } catch {
    // If token is invalid or expired, return 401 Unauthorized
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
