import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    api.get('/notifications').then((r) => setItems(r.data.notifications)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  const open = async (n) => {
    if (!n.read) await api.patch(`/notifications/${n._id}/read`).catch(() => {});
    if (n.ticket) navigate(`/tickets/${n.ticket}`);
    else load();
  };

  const readAll = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  if (error) return <p className="error">{error}</p>;
  if (!items) return <p className="muted">Loading…</p>;

  return (
    <>
      <div className="row between">
        <h1>Notifications</h1>
        {items.some((n) => !n.read) && <button className="btn ghost" onClick={readAll}>Mark all as read</button>}
      </div>
      {items.length === 0 && <p className="muted">You are all caught up.</p>}
      <ul className="feed">
        {items.map((n) => (
          <li key={n._id} className={n.read ? '' : 'unread'} onClick={() => open(n)}>
            <span>{n.message}</span>
            <span className="muted">{new Date(n.createdAt).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
