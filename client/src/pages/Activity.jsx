import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';

const text = {
  'ticket.created': 'created a ticket',
  'ticket.updated': 'updated a ticket',
  'ticket.deleted': 'deleted a ticket',
  'ticket.status_changed': 'changed the status of',
  'ticket.comment_added': 'commented on',
  'ticket.resolved': 'resolved',
};

export default function Activity() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/activity').then((r) => setLogs(r.data.logs)).catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!logs) return <p className="muted">Loading activity…</p>;

  return (
    <>
      <h1>Activity log</h1>
      {logs.length === 0 && <p className="muted">Nothing has happened yet.</p>}
      <ul className="feed">
        {logs.map((l) => (
          <li key={l._id}>
            <span>
              <strong>{l.actor?.name}</strong> {text[l.event] || l.event}{' '}
              {l.ticket && l.event !== 'ticket.deleted' ? <Link to={`/tickets/${l.ticket}`}>{l.meta?.title}</Link> : <em>{l.meta?.title}</em>}
              {l.meta?.status && <> ({l.meta.status.from.replace('_', ' ')} to {l.meta.status.to.replace('_', ' ')})</>}
            </span>
            <span className="muted">{new Date(l.createdAt).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
