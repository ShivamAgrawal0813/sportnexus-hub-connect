import crypto from 'crypto';
import PasswordReset from '../models/PasswordReset';
import User from '../models/User';
import logger from './logger';

/**
 * Generate a random token for password reset
 * @returns Random token string
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create a password reset token for a user
 * @param userId User ID
 * @returns Created token
 */
export const createPasswordResetToken = async (userId: string): Promise<string> => {
  try {
    // Delete any existing reset tokens for this user
    await PasswordReset.deleteMany({ user: userId });

    // Generate a new token
    const token = generateResetToken();
    
    // Set expiration time (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Create password reset record
    await PasswordReset.create({
      user: userId,
      token,
      expiresAt
    });

    logger.info(`Password reset token created for user ${userId}`);
    return token;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error creating password reset token', { error: errorMessage, userId });
    throw new Error('Failed to create password reset token');
  }
};

/**
 * Validate a password reset token
 * @param token Token to validate
 * @returns User ID if token is valid, null otherwise
 */
export const validateResetToken = async (token: string): Promise<string | null> => {
  try {
    // Find the reset token record
    const resetRecord = await PasswordReset.findOne({ 
      token,
      expiresAt: { $gt: new Date() } // Make sure it hasn't expired
    });

    if (!resetRecord) {
      logger.warn('Invalid or expired password reset token', { token: token.substring(0, 8) + '...' });
      return null;
    }

    // Check if user exists
    const user = await User.findById(resetRecord.user);
    if (!user) {
      logger.warn('User not found for password reset token', { userId: resetRecord.user });
      return null;
    }

    return resetRecord.user.toString();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error validating password reset token', { 
      error: errorMessage, 
      token: token.substring(0, 8) + '...' 
    });
    return null;
  }
};

/**
 * Delete a password reset token
 * @param token Token to delete
 */
export const deleteResetToken = async (token: string): Promise<void> => {
  try {
    await PasswordReset.deleteOne({ token });
    logger.info('Password reset token deleted', { token: token.substring(0, 8) + '...' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error deleting password reset token', { 
      error: errorMessage, 
      token: token.substring(0, 8) + '...' 
    });
  }
};

export default {
  generateResetToken,
  createPasswordResetToken,
  validateResetToken,
  deleteResetToken
}; 