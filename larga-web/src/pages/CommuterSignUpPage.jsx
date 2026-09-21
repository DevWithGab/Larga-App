import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout, { FIELD_INPUT, FIELD_LABEL, FIELD_WRAP, SUBMIT_BUTTON } from '../components/AuthLayout';

export default function CommuterSignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords don’t match. Please re-enter your password.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await signUp(email, password, { name, userType: 'commuter' });
      navigate('/map', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      badge="Commuter"
      title="Create account"
      subtitle="Sign up to track jeepneys near you."
      backTo="/login"
      width="xl"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-accent text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <label className="mb-5 block">
          <span className={FIELD_LABEL}>Full name</span>
          <div className={FIELD_WRAP}>
            <User size={20} color="#9ca3af" />
            <input
              type="text"
              autoComplete="name"
              className={FIELD_INPUT}
              placeholder="Juan Dela Cruz"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </label>

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
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </label>

        {/* The two password fields pair up on a wide screen — they are short,
            related, and stacking them made the card scroll for no reason. */}
        <div className="mb-7 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className={FIELD_LABEL}>Password</span>
            <div className={FIELD_WRAP}>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`${FIELD_INPUT} pl-0`}
                placeholder="Create password"
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

          <label className="block">
            <span className={FIELD_LABEL}>Confirm password</span>
            <div className={FIELD_WRAP}>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`${FIELD_INPUT} px-0`}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </label>
        </div>

        {error && (
          <p
            role="alert"
            className="font-regular mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className={SUBMIT_BUTTON}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
    </AuthLayout>
  );
}
