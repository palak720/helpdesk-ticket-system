import mongoose from 'mongoose';

export const CATEGORIES = ['bug', 'billing', 'feature_request', 'account', 'general'];
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    category: { type: String, enum: CATEGORIES, default: 'general' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    status: { type: String, enum: STATUSES, default: 'open' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Admin list view filters by status + priority and sorts by newest.
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model('Ticket', ticketSchema);
