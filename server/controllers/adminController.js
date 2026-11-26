import Ticket from '../models/Ticket.js';
import ActivityLog from '../models/ActivityLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const countBy = async (field) => {
  const rows = await Ticket.aggregate([{ $group: { _id: `$${field}`, count: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
};

export const stats = asyncHandler(async (_req, res) => {
  const [total, byStatus, byPriority, byCategory] = await Promise.all([
    Ticket.countDocuments(),
    countBy('status'),
    countBy('priority'),
    countBy('category'),
  ]);
  res.json({ total, byStatus, byPriority, byCategory });
});

export const activity = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const logs = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor', 'name role');
  res.json({ logs });
});
