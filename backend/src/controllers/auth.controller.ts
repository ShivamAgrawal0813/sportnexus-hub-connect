import { Request, Response } from 'express';
import { verifyGoogleToken } from '../config/google.config';
import { User } from '../models/user.model';
import { generateToken } from '../utils/jwt';

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    // Verify the Google token
    const googleUser = await verifyGoogleToken(credential);

    // Check if user exists
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        email: googleUser.email,
        name: googleUser.name,
        profilePicture: googleUser.picture,
        isEmailVerified: true, // Google accounts are already verified
        authProvider: 'google'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      message: 'Successfully authenticated with Google',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
      },
      token
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
}; 