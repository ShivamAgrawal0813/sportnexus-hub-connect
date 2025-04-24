import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { generateToken } from '../utils/jwt';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password before creating the user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role: 'user', // Default role
    });

    if (user) {
      // Generate JWT token
      const token = generateToken(user);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    if (user && (await user.comparePassword(password))) {
      // Generate JWT token
      const token = generateToken(user);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({
      message: 'Server error fetching user data',
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic information
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    
    // Update profile information
    if (!user.profile) user.profile = {};
    
    if (req.body.avatar) user.profile.avatar = req.body.avatar;
    if (req.body.bio) user.profile.bio = req.body.bio;
    if (req.body.phone) user.profile.phone = req.body.phone;
    if (req.body.location) user.profile.location = req.body.location;

    // Update preferences
    if (!user.profile.preferences) user.profile.preferences = {};
    if (req.body.sportTypes) user.profile.preferences.sportTypes = req.body.sportTypes;
    if (req.body.notifications !== undefined) {
      user.profile.preferences.notifications = req.body.notifications;
    }

    // Save user
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profile: updatedUser.profile,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Server error updating profile',
      error: error.message,
    });
  }
};

// @desc    Add item to favorites
// @route   POST /api/auth/favorites/:type/:id
// @access  Private
export const addToFavorites = async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;
    
    if (!['venues', 'equipment', 'tutorials'].includes(type)) {
      return res.status(400).json({ message: 'Invalid favorite type' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize profile and favorites if they don't exist
    if (!user.profile) user.profile = {};
    if (!user.profile.favorites) user.profile.favorites = {};
    if (!user.profile.favorites[type as keyof typeof user.profile.favorites]) {
      //@ts-ignore
      user.profile.favorites[type] = [];
    }

    // Check if item is already in favorites
    //@ts-ignore
    if (user.profile.favorites[type].includes(id)) {
      return res.status(400).json({ message: `Item already in ${type} favorites` });
    }

    // Add to favorites
    //@ts-ignore
    user.profile.favorites[type].push(id);
    await user.save();

    res.json({ 
      message: `Added to ${type} favorites`,
      favorites: user.profile.favorites
    });
  } catch (error: any) {
    console.error('Add to favorites error:', error);
    res.status(500).json({
      message: 'Server error adding to favorites',
      error: error.message,
    });
  }
};

// @desc    Remove item from favorites
// @route   DELETE /api/auth/favorites/:type/:id
// @access  Private
export const removeFromFavorites = async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;
    
    if (!['venues', 'equipment', 'tutorials'].includes(type)) {
      return res.status(400).json({ message: 'Invalid favorite type' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if profile and favorites exist
    if (!user.profile || !user.profile.favorites || !user.profile.favorites[type as keyof typeof user.profile.favorites]) {
      return res.status(400).json({ message: `No ${type} favorites found` });
    }

    // Remove from favorites
    //@ts-ignore
    user.profile.favorites[type] = user.profile.favorites[type].filter(
      (itemId: mongoose.Types.ObjectId) => itemId.toString() !== id
    );
    
    await user.save();

    res.json({ 
      message: `Removed from ${type} favorites`,
      favorites: user.profile.favorites
    });
  } catch (error: any) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({
      message: 'Server error removing from favorites',
      error: error.message,
    });
  }
};

// @desc    Create an admin user
// @route   POST /api/auth/create-admin
// @access  Public (you may want to restrict this in production)
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin user
    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role: 'admin', // Set role to admin
    });

    if (user) {
      // Generate JWT token
      const token = generateToken(user);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      message: 'Server error during admin registration',
      error: error.message,
    });
  }
};

export default {
  register,
  login,
  getCurrentUser,
  updateProfile,
  addToFavorites,
  removeFromFavorites,
  createAdmin,
}; 