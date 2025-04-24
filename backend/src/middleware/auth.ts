import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;
  console.log('Auth middleware running...');

  // Check if auth header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      console.log(`Token received: ${token.substring(0, 15)}...`);
      
      if (!token) {
        console.log('Token is empty after Bearer');
        return res.status(401).json({ message: 'Not authorized, empty token' });
      }

      // Verify token - verifyToken now throws errors instead of returning null
      try {
        const decoded = verifyToken(token);
        // Add user from payload to request
        req.user = decoded;
        next();
      } catch (jwtError: any) {
        console.error('JWT verification failed:', jwtError.message);
        
        if (jwtError.name === 'JsonWebTokenError') {
          return res.status(401).json({ message: 'Not authorized, malformed token' });
        } else if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Not authorized, token expired' });
        } else {
          return res.status(401).json({ message: 'Not authorized, token validation failed' });
        }
      }
    } catch (error: any) {
      console.error('Auth middleware error:', error);
      res.status(401).json({ 
        message: 'Not authorized, authentication failed', 
        error: error.message
      });
    }
  } else {
    console.log('No authorization header found or incorrect format');
    console.log('Headers:', JSON.stringify(req.headers));
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Admin middleware
export const admin = (req: Request, res: Response, next: NextFunction) => {
  console.log('Admin middleware running...');
  
  if (!req.user) {
    console.log('No user found in request');
    return res.status(401).json({ message: 'Not authorized, authentication required' });
  }
  
  console.log('User in request:', JSON.stringify(req.user));
  
  if (req.user.role === 'admin') {
    console.log('Admin access granted');
    next();
  } else {
    console.log('Admin access denied, user role:', req.user.role);
    res.status(403).json({ message: 'Not authorized as an administrator' });
  }
};

export default {
  protect,
  admin,
}; 