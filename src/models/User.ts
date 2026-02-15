import mongoose, { Document, Schema } from 'mongoose';

/**
 * IUser Interface
 * 
 * Represents a user in the system.
 * Each user can create boards, lists, and cards.
 */
export interface IUser extends Document {
  name: string;        // Full name of the user
  email: string;       // Unique email address (used for login)
  password: string;    // Hashed password
  createdAt: Date;     // Automatically added timestamp
}

/**
 * User Schema
 * 
 * Defines how user data is stored in MongoDB.
 */
const userSchema = new Schema<IUser>(
  {
    // User's name (trim removes extra spaces)
    name: { type: String, required: true, trim: true },

    // Email must be unique and stored in lowercase
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    // Password must have minimum length of 6
    // (Will be hashed before saving)
    password: {
      type: String,
      required: true,
      minlength: 6
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true
  }
);

// Create and export the User model
export const User = mongoose.model<IUser>('User', userSchema);
