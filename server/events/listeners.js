import { eventBus, EVENTS } from './eventBus.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const same = (a, b) => String(a) === String(b);

async function logActivity(event, { ticket, actor, meta = {} }) {
  await ActivityLog.create({
    event,
    ticket: ticket._id,
    actor: actor._id,
    meta: { title: ticket.title, ...meta },
  });
}

async function notifyUser(userId, ticket, message) {
  await Notification.create({ user: userId, ticket: ticket._id, message });
}

async function notifyAdmins(ticket, message, exceptUserId) {
  const admins = await User.find({ role: 'admin' }).select('_id');
  const docs = admins
    .filter((a) => !same(a._id, exceptUserId))
    .map((a) => ({ user: a._id, ticket: ticket._id, message }));
  if (docs.length) await Notification.insertMany(docs);
}

// Listener errors must never crash the request that emitted the event.
const on = (event, handler) =>
  eventBus.on(event, (payload) => {
    Promise.resolve(handler(payload)).catch((err) =>
      console.error(`[event:${event}] handler failed:`, err.message)
    );
  });

on(EVENTS.TICKET_CREATED, async (p) => {
  await logActivity(EVENTS.TICKET_CREATED, p);
  await notifyAdmins(p.ticket, `New ticket: ${p.ticket.title}`, p.actor._id);
});

on(EVENTS.TICKET_UPDATED, async (p) => {
  await logActivity(EVENTS.TICKET_UPDATED, p);
  if (!same(p.actor._id, p.ticket.createdBy)) {
    await notifyUser(p.ticket.createdBy, p.ticket, `Your ticket "${p.ticket.title}" was updated`);
  }
});

on(EVENTS.STATUS_CHANGED, async (p) => {
  await logActivity(EVENTS.STATUS_CHANGED, p);
  if (!same(p.actor._id, p.ticket.createdBy)) {
    await notifyUser(
      p.ticket.createdBy,
      p.ticket,
      `Status of "${p.ticket.title}" changed to ${p.meta.status.to.replace('_', ' ')}`
    );
  }
});

on(EVENTS.COMMENT_ADDED, async (p) => {
  await logActivity(EVENTS.COMMENT_ADDED, p);
  if (same(p.actor._id, p.ticket.createdBy)) {
    await notifyAdmins(p.ticket, `New comment on "${p.ticket.title}"`, p.actor._id);
  } else {
    await notifyUser(p.ticket.createdBy, p.ticket, `New reply on "${p.ticket.title}"`);
  }
});

on(EVENTS.TICKET_RESOLVED, async (p) => {
  await logActivity(EVENTS.TICKET_RESOLVED, p);
  await notifyUser(p.ticket.createdBy, p.ticket, `Your ticket "${p.ticket.title}" was resolved`);
});

on(EVENTS.TICKET_DELETED, async (p) => {
  await logActivity(EVENTS.TICKET_DELETED, p);
});
