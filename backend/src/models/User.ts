import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  authProvider?: 'local' | 'google';
  profilePicture?: string;
  isEmailVerified?: boolean;
  profile?: {
    avatar?: string;
    bio?: string;
    phone?: string;
    location?: string;
    favorites?: {
      venues?: mongoose.Types.ObjectId[];
      equipment?: mongoose.Types.ObjectId[];
      tutorials?: mongoose.Types.ObjectId[];
    };
    preferences?: {
      sportTypes?: string[];
      notifications?: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  profilePicture: String,
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  profile: {
    avatar: String,
    bio: String,
    phone: String,
    location: String,
    favorites: {
      venues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Venue' }],
      equipment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }],
      tutorials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tutorial' }],
    },
    preferences: {
      sportTypes: [String],
      notifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

// Add pre-validate hook for debugging
UserSchema.pre('validate', function(next) {
  console.log('Pre-validate hook running for user:', {
    id: this._id,
    name: this.name,
    email: this.email,
    authProvider: this.authProvider,
    passwordHashLength: this.passwordHash ? this.passwordHash.length : 0
  });
  next();
});

// Hash password before saving only for local auth
UserSchema.pre('save', async function (next) {
  if (this.authProvider === 'google') {
    console.log('Google auth user, skipping password hash');
    return next();
  }
  console.log('Local auth user, password already hashed in controller');
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  if (this.authProvider === 'google') {
    return false; // Google users can't login with password
  }
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model<IUser>('User', UserSchema); 