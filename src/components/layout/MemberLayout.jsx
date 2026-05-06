import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../config';
import Navbar from './Navbar';
import Logo from '../ui/Logo';
import {
  LayoutDashboard, UserCircle, CreditCard, Bell, LogOut
} from 'lucide-react';
import { logout } from '../../services/authService';
import toast from 'react-hot-toast';

const MemberSidebar = () => {
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const memberLinks = [
    { name: 'Dashboard', path: '/member/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/member/profile', icon: UserCircle },
    { name: 'Digital Card', path: '/member/membership-card', icon: CreditCard },
    { name: 'Announcements', path: '/member/announcements', icon: Bell },
  ];

  return (
    <aside className="w-72 bg-white h-screen sticky top-0 flex flex-col border-r border-slate-200 z-40">
      <div className="h-20 flex items-center px-8 border-b border-slate-100">
        <Logo />
        <span className="ml-2 font-bold text-slate-400 text-sm">Portal</span>
      </div>

      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-4">
          Menu
        </div>
        <nav className="space-y-2">
          {memberLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-semibold transition-all ${isActive
                    ? 'bg-brand-50 text-brand-600 shadow-sm border border-brand-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <link.icon size={20} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-semibold text-rose-500 hover:bg-rose-100 transition-all"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
};

const MemberLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const { userRole } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (!currentUser) return;
      
      // ADMINS: Skip profile completion check
      if (userRole === 'admin') {
        setChecking(false);
        return;
      }

      try {
        const { getMemberByUid } = await import('../../services/memberService');
        const member = await getMemberByUid(currentUser.uid);
        if (!member && location.pathname !== '/member/complete-profile') {
          navigate('/member/complete-profile', { replace: true });
        }
      } catch (error) {
        console.error("Profile check failed", error);
      } finally {
        setChecking(false);
      }
    };
    checkProfile();
  }, [currentUser, userRole, location.pathname, navigate]);

  if (checking) return <div className="flex h-screen items-center justify-center"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <div className="hidden lg:block">
        <MemberSidebar />
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
            >
              <MemberSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MemberLayout;
