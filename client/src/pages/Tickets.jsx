import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { StatusBadge, PriorityBadge } from '../components/Badges.jsx';
import Pagination from '../components/Pagination.jsx';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function Stats() {
  const [s, setS] = useState(null);
  useEffect(() => {
    api.get('/admin/stats').then((r) => setS(r.data)).catch(() => {});
  }, []);
  if (!s) return null;
  const items = [
    ['Total', s.total],
    ['Open', s.byStatus.open || 0],
    ['In progress', s.byStatus.in_progress || 0],
    ['Resolved', s.byStatus.resolved || 0],
    ['Urgent', s.byPriority.urgent || 0],
  ];
  return (
    <div className="stats">
      {items.map(([k, v]) => (
        <div key={k} className="stat"><strong>{v}</strong><span>{k}</span></div>
      ))}
    </div>
  );
}

export default function Tickets() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', sort: 'newest', page: 1 });
  const [searchText, setSearchText] = useState('');
  const [result, setResult] = useState({ data: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: searchText, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
    api
      .get('/tickets', { params })
      .then((r) => { setResult(r.data); setError(''); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [filters]);

  const setFilter = (k) => (e) => setFilters({ ...filters, [k]: e.target.value, page: 1 });

  return (
    <>
      <div className="row between">
        <h1>{isAdmin ? 'All tickets' : 'My tickets'}</h1>
        {!isAdmin && <Link className="btn" to="/tickets/new">New ticket</Link>}
      </div>

      {isAdmin && <Stats />}

      <div className="filters">
        <input placeholder="Search title or description" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        <select value={filters.status} onChange={setFilter('status')}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={filters.priority} onChange={setFilter('priority')}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.sort} onChange={setFilter('sort')}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="updated">Recently updated</option>
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Loading tickets…</p>
      ) : result.data.length === 0 ? (
        <div className="card center">
          <p>No tickets match these filters.</p>
          {!isAdmin && <Link className="btn" to="/tickets/new">Raise your first ticket</Link>}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>{isAdmin && <th>Raised by</th>}<th>Category</th><th>Priority</th><th>Status</th><th>Created</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((t) => (
                <tr key={t._id}>
                  <td><Link to={`/tickets/${t._id}`}>{t.title}</Link></td>
                  {isAdmin && <td>{t.createdBy?.name}</td>}
                  <td>{t.category.replace('_', ' ')}</td>
                  <td><PriorityBadge value={t.priority} /></td>
                  <td><StatusBadge value={t.status} /></td>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={result.pagination} onChange={(page) => setFilters({ ...filters, page })} />
    </>
  );
}
