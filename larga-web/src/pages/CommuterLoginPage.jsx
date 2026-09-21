import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Eye, EyeOff, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout, { FIELD_INPUT, FIELD_LABEL, FIELD_WRAP, SUBMIT_BUTTON } from '../components/AuthLayout';

export default function CommuterLoginPage() {
  const { logIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);

  const handlePasswordReset = async () => {
    if (submitting || resetting) return;
    setError(null);
    setResetMessage(null);
    const resetEmail = email.trim();
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setError('Enter a valid email address above to reset your password.');
      return;
    }
    setResetting(true);
    try {
      await resetPassword(resetEmail);
      setResetMessage('If an account exists for this email, you will receive a password reset link. Check your inbox and spam folder.');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setResetMessage('If an account exists for this email, you will receive a password reset link. Check your inbox and spam folder.');
      } else {
        const messages = {
          'auth/invalid-email': 'Enter a valid email address above to reset your password.',
          'auth/too-many-requests': 'Too many requests. Please wait a little before trying again.',
          'auth/network-request-failed': 'Could not connect. Check your internet connection and try again.',
        };
        setError(messages[err.code] || 'Could not send the password reset email. Please try again.');
      }
    } finally {
      setResetting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || resetting) return;
    setResetMessage(null);
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await logIn(email, password, rememberMe);
      // App routes to the portal only after the profile is ready.
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      badge="Commuter"
      title="Welcome back."
      subtitle="Log in to see jeepneys near you."
      footer={
        <>
          Don&rsquo;t have an account?{' '}
          <Link to="/signup" className="font-accent text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <label className="mb-5 block">
          <span className={FIELD_LABEL}>Email</span>
          <div className={FIELD_WRAP}>
            <Mail size={20} color="#9ca3af" />
            <input
              type="email"
              autoComplete="email"
              className={FIELD_INPUT}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setResetMessage(null); setError(null); }}
            />
          </div>
        </label>

        <label className="mb-5 block">
          <span className={FIELD_LABEL}>Password</span>
          <div className={FIELD_WRAP}>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`${FIELD_INPUT} pl-0`}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="text-gray-400 transition-colors hover:text-black"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </label>

        <div className="mb-7 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setRememberMe((remember) => !remember)}
            className="flex items-center"
            aria-pressed={rememberMe}
          >
            <span
              className={`mr-2 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                rememberMe ? 'border-primary bg-primary' : 'border-gray-200'
              }`}
            >
              {rememberMe && <Check size={14} color="#fff" strokeWidth={3} />}
            </span>
            <span className="font-regular text-sm text-gray-600">Remember me</span>
          </button>
          <button type="button" onClick={handlePasswordReset} disabled={submitting || resetting} className="font-label text-sm text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50">
            {resetting ? 'Sending reset email...' : 'Forgot password?'}
          </button>
        </div>

        {resetMessage && (
          <p role="status" className="font-regular mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
            {resetMessage}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="font-regular mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting || resetting} className={SUBMIT_BUTTON}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}
