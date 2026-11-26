import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () =>
      api.get('/notifications').then((r) => setUnread(r.data.unread)).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="nav">
      <Link to="/" className="brand">Helpdesk</Link>
      <nav>
        <NavLink to="/" end>{user.role === 'admin' ? 'All tickets' : 'My tickets'}</NavLink>
        {user.role === 'user' && <NavLink to="/tickets/new">New ticket</NavLink>}
        {user.role === 'admin' && <NavLink to="/activity">Activity</NavLink>}
        <NavLink to="/notifications">
          Notifications{unread > 0 && <span className="dot">{unread}</span>}
        </NavLink>
      </nav>
      <div className="who">
        <span>{user.name} ({user.role})</span>
        <button className="btn ghost" onClick={() => { logout(); navigate('/login'); }}>Log out</button>
      </div>
    </header>
  );
}
