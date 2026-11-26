import Comment from '../models/Comment.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitEvent, EVENTS } from '../events/eventBus.js';
import { findAccessibleTicket } from './ticketController.js';

export const listComments = asyncHandler(async (req, res) => {
  const ticket = await findAccessibleTicket(req.params.id, req.user);
  const comments = await Comment.find({ ticket: ticket._id })
    .sort({ createdAt: 1 })
    .populate('author', 'name role');
  res.json({ comments });
});

export const addComment = asyncHandler(async (req, res) => {
  const ticket = await findAccessibleTicket(req.params.id, req.user);
  if (ticket.status === 'closed' && req.user.role !== 'admin') {
    throw new ApiError(409, 'This ticket is closed');
  }
  const comment = await Comment.create({
    ticket: ticket._id,
    author: req.user._id,
    message: req.body.message,
  });
  await comment.populate('author', 'name role');
  emitEvent(EVENTS.COMMENT_ADDED, { ticket, actor: req.user, meta: { commentId: comment._id } });
  res.status(201).json({ comment });
});
