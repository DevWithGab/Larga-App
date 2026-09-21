import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Phone, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { phoneToEmail } from '../utils/driverAuth';
import AuthLayout, { FIELD_INPUT, FIELD_LABEL, FIELD_WRAP, SUBMIT_BUTTON } from '../components/AuthLayout';

export default function DriverLoginPage() {
  const { logIn } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!phoneNumber || !password) {
      setError('Please enter your mobile number and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { email } = phoneToEmail(phoneNumber);
      await logIn(email, password, keepLoggedIn);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      badge="Jeepney Driver"
      title="Welcome back."
      subtitle="Sign in to see your trip history."
      footer={
        <>
          Don&rsquo;t have an account?{' '}
          <Link to="/driver/signup" className="font-accent text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
      note={
        <div className="flex items-start gap-3 rounded-2xl border border-gray-200/70 bg-white/70 p-4">
          <Smartphone size={18} color="#6b7280" className="mt-0.5 shrink-0" />
          <p className="font-regular text-sm leading-6 text-gray-600">
            Sharing your location while you drive needs the Larga mobile app — a browser tab stops
            reporting your position as soon as your phone locks. Here you can review the trips
            you&rsquo;ve already finished.
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <label className="mb-5 block">
          <span className={FIELD_LABEL}>Mobile number</span>
          <div className={FIELD_WRAP}>
            <Phone size={20} color="#9ca3af" />
            <input
              type="tel"
              autoComplete="username"
              className={FIELD_INPUT}
              placeholder="09XX XXX XXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
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

        <label className="mb-7 flex items-center gap-2">
          <input
            type="checkbox"
            checked={keepLoggedIn}
            onChange={(e) => setKeepLoggedIn(e.target.checked)}
            className="h-4 w-4 accent-[#f57c1f]"
          />
          <span className="font-regular text-sm text-gray-600">Keep me logged in</span>
        </label>

        {error && (
          <p
            role="alert"
            className="font-regular mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className={SUBMIT_BUTTON}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
