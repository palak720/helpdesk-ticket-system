import Ticket from '../models/Ticket.js';
import Comment from '../models/Comment.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitEvent, EVENTS } from '../events/eventBus.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isAdmin = (user) => user.role === 'admin';

// Users can only reach their own tickets. A foreign ticket returns 404 (not 403)
// so ticket ids can't be probed.
export async function findAccessibleTicket(id, user) {
  const ticket = await Ticket.findById(id);
  if (!ticket || (!isAdmin(user) && String(ticket.createdBy) !== String(user._id))) {
    throw new ApiError(404, 'Ticket not found');
  }
  return ticket;
}

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.create({ ...req.body, createdBy: req.user._id });
  emitEvent(EVENTS.TICKET_CREATED, { ticket, actor: req.user });
  res.status(201).json({ ticket });
});

export const listTickets = asyncHandler(async (req, res) => {
  const { status, priority, category, search, sort, page, limit } = req.query;

  const filter = {};
  if (!isAdmin(req.user)) filter.createdBy = req.user._id;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }

  const sortBy = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, updated: { updatedAt: -1 } }[sort];

  const [data, total] = await Promise.all([
    Ticket.find(filter)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name email'),
    Ticket.countDocuments(filter),
  ]);

  res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await findAccessibleTicket(req.params.id, req.user);
  await ticket.populate('createdBy', 'name email');
  const comments = await Comment.find({ ticket: ticket._id })
    .sort({ createdAt: 1 })
    .populate('author', 'name role');
  res.json({ ticket, comments });
});

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await findAccessibleTicket(req.params.id, req.user);
  const body = req.body;

  if (isAdmin(req.user)) {
    const forbidden = Object.keys(body).filter((k) => !['status', 'priority'].includes(k));
    if (forbidden.length) throw new ApiError(403, 'Admins can only change status and priority');
  } else {
    if ('status' in body) throw new ApiError(403, 'Only admins can change ticket status');
    if (ticket.status !== 'open') throw new ApiError(409, 'Only open tickets can be edited');
  }

  const changes = {};
  for (const [key, value] of Object.entries(body)) {
    if (ticket[key] !== value) changes[key] = { from: ticket[key], to: value };
  }
  if (!Object.keys(changes).length) return res.json({ ticket });

  Object.keys(changes).forEach((k) => (ticket[k] = changes[k].to));
  if (changes.status) {
    if (changes.status.to === 'resolved') ticket.resolvedAt = new Date();
    else if (['open', 'in_progress'].includes(changes.status.to)) ticket.resolvedAt = null;
  }
  await ticket.save();

  const { status, ...otherChanges } = changes;
  if (Object.keys(otherChanges).length) {
    emitEvent(EVENTS.TICKET_UPDATED, { ticket, actor: req.user, meta: otherChanges });
  }
  if (status) {
    emitEvent(EVENTS.STATUS_CHANGED, { ticket, actor: req.user, meta: { status } });
    if (status.to === 'resolved') emitEvent(EVENTS.TICKET_RESOLVED, { ticket, actor: req.user });
  }

  res.json({ ticket });
});

export const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await findAccessibleTicket(req.params.id, req.user);
  if (!isAdmin(req.user) && ticket.status !== 'open') {
    throw new ApiError(409, 'Only open tickets can be deleted');
  }
  await Comment.deleteMany({ ticket: ticket._id });
  await ticket.deleteOne();
  emitEvent(EVENTS.TICKET_DELETED, { ticket, actor: req.user });
  res.status(204).end();
});
