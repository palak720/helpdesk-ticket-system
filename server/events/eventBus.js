import { EventEmitter } from 'node:events';

export const EVENTS = {
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  TICKET_DELETED: 'ticket.deleted',
  STATUS_CHANGED: 'ticket.status_changed',
  COMMENT_ADDED: 'ticket.comment_added',
  TICKET_RESOLVED: 'ticket.resolved',
};

export const eventBus = new EventEmitter();

// Controllers only call emitEvent(); they never know who listens.
export const emitEvent = (name, payload) => eventBus.emit(name, payload);
