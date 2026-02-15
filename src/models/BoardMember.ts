import mongoose, { Document, Schema } from 'mongoose';
import { BoardRole } from '../types';

/**
 * IBoardMember Interface
 * 
 * Represents a user's membership in a board.
 * This is used to manage collaboration and role-based permissions.
 */
export interface IBoardMember extends Document {
  board: mongoose.Types.ObjectId;     // The board the user belongs to
  user: mongoose.Types.ObjectId;      // The user who is a member
  role: BoardRole;                    // Role of the user (admin, editor, viewer)
  invitedBy?: mongoose.Types.ObjectId; // User who invited this member (optional)
  createdAt: Date;                    // Automatically added timestamp
}

/**
 * BoardMember Schema
 * 
 * Stores which users belong to which boards and what role they have.
 */
const boardMemberSchema = new Schema<IBoardMember>(
  {
    // Reference to the board
    board: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true
    },

    // Reference to the user
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Role of the user in this board
    // Only allowed values: admin, editor, viewer
    role: {
      type: String,
      enum: ['admin', 'editor', 'viewer'],
      default: 'editor'
    },

    // Optional: who invited this user to the board
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true
  }
);

/**
 * Unique index to prevent duplicate memberships.
 * 
 * A user cannot be added to the same board more than once.
 */
boardMemberSchema.index({ board: 1, user: 1 }, { unique: true });

// Create and export the BoardMember model
export const BoardMember = mongoose.model<IBoardMember>(
  'BoardMember',
  boardMemberSchema
);
