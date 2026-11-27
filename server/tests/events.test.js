import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventBus, emitEvent, EVENTS } from '../events/eventBus.js';

test('emitted events reach subscribers with their payload', () => {
  let received;
  eventBus.once(EVENTS.TICKET_RESOLVED, (p) => (received = p));
  emitEvent(EVENTS.TICKET_RESOLVED, { ticket: { title: 'x' } });
  assert.equal(received.ticket.title, 'x');
});
