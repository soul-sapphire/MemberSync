import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithEmail, signInWithGoogle, getUserData } from '../../services/authService';
import { getMemberByUid } from '../../services/memberService';
import { ROLES } from '../../utils/roleCheck';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /**
   * Safe redirection flow based on user role and data state.
   */
  const handleRedirect = async (user) => {
    // ALWAYS fetch fresh profile from the members collection (source of truth for role)
    const profile = await getMemberByUid(user.uid);
    const role = String(profile?.role || ROLES.MEMBER).toLowerCase().trim();
    
    console.log("Login auth success uid:", user.uid);
    console.log("Login loaded profile:", profile);
    console.log("Login redirect role:", role);

    if (!profile && role !== ROLES.ADMIN) {
      // If no profile exists and not an admin (admins might not have member docs yet if newly created)
      // Check if they are in the users table at least
      const userData = await getUserData(user.uid);
      const fallbackRole = String(userData?.role || ROLES.MEMBER).toLowerCase().trim();
      
      if (fallbackRole === ROLES.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      
      console.log("Login Redirect - No profile, forcing onboarding");
      navigate('/member/complete-profile', { replace: true });
      return;
    }

    if (role === ROLES.ADMIN) {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/member/dashboard', { replace: true });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      toast.success('Authentication successful');
      await handleRedirect(user);
    } catch (error) {
      console.error("Email Login Error:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        toast.error('Invalid email or password.');
      } else {
        toast.error('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { user } = await signInWithGoogle();
      toast.success('Authentication successful');
      await handleRedirect(user);
    } catch (error) {
      console.error("Google Login Error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in cancelled.');
      } else {
        toast.error('Google login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-card p-10 w-full max-w-md bg-white shadow-premium">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">MemberSync</h2>
        <p className="text-slate-500 font-medium">Enterprise Management Suite</p>
      </div>
      
      <button 
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full premium-button-secondary py-3 mb-6 flex justify-center items-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
        <span className="font-bold">Continue with Google</span>
      </button>

      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute w-full h-px bg-slate-100"></div>
        <span className="relative bg-white px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Or Secure Login</span>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="premium-input bg-slate-50 border-transparent focus:bg-white" 
            placeholder="admin@membersync.com" 
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center ml-1">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Password</label>
            <Link to="/forgot-password" size="sm" className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors">Forgot?</Link>
          </div>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="premium-input bg-slate-50 border-transparent focus:bg-white" 
            placeholder="••••••••" 
          />
        </div>
        <button type="submit" disabled={loading} className="w-full premium-button-primary py-3.5 mt-2 hover:shadow-brand-500/20">
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Authenticating...</span>
            </div>
          ) : 'Access Portal'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm font-medium text-slate-400">
        New here? <Link to="/register" className="text-brand-600 font-bold hover:underline">Create an Account</Link>
      </p>
    </div>
  );
};

export default LoginPage;
