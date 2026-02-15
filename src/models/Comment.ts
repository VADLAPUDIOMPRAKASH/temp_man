import mongoose, { Document, Schema } from 'mongoose';

/**
 * IComment Interface
 * 
 * Represents a comment added by a user on a card.
 */
export interface IComment extends Document {
  card: mongoose.Types.ObjectId;   // The card on which the comment is made
  user: mongoose.Types.ObjectId;   // The user who wrote the comment
  text: string;                    // The comment content
  createdAt: Date;                 // Automatically generated timestamp
}

/**
 * Comment Schema
 * 
 * Defines how comments are stored in MongoDB.
 */
const commentSchema = new Schema<IComment>(
  {
    // Reference to the related card
    card: {
      type: Schema.Types.ObjectId,
      ref: 'Card',
      required: true,
    },

    // Reference to the user who created the comment
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The actual comment text (trim removes extra spaces)
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create and export the Comment model
export const Comment = mongoose.model<IComment>('Comment', commentSchema);
