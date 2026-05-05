import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerWithEmail, signInWithGoogle } from '../../services/authService';
import { getMemberByUid } from '../../services/memberService';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRedirect = async (user, userData) => {
    if (userData.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      // Check if member profile exists
      const member = await getMemberByUid(user.uid);
      if (!member) {
        navigate('/member/complete-profile');
      } else {
        navigate('/member/dashboard');
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerWithEmail(email, password, fullName);
      toast.success('Registration successful! Please complete your profile.');
      navigate('/member/complete-profile');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      const { user, userData } = await signInWithGoogle();
      toast.success('Google registration successful!');
      await handleRedirect(user, userData);
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Google sign-in was cancelled.');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Network error. Please try again.');
      } else {
        toast.error('Google authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-card p-8 w-full max-w-md bg-white">
      <h2 className="text-3xl font-black text-slate-900 mb-6 text-center">Create Account</h2>
      
      <button 
        onClick={handleGoogleRegister}
        disabled={loading}
        className="w-full premium-button-secondary py-3 mb-6 flex justify-center items-center gap-2 disabled:opacity-50"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
        Register with Google
      </button>

      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute w-full h-px bg-slate-200"></div>
        <span className="relative bg-white px-4 text-xs font-bold text-slate-400 uppercase">Or</span>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="premium-input" placeholder="John Doe" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="premium-input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="premium-input" placeholder="••••••••" minLength={6} />
        </div>
        <button type="submit" disabled={loading} className="w-full premium-button-primary py-3 mt-4">
          {loading ? 'Processing...' : 'Register'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm font-medium text-slate-500">
        Already have an account? <Link to="/login" className="text-brand-600 font-bold hover:underline">Sign In here</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
