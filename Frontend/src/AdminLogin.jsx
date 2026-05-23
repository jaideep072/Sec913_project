// AdminLogin.jsx — discreet bottom-left icon → modal for the admin login.
//
// Purely a UX shortcut. The credentials are validated by the same backend
// /authservice/signin endpoint; this is just a separate, less-prominent way in.
// Logging in as a non-Admin here just routes you to your normal portal (no harm).

import { useState } from 'react';
import { signinUser, storeToken, clearToken } from './api.js';

function AdminLogin({ onAuthSuccess }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setOpen(false);
    setEmail('');
    setPassword('');
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await signinUser({ email, password });
      if (res.jwt) storeToken(res.jwt); else clearToken();
      // Soft warning if the credentials are valid but the role isn't actually Admin.
      if (res.role && res.role !== 'Admin') {
        setError(`Logged in as ${res.role}. (This door is meant for admins.)`);
      }
      if (onAuthSuccess) {
        onAuthSuccess({
          id: res.id ?? email,
          name: res.fullname || email.split('@')[0],
          email,
          role: res.role,
          token: res.jwt || '',
        });
      }
    } catch (err) {
      clearToken();
      setError(err.message || 'Invalid credentials.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Bottom-left trigger icon */}
      <button
        type="button"
        aria-label="Administrator login"
        title="Administrator login"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: 'none',
          background: '#0f172a',
          color: '#fbbf24',
          fontSize: 20,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          opacity: 0.85,
          transition: 'opacity 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}
      >
        🔑
      </button>

      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 14,
              padding: 28,
              width: '90%',
              maxWidth: 380,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 28 }}>🔑</span>
              <h2 style={{ margin: 0, fontSize: 22, color: '#0f172a' }}>Administrator Login</h2>
            </div>
            <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 20px' }}>
              Restricted access. Regular users should use the main form.
            </p>

            <form onSubmit={submit}>
              <div style={{ marginBottom: 14 }}>
                <label htmlFor="admin-email" style={lbl}>Email</label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  style={inp}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label htmlFor="admin-password" style={lbl}>Password</label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={inp}
                />
              </div>

              {error && (
                <p style={{
                  background: '#fee2e2', color: '#991b1b',
                  padding: '8px 12px', borderRadius: 6,
                  fontSize: 13, margin: '0 0 14px',
                }}>{error}</p>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={close}
                  style={{
                    flex: 1, padding: '10px 14px',
                    background: 'white', border: '1px solid #cbd5e1',
                    borderRadius: 8, cursor: 'pointer', fontSize: 14,
                  }}
                >Cancel</button>
                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    flex: 2, padding: '10px 14px',
                    background: '#0f172a', color: 'white',
                    border: 'none', borderRadius: 8,
                    cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  }}
                >{busy ? 'Signing in…' : 'Sign in as Admin'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const lbl = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#475569', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.05em',
};
const inp = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #cbd5e1', borderRadius: 8,
  fontSize: 14, boxSizing: 'border-box',
};

export default AdminLogin;
