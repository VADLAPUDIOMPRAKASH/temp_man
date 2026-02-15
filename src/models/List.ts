import mongoose, { Document, Schema } from 'mongoose';

/**
 * IList Interface
 * 
 * Represents a column inside a board.
 * Example: "To Do", "In Progress", "Done"
 */
export interface IList extends Document {
  title: string;                        // Name of the list
  board: mongoose.Types.ObjectId;       // Reference to the board it belongs to
  order: number;                        // Position of the list (for drag-and-drop)
  createdAt: Date;                      // Automatically added timestamp
  updatedAt: Date;                      // Automatically added timestamp
}

/**
 * List Schema
 * 
 * Defines how lists are stored in MongoDB.
 */
const listSchema = new Schema<IList>(
  {
    // Title of the list (trim removes extra spaces)
    title: { type: String, required: true, trim: true },

    // Reference to the board this list belongs to
    board: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true
    },

    // Used to maintain order when dragging lists
    order: { type: Number, default: 0 },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true
  }
);

/**
 * Index to improve performance when:
 * - Fetching lists of a board
 * - Sorting lists by order
 */
listSchema.index({ board: 1, order: 1 });

// Create and export List model
export const List = mongoose.model<IList>('List', listSchema);
