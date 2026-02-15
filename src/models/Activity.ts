import mongoose, { Document, Schema } from 'mongoose';

/**
 * Activity Interface
 * 
 * Represents an activity log entry related to a card.
 * Each time a user performs an action (create, update, move, comment, etc.),
 * we store it here.
 */
export interface IActivity extends Document {
  card: mongoose.Types.ObjectId;     // The card on which the action happened
  user: mongoose.Types.ObjectId;     // The user who performed the action
  action: string;                    // Type of action (e.g., "created", "moved", "updated")
  details?: string;                  // Optional additional details about the action
  createdAt: Date;                   // Timestamp when the action occurred
}

/**
 * Activity Schema
 * 
 * Defines how activity logs are stored in MongoDB.
 */
const activitySchema = new Schema<IActivity>(
  {
    // Reference to the related card
    card: { type: Schema.Types.ObjectId, ref: 'Card', required: true },

    // Reference to the user who performed the action
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // Action performed on the card
    action: { type: String, required: true },

    // Optional description of what changed
    details: { type: String },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true
  }
);

/**
 * Index for faster queries
 * 
 * - Sorts activities by card
 * - Most recent activities appear first
 */
activitySchema.index({ card: 1, createdAt: -1 });

// Create and export the Activity model
export const Activity = mongoose.model<IActivity>(
  'Activity',
  activitySchema
);
