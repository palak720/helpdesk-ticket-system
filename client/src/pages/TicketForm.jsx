import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';

const CATEGORIES = ['general', 'bug', 'billing', 'feature_request', 'account'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function TicketForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: 'general', priority: 'medium' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    if (!id) return;
    api
      .get(`/tickets/${id}`)
      .then((r) => {
        const { title, description, category, priority } = r.data.ticket;
        setForm({ title, description, category, priority });
      })
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = id ? await api.patch(`/tickets/${id}`, form) : await api.post('/tickets', form);
      navigate(`/tickets/${res.data.ticket._id}`);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card narrow" onSubmit={submit}>
      <h1>{id ? 'Edit ticket' : 'New ticket'}</h1>
      {error && <p className="error">{error}</p>}
      <label>Title<input required minLength={3} maxLength={120} value={form.title} onChange={set('title')} /></label>
      <label>Describe the problem
        <textarea required minLength={10} maxLength={2000} rows={6} value={form.description} onChange={set('description')} />
      </label>
      <div className="row">
        <label className="grow">Category
          <select value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </label>
        <label className="grow">Priority
          <select value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>
      <div className="row">
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : id ? 'Save changes' : 'Submit ticket'}</button>
        <button type="button" className="btn ghost" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </form>
  );
}
