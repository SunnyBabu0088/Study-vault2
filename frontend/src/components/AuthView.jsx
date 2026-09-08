import { useState } from 'react';
import { BookOpen, LogIn, UserPlus } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { getApiBaseUrl } from '../api/client';

export default function AuthView() {
  const { login, register } = useStudy();
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRoll, setRegRoll] = useState('');

  // Password reset state
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Server URL Config
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => {
    const saved = localStorage.getItem('studyvault_api_url');
    if (saved && saved.includes('10.11.20.233')) {
      localStorage.removeItem('studyvault_api_url');
      return '';
    }
    return saved || getApiBaseUrl() || '';
  });

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await register({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        roll_number: regRoll,
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-10">
      <div className="w-full max-w-md">
        {/* Brand logo & Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f1729] dark:bg-[#3b52cf] text-white shadow-xl shadow-[#0f1729]/20">
            <BookOpen className="h-7 w-7" />
          </div>
          <h1 className="display-face mt-3 text-2xl font-bold tracking-tight text-[#0f1729] dark:text-[#f8fafc]">StudyVault</h1>
          <p className="mt-1 text-sm text-[#5a6478] dark:text-[#94a3b8]">Your companion for tasks, notes, chat & ideas.</p>
        </div>

        {/* Form Container */}
        <div className="surface rounded-[28px] p-6 sm:p-8 dark:bg-[#161e2d] dark:border-[#263244]">
          {/* Mode Selector Switch */}
          <div className="mb-6 grid grid-cols-2 rounded-2xl bg-[#edeef4] dark:bg-[#1f2937] p-1">
            <button
              type="button"
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
                mode === 'login' ? 'bg-white dark:bg-[#161e2d] text-[#0f1729] dark:text-[#f8fafc] shadow-sm' : 'text-[#5a6478] dark:text-[#94a3b8]'
              }`}
              onClick={() => {
                setMode('login');
                setError('');
              }}
            >
              <LogIn className="h-4 w-4" /> Log In
            </button>
            <button
              type="button"
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
                mode === 'register' ? 'bg-white dark:bg-[#161e2d] text-[#0f1729] dark:text-[#f8fafc] shadow-sm' : 'text-[#5a6478] dark:text-[#94a3b8]'
              }`}
              onClick={() => {
                setMode('register');
                setError('');
              }}
            >
              <UserPlus className="h-4 w-4" /> Register
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-center text-xs font-semibold text-rose-600 dark:text-rose-400 space-y-2">
              <p className="m-0">{error}</p>
              <button
                type="button"
                onClick={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : undefined}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 font-bold transition text-[11px] cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[.1em] text-[#0f1729] dark:text-[#f8fafc]" htmlFor="login-email">
                  Email Address
                </label>
                <input
                  id="login-email"
                  className="field"
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-[.1em] text-[#0f1729] dark:text-[#f8fafc]" htmlFor="login-password">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-bold text-[var(--brand-orange)] hover:underline cursor-pointer"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="login-password"
                  className="field"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full justify-center rounded-xl py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer shadow-md"
                style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
              >
                {submitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          ) : mode === 'forgot' ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError('');
                setSubmitting(true);
                try {
                  const res = await apiRequest('/api/auth/forgot-password', {
                    method: 'POST',
                    body: { email: loginEmail },
                  });
                  const tok = res.data?.token || res.token;
                  if (tok) {
                    setResetToken(tok);
                    setMode('reset');
                  } else {
                    setError('Reset instructions generated. Please check back or contact support.');
                  }
                } catch (err) {
                  setError(err.message || 'Forgot password request failed.');
                } finally {
                  setSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[.1em] text-[#0f1729] dark:text-[#f8fafc]">
                  Your Email Address
                </label>
                <input
                  className="field"
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full justify-center rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-60 cursor-pointer shadow-md hover:opacity-95 active:scale-95"
                style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
              >
                {submitting ? 'Processing…' : 'Send Reset Link'}
              </button>
              <div className="text-center pt-2">
                <button
                  type="button"
                  className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  onClick={() => setMode('login')}
                >
                  ← Back to Log In
                </button>
              </div>
            </form>
          ) : mode === 'reset' ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError('');
                setSubmitting(true);
                try {
                  await apiRequest('/api/auth/reset-password', {
                    method: 'POST',
                    body: { token: resetToken, newPassword: newPassword },
                  });
                  alert('Password successfully reset! You can now log in.');
                  setMode('login');
                } catch (err) {
                  setError(err.message || 'Password reset failed.');
                } finally {
                  setSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[.1em] text-[#0f1729] dark:text-[#f8fafc]">
                  Reset Token
                </label>
                <input
                  className="field"
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[.1em] text-[#0f1729] dark:text-[#f8fafc]">
                  New Password (min 8 chars)
                </label>
                <input
                  className="field"
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full justify-center rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-60 cursor-pointer shadow-md hover:opacity-95 active:scale-95"
                style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
              >
                {submitting ? 'Updating…' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[.1em] text-[#0f1729] dark:text-[#f8fafc]" htmlFor="reg-username">
                  Username
                </label>
                <input
                  id="reg-username"
                  className="field"
                  type="text"
                  required
                  placeholder="Aarav"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[.1em] text-[#0f1729] dark:text-[#f8fafc]" htmlFor="reg-email">
                  Email Address
                </label>
                <input
                  id="reg-email"
                  className="field"
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[.1em] text-[#0f1729] dark:text-[#f8fafc]" htmlFor="reg-password">
                  Password (min 8 chars)
                </label>
                <input
                  id="reg-password"
                  className="field"
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-[.1em] text-[#0f1729] dark:text-[#f8fafc]" htmlFor="reg-phone">
                    Phone (Optional)
                  </label>
                  <input
                    id="reg-phone"
                    className="field"
                    type="tel"
                    placeholder="+123456789"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-[.1em] text-[#0f1729] dark:text-[#f8fafc]" htmlFor="reg-roll">
                    Roll No (Optional)
                  </label>
                  <input
                    id="reg-roll"
                    className="field"
                    type="text"
                    placeholder="CS-2026-04"
                    value={regRoll}
                    onChange={(e) => setRegRoll(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full justify-center rounded-xl py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer shadow-md hover:opacity-95 active:scale-95"
                style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
              >
                {submitting ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Server Connection Config (Developer Override) */}
          <div className="mt-6 border-t border-[var(--border)] pt-4 text-center">
            {!showServerConfig ? (
              <button
                type="button"
                className="text-[11px] font-medium text-[var(--text-muted)]/70 hover:text-[var(--text-muted)] transition cursor-pointer"
                onClick={() => {
                  setServerUrl(localStorage.getItem('studyvault_api_url') || getApiBaseUrl() || '');
                  setShowServerConfig(true);
                }}
              >
                ⚙ Advanced Connection Settings
              </button>
            ) : (
              <div className="mt-2 text-left space-y-2 bg-[var(--surface-secondary)] p-3 rounded-2xl border border-[var(--border)]">
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Custom Backend API URL
                </label>
                <input
                  type="text"
                  className="field text-xs"
                  placeholder="Leave empty for default (localhost:5000)"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                />
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow-xs cursor-pointer"
                    onClick={() => {
                      if (serverUrl.trim()) {
                        localStorage.setItem('studyvault_api_url', serverUrl.trim().replace(/\/$/, ''));
                      } else {
                        localStorage.removeItem('studyvault_api_url');
                      }
                      setShowServerConfig(false);
                      window.location.reload();
                    }}
                  >
                    Save & Reconnect
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-xs font-bold cursor-pointer"
                    onClick={() => setShowServerConfig(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
