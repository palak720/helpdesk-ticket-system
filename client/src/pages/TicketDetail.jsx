import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { StatusBadge, PriorityBadge } from '../components/Badges.jsx';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user.role === 'admin';
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api
      .get(`/tickets/${id}`)
      .then((r) => { setTicket(r.data.ticket); setComments(r.data.comments); })
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  useEffect(load, [load]);

  const update = async (patch) => {
    setError('');
    try {
      const r = await api.patch(`/tickets/${id}`, patch);
      setTicket((t) => ({ ...t, ...r.data.ticket, createdBy: t.createdBy }));
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this ticket and its comments?')) return;
    try {
      await api.delete(`/tickets/${id}`);
      navigate('/');
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const r = await api.post(`/tickets/${id}/comments`, { message });
      setComments((c) => [...c, r.data.comment]);
      setMessage('');
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (error && !ticket) return <p className="error">{error}</p>;
  if (!ticket) return <p className="muted">Loading ticket…</p>;

  const canEdit = !isAdmin && ticket.status === 'open';
  const canComment = isAdmin || ticket.status !== 'closed';

  return (
    <>
      <p><Link to="/">Back to tickets</Link></p>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <div className="row between">
          <h1>{ticket.title}</h1>
          <div className="row">
            <PriorityBadge value={ticket.priority} />
            <StatusBadge value={ticket.status} />
          </div>
        </div>
        <p className="muted">
          {ticket.category.replace('_', ' ')} · raised by {ticket.createdBy?.name} on {new Date(ticket.createdAt).toLocaleString()}
        </p>
        <p className="body-text">{ticket.description}</p>

        {isAdmin && (
          <div className="row admin-box">
            <label>Status
              <select value={ticket.status} onChange={(e) => update({ status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </label>
            <label>Priority
              <select value={ticket.priority} onChange={(e) => update({ priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>
        )}

        {(canEdit || isAdmin) && (
          <div className="row">
            {canEdit && <Link className="btn ghost" to={`/tickets/${id}/edit`}>Edit ticket</Link>}
            {(canEdit || isAdmin) && <button className="btn danger" onClick={remove}>Delete ticket</button>}
          </div>
        )}
        {!isAdmin && !canEdit && <p className="muted">Only open tickets can be edited or deleted.</p>}
      </div>

      <h2>Comments ({comments.length})</h2>
      {comments.length === 0 && <p className="muted">No comments yet.</p>}
      {comments.map((c) => (
        <div key={c._id} className={`comment ${c.author?.role === 'admin' ? 'staff' : ''}`}>
          <div className="row between">
            <strong>{c.author?.name}{c.author?.role === 'admin' && ' (support)'}</strong>
            <span className="muted">{new Date(c.createdAt).toLocaleString()}</span>
          </div>
          <p>{c.message}</p>
        </div>
      ))}

      {canComment ? (
        <form className="card" onSubmit={addComment}>
          <label>{isAdmin ? 'Reply to the user' : 'Add a comment'}
            <textarea required rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <button className="btn">Post comment</button>
        </form>
      ) : (
        <p className="muted">This ticket is closed, so new comments are turned off.</p>
      )}
    </>
  );
}
