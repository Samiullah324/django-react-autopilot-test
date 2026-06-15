import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { ApiError } from '../api/client';
import { isStrongPassword, PASSWORD_HINT } from '../constants/validation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function SignUpPage() {
  const { register, user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.username.trim()) errors.username = 'Username is required.';
    if (!form.email.trim()) errors.email = 'Email is required.';
    else if (!isValidEmail(form.email)) errors.email = 'Enter a valid email address.';
    if (!form.first_name.trim()) errors.first_name = 'First name is required.';
    if (!form.last_name.trim()) errors.last_name = 'Last name is required.';
    if (!form.password) errors.password = 'Password is required.';
    else if (!isStrongPassword(form.password)) errors.password = PASSWORD_HINT;
    if (!form.password_confirm) errors.password_confirm = 'Please confirm your password.';
    else if (form.password !== form.password_confirm) {
      errors.password_confirm = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirm: form.password_confirm,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        const nextErrors: Record<string, string> = {};
        for (const [key, messages] of Object.entries(err.fieldErrors)) {
          if (messages.length) nextErrors[key] = messages[0];
        }
        setFieldErrors(nextErrors);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Account created</h1>
          <p className="subtitle">Your account is ready. Sign in to continue.</p>
          <div className="success-banner">Registration successful.</div>
          <Link className="btn btn-primary btn-full" to="/login">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <button
        type="button"
        className="btn btn-icon btn-secondary login-theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
      <div className="login-card login-card--wide">
        <h1>Create account</h1>
        <p className="subtitle">Sign up to start managing inventory</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group form-group--spaced">
              <label htmlFor="first_name">First name</label>
              <input
                id="first_name"
                value={form.first_name}
                onChange={(e) => updateField('first_name', e.target.value)}
                autoComplete="given-name"
                required
              />
              {fieldErrors.first_name && <p className="field-error">{fieldErrors.first_name}</p>}
            </div>
            <div className="form-group form-group--spaced">
              <label htmlFor="last_name">Last name</label>
              <input
                id="last_name"
                value={form.last_name}
                onChange={(e) => updateField('last_name', e.target.value)}
                autoComplete="family-name"
                required
              />
              {fieldErrors.last_name && <p className="field-error">{fieldErrors.last_name}</p>}
            </div>
          </div>
          <div className="form-group form-group--spaced">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={form.username}
              onChange={(e) => updateField('username', e.target.value)}
              autoComplete="username"
              required
            />
            {fieldErrors.username && <p className="field-error">{fieldErrors.username}</p>}
          </div>
          <div className="form-group form-group--spaced">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              autoComplete="email"
              required
            />
            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
          </div>
          <div className="form-group form-group--spaced">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              autoComplete="new-password"
              required
            />
            <p className="field-hint">{PASSWORD_HINT}</p>
            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
          </div>
          <div className="form-group form-group--spaced-lg">
            <label htmlFor="password_confirm">Confirm password</label>
            <input
              id="password_confirm"
              type="password"
              value={form.password_confirm}
              onChange={(e) => updateField('password_confirm', e.target.value)}
              autoComplete="new-password"
              required
            />
            {fieldErrors.password_confirm && (
              <p className="field-error">{fieldErrors.password_confirm}</p>
            )}
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
        <p className="login-hint">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
