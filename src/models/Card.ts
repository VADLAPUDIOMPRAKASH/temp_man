import mongoose, { Document, Schema } from 'mongoose';

/**
 * IAttachment Interface
 * 
 * Represents a file attached to a card stored in MongoDB.
 */
export interface IAttachment {
  name: string;          // File name
  mimeType: string;      // File MIME type (e.g., 'image/png', 'application/pdf')
  size: number;          // File size in bytes
  data: string;          // Base64 encoded file data
  uploadedAt: Date;      // Date when file was uploaded
}

/**
 * ICard Interface
 * 
 * Represents a task card inside a list.
 */
export interface ICard extends Document {
  title: string;                         // Card title
  description?: string;                  // Optional description
  list: mongoose.Types.ObjectId;         // Reference to the List it belongs to
  order: number;                         // Position of card in list (for drag-drop)
  dueDate?: Date;                        // Optional due date
  labels: string[];                      // Labels/tags (e.g., "urgent", "bug")
  attachments: IAttachment[];            // Attached files
  createdBy: mongoose.Types.ObjectId;    // User who created the card
  createdAt: Date;                       // Auto timestamp
  updatedAt: Date;                       // Auto timestamp
}

/**
 * Attachment Schema
 * 
 * Defines how attachments are stored inside a card in MongoDB.
 * Files are stored as Base64 encoded strings directly in the database.
 * _id: false means Mongoose will NOT create a separate ID for each attachment.
 */
const attachmentSchema = new Schema<IAttachment>(
  {
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: String, required: true },  // Base64 encoded file
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * Card Schema
 * 
 * Defines how cards are stored in MongoDB.
 */
const cardSchema = new Schema<ICard>(
  {
    // Card title (required)
    title: { type: String, required: true, trim: true },

    // Optional description
    description: { type: String, default: '' },

    // Reference to the list this card belongs to
    list: { type: Schema.Types.ObjectId, ref: 'List', required: true },

    // Used for drag-and-drop ordering
    order: { type: Number, default: 0 },

    // Optional due date
    dueDate: { type: Date },

    // Labels/tags for filtering and search
    labels: [{ type: String, trim: true }],

    // Array of file attachments
    attachments: [attachmentSchema],

    // User who created the card
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    // Automatically adds createdAt and updatedAt
    timestamps: true
  }
);

/**
 * Index for fast ordering inside a list
 * 
 * Helps efficiently fetch cards sorted by order
 */
cardSchema.index({ list: 1, order: 1 });

/**
 * Text index for search functionality
 * 
 * Allows searching cards by title and description
 */
cardSchema.index({ title: 'text', description: 'text' });

// Create and export Card model
export const Card = mongoose.model<ICard>('Card', cardSchema);
