import { useState } from 'react';
import './auth.css';
import { signupUser, signinUser, storeToken, clearToken } from './api.js';

function Auth({ onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'signup' && !form.role) {
      setError('Please select your role.');
      return;
    }
    if (!form.email || !form.password) {
      setError('Please enter email and password.');
      return;
    }
    if (mode === 'signup' && (!form.name || !form.phone)) {
      setError('Please fill in your full name and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        // 1) Register the account (role is honored by the backend), then sign in for a JWT.
        await signupUser({
          fullname: form.name,
          phone: form.phone,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        setMessage('Account created. Logging you in…');
      }

      const signinRes = await signinUser({
        email: form.email,
        password: form.password,
      });

      // Persist the JWT centrally so api.js attaches it on every later call.
      if (signinRes.jwt) storeToken(signinRes.jwt);
      else clearToken();

      setMessage(`Welcome${signinRes.fullname ? `, ${signinRes.fullname}` : ''}!`);

      if (onAuthSuccess) {
        // Prefer values from the backend; fall back to the form for first-time signup.
        onAuthSuccess({
          id: signinRes.id ?? form.email,
          name: signinRes.fullname || form.name || form.email.split('@')[0],
          email: form.email,
          role: signinRes.role || form.role,
          token: signinRes.jwt || '',
        });
      }
    } catch (err) {
      clearToken();
      // err.message comes from api.js (forwarded from backend {message: "..."}).
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">

        <header className="auth-header">
          <h1>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
          <p>
            {mode === 'login'
              ? 'Log in to continue'
              : 'Sign up to get started'}
          </p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {mode === 'signup' && (
            <>
              <div className="auth-field">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  className="auth-select"
                  value={form.role}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select your role</option>
                  <option value="Student">Student</option>
                  <option value="Librarian">Librarian</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              <div className="auth-field">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">
              Password
              <span className="auth-hint">(min 6 characters)</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}

          <button
            type="submit"
            className="auth-submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? mode === 'login'
                ? 'Logging in...'
                : 'Creating account...'
              : mode === 'login'
                ? 'Log In'
                : 'Sign Up'}
          </button>
        </form>

        <footer className="auth-footer">
          <p>
            {mode === 'login'
              ? "Don't have an account?"
              : 'Already have an account?'}
            <button
              type="button"
              className="auth-switch"
              onClick={toggleMode}
            >
              {mode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </footer>

      </div>
    </div>
  );
}

export default Auth;
