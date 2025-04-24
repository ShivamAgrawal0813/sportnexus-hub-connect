import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use environment variable with a fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'sportnexus_jwt_secret_key_for_authentication';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

export interface TokenPayload {
  id: string;
  _id: string; // Include both id and _id for compatibility
  email: string;
  name: string;
  role: string;
}

export const generateToken = (user: IUser): string => {
  console.log(`Generating token for user: ${user._id}, role: ${user.role}`);
  
  const payload = {
    id: user._id,
    _id: user._id, // Include both for compatibility
    email: user.email,
    name: user.name,
    role: user.role || 'user',
  };
  
  return jwt.sign(
    payload,
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    console.log('Verifying JWT token...');
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    console.log('Token decoded successfully:', { 
      id: decoded.id, 
      role: decoded.role 
    });
    return decoded;
  } catch (error: any) {
    console.error('JWT verification error:', error.message);
    console.error('Error name:', error.name);
    // Let the calling function handle the specific error
    throw error;
  }
};

export default {
  generateToken,
  verifyToken,
}; 