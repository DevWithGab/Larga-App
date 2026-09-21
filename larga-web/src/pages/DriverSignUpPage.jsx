import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, Eye, EyeOff, Phone, Smartphone, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { phoneToEmail } from '../utils/driverAuth';
import AuthLayout, { FIELD_INPUT, FIELD_LABEL, FIELD_WRAP, SUBMIT_BUTTON } from '../components/AuthLayout';

export default function DriverSignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [jeepneyNumber, setJeepneyNumber] = useState('');
  const [seatCapacity, setSeatCapacity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name || !phoneNumber || !jeepneyNumber || !seatCapacity || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    const seats = parseInt(seatCapacity, 10);
    if (!Number.isFinite(seats) || seats <= 0) {
      setError('Please enter how many seats your jeepney has.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords don’t match. Please re-enter your password.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { email, phone } = phoneToEmail(phoneNumber);
      await signUp(email, password, {
        name,
        phone,
        jeepneyNumber,
        seatCapacity: seats,
        userType: 'driver',
      });
      navigate('/trips', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      badge="Jeepney Driver"
      title="Create driver account"
      subtitle="Your mobile number is how you'll sign in, here and in the app."
      backTo="/driver"

      width="xl"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/driver" className="font-accent text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
      note={
        <div className="flex items-start gap-3 rounded-2xl border border-gray-200/70 bg-white/70 p-4">
          <Smartphone size={18} color="#6b7280" className="mt-0.5 shrink-0" />
          <p className="font-regular text-sm leading-6 text-gray-600">
            You can review finished trips here, but starting a trip and sharing your location need
            the Larga mobile app — a browser tab stops reporting position once your phone locks.
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
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

          <label className="block">
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

          <label className="block">
            <span className={FIELD_LABEL}>Plate number</span>
            <div className={FIELD_WRAP}>
              <Bus size={20} color="#9ca3af" />
              <input
                type="text"
                className={`${FIELD_INPUT} uppercase placeholder:normal-case`}
                placeholder="ABC 1234"
                value={jeepneyNumber}
                onChange={(e) => setJeepneyNumber(e.target.value)}
              />
            </div>
          </label>

          <label className="block">
            <span className={FIELD_LABEL}>Seats</span>
            <div className={FIELD_WRAP}>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                className={`${FIELD_INPUT} px-0`}
                placeholder="16"
                value={seatCapacity}
                onChange={(e) => setSeatCapacity(e.target.value)}
              />
            </div>
          </label>

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
            className="font-regular mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-7">
          <button type="submit" disabled={submitting} className={SUBMIT_BUTTON}>
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
