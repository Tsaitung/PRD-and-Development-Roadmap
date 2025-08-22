import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    roleId: string;
    permissions?: string[];
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as any;

    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      roleId: decoded.roleId,
      permissions: decoded.permissions
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401));
    }
    next(error);
  }
};

export const authorize = (requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      logger.warn({
        message: 'Unauthorized access attempt',
        userId: req.user.id,
        required: requiredPermissions,
        actual: userPermissions,
        path: req.path
      });
      
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // Check query params (for download links)
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  return null;
}

// Optional authentication - continues if no token but doesn't fail
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as any;

      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        roleId: decoded.roleId,
        permissions: decoded.permissions
      };
    }
    
    next();
  } catch (error) {
    // Log error but continue without authentication
    logger.debug('Optional auth failed', { error: error.message });
    next();
  }
};