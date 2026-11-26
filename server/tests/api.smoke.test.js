// Runs without a database: checks routing, auth guards and validation.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const { default: app } = await import('../src/app.js');
let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const call = (path, opts) => fetch(base + path, opts);
const json = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

test('health check', async () => {
  const res = await call('/api/health');
  assert.equal(res.status, 200);
});

test('tickets require a token', async () => {
  assert.equal((await call('/api/tickets')).status, 401);
});

test('admin routes reject a bad token', async () => {
  const res = await call('/api/admin/stats', { headers: { Authorization: 'Bearer nope' } });
  assert.equal(res.status, 401);
});

test('register validates input before touching the database', async () => {
  const res = await call('/api/auth/register', json({ name: 'A', email: 'bad', password: '1' }));
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.details.length >= 3);
});

test('unknown route returns 404 json', async () => {
  const res = await call('/api/nothing');
  assert.equal(res.status, 404);
});
