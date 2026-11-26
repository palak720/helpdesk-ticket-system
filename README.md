# Helpdesk: Support Ticket Management System

A mini helpdesk where users raise support tickets and admins manage and resolve them.
Built with **Node.js, Express, MongoDB (Mongoose), JWT** on the backend and **React (Vite)** on the frontend.

- Live app: `<add your frontend link>`
- Live API: `<add your backend link>/api/health`

## Features

- Register and log in with JWT. Two roles: `user` and `admin`.
- Users create, view, edit, delete (while the ticket is open) and comment on their own tickets.
- Admins see all tickets, filter by status and priority, change status and priority, and reply to any ticket.
- Event-driven workflow: every important action emits an event that writes an activity log and in-app notifications.
- Bonus: search, sorting, pagination, admin dashboard stats, Docker, automated tests, Postman collection.

## Project structure

```
server/src
  config/        database connection
  models/        User, Ticket, Comment, ActivityLog, Notification
  validators/    zod schemas for request bodies and queries
  middleware/    authenticate, authorize(role), validate, errorHandler
  controllers/   request handling and business rules
  routes/        URL to controller mapping
  events/        eventBus (emitter) and listeners (log + notify)
client/src
  pages/         Login, Register, Tickets, TicketForm, TicketDetail, Activity, Notifications
  components/    Navbar, Badges, Pagination
```

## Setup

Requirements: Node 18+ and MongoDB (local or Atlas).

```bash
# backend
cd server
cp .env.example .env       # then edit MONGO_URI and JWT_SECRET
npm install
npm run seed               # creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev                # http://localhost:5000

# frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

Default admin (change it in `.env`): `admin@helpdesk.com` / `Admin@12345`.

With Docker: `docker compose up --build`, then run `docker compose exec server node src/seed.js`.

Tests: `cd server && npm test` (no database needed).

## API summary

All routes are under `/api`. Protected routes need `Authorization: Bearer <token>`.
Import `server/helpdesk.postman_collection.json` into Postman to try everything.

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | /auth/register | public | Register (always role `user`) |
| POST | /auth/login | public | Log in, returns token |
| GET | /auth/me | any | Current user |
| POST | /tickets | user, admin | Create ticket |
| GET | /tickets | any | List. Users get their own, admins get all. Query: `status, priority, category, search, sort, page, limit` |
| GET | /tickets/:id | owner, admin | Ticket with comments |
| PATCH | /tickets/:id | owner (open tickets: content), admin (status, priority) | Update |
| DELETE | /tickets/:id | owner (open only), admin | Delete ticket and its comments |
| GET | /tickets/:id/comments | owner, admin | List comments |
| POST | /tickets/:id/comments | owner, admin | Add comment |
| GET | /admin/stats | admin | Counts by status, priority, category |
| GET | /admin/activity | admin | Latest activity log entries |
| GET | /notifications | any | Own notifications and unread count |
| PATCH | /notifications/:id/read, /notifications/read-all | any | Mark as read |

Errors share one shape: `{ "message": "...", "details": [{ "field", "message" }] }`.

## Database design (MongoDB)

- **User**: `name, email (unique), password (bcrypt hash, select:false), role`.
- **Ticket**: `title, description, category, priority, status, createdBy -> User, resolvedAt`.
  Indexes: `{status, priority, createdAt}` for the admin filters and `{createdBy, createdAt}` for "my tickets".
- **Comment**: `ticket -> Ticket, author -> User, message`. Indexed by `ticket`. Kept in its own collection so threads can grow without bloating the ticket document.
- **ActivityLog**: `event, ticket, actor -> User, meta`. Append-only audit trail. `meta` holds the title and the from/to values of changes.
- **Notification**: `user -> User, ticket, message, read`. Indexed by `user`.

References are used instead of embedding because comments, logs and notifications are queried and paginated independently.

## Event handling

`events/eventBus.js` wraps a Node `EventEmitter`. Controllers call `emitEvent(name, payload)` after the database write succeeds and know nothing about listeners. `events/listeners.js` subscribes to each event:

| Event | Action |
|---|---|
| ticket.created | Activity log, notify all admins |
| ticket.updated | Activity log, notify owner if an admin made the change |
| ticket.status_changed | Activity log, notify owner |
| ticket.comment_added | Activity log, notify admins (if user commented) or owner (if admin replied) |
| ticket.resolved | Activity log, notify owner |
| ticket.deleted | Activity log |

Listener errors are caught and logged so a failing notification never breaks an API request. To add email, add one more listener (for example with Nodemailer) without touching any controller.

## Security and implementation decisions

- Passwords hashed with bcrypt (12 rounds). Login returns the same message for unknown email and wrong password.
- The role is never read from the register request, so nobody can self-register as admin. Admins come from `npm run seed`.
- JWT is verified on every request and the user is re-loaded from the database, so deleted users lose access immediately.
- Users asking for someone else's ticket get 404, not 403, so ticket ids cannot be probed.
- Admins may change only status and priority. Users may edit content only while the ticket is open and cannot touch status.
- All input is validated with zod (types, lengths, enums, unknown fields rejected). Search text is regex-escaped.
- `helmet`, CORS allow-list, 10 kb body limit, and rate limiting on auth routes.
- Plain JavaScript with ES modules, to keep the code simple to read and explain.

## Deployment

- Database: MongoDB Atlas (free tier). Allow network access and copy the connection string.
- Backend: Render web service, root `server`, build `npm install`, start `npm start`. Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (the frontend URL). Run `npm run seed` once from the Render shell.
- Frontend: Vercel, root `client`, set `VITE_API_URL=https://<backend>/api`. `vercel.json` handles SPA routing.
