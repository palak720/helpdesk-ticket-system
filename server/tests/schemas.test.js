import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerSchema,
  createTicketSchema,
  updateTicketSchema,
  listTicketsQuery,
} from '../src/validators/schemas.js';

test('register rejects weak passwords and normalises email', () => {
  assert.equal(registerSchema.safeParse({ name: 'Ab', email: 'a@b.com', password: 'short' }).success, false);
  const ok = registerSchema.safeParse({ name: 'Palak', email: 'P@X.com', password: 'Passw0rd123' });
  assert.equal(ok.success, true);
  assert.equal(ok.data.email, 'p@x.com');
});

test('register schema strips an injected role field', () => {
  const r = registerSchema.parse({ name: 'Palak', email: 'p@x.com', password: 'Passw0rd123', role: 'admin' });
  assert.equal('role' in r, false);
});

test('create ticket applies defaults', () => {
  const r = createTicketSchema.parse({ title: 'Login broken', description: 'Cannot log in since morning' });
  assert.equal(r.priority, 'medium');
  assert.equal(r.category, 'general');
});

test('update ticket needs at least one known field', () => {
  assert.equal(updateTicketSchema.safeParse({}).success, false);
  assert.equal(updateTicketSchema.safeParse({ foo: 1 }).success, false);
  assert.equal(updateTicketSchema.safeParse({ status: 'resolved' }).success, true);
});

test('list query coerces page and limit', () => {
  const q = listTicketsQuery.parse({ page: '2', limit: '5', status: 'open' });
  assert.equal(q.page, 2);
  assert.equal(q.limit, 5);
  assert.equal(listTicketsQuery.safeParse({ limit: '500' }).success, false);
});
