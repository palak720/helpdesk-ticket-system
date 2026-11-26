import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    event: { type: String, required: true, index: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
