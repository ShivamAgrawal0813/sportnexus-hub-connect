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

// Authenticate middleware - protects routes
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('Auth middleware running...');
  let token;

  // Check if auth header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token received:', token);
      
      if (!token) {
        return res.status(401).json({ message: 'Not authorized, empty token' });
      }

      // Verify token
      try {
        console.log('Verifying JWT token...');
        const decoded = verifyToken(token);
        console.log('Token decoded successfully:', decoded);
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
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Middleware to restrict access to admin users only
export const admin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, authentication required' });
  }
  
  if (req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized. Admin access required' });
  }
};

// Middleware to restrict access to specific roles
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, authentication required' });
    }
    
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ 
        message: `Not authorized. Required role: ${roles.join(' or ')}` 
      });
    }
  };
}; 