import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { errMsg } from '../api.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card narrow" onSubmit={submit}>
      <h1>Create your account</h1>
      {error && <p className="error">{error}</p>}
      <label>Name<input required value={form.name} onChange={set('name')} /></label>
      <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
      <label>Password
        <input type="password" required value={form.password} onChange={set('password')} />
        <small className="muted">At least 8 characters, with a letter and a number.</small>
      </label>
      <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
    </form>
  );
}
