import mongoose, { Document, Schema } from 'mongoose';

/**
 * IBoard Interface
 * 
 * Defines the structure of a Board document in TypeScript.
 * A board represents a workspace where users can create lists and cards.
 */
export interface IBoard extends Document {
  name: string;                         // Name of the board
  createdBy: mongoose.Types.ObjectId;   // User who created the board
  createdAt: Date;                      // Automatically added (timestamp)
  updatedAt: Date;                      // Automatically added (timestamp)
}

/**
 * Board Schema
 * 
 * Defines how the board is stored in MongoDB.
 */
const boardSchema = new Schema<IBoard>(
  {
    // Name of the board (trim removes extra spaces)
    name: { type: String, required: true, trim: true },

    // Reference to the user who created the board
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create and export the Board model
export const Board = mongoose.model<IBoard>('Board', boardSchema);
