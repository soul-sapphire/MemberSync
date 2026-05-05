import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../../services/authService';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      toast.success('Password reset email sent. Check your inbox.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-card p-8 w-full max-w-md bg-white">
      <h2 className="text-3xl font-black text-slate-900 mb-2 text-center">Reset Password</h2>
      <p className="text-slate-500 text-center mb-6 text-sm font-medium">Enter your email and we will send you a link to reset your password.</p>
      
      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="premium-input" placeholder="you@example.com" />
        </div>
        <button type="submit" disabled={loading} className="w-full premium-button-primary py-3 mt-4">
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm font-medium text-slate-500">
        Remember your password? <Link to="/login" className="text-brand-600 font-bold hover:underline">Back to Login</Link>
      </p>
    </div>
  );
};
export default ForgotPasswordPage;
