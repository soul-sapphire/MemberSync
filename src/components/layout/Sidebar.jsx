import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Users, FileText, Settings, 
  UserCircle, CreditCard, LogOut 
} from 'lucide-react';
import Logo from '../ui/Logo';
import { logout } from '../../services/authService';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const { userRole } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Members', path: '/admin/members', icon: Users },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const memberLinks = [
    { name: 'Dashboard', path: '/member/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/member/profile', icon: UserCircle },
    { name: 'Membership Card', path: '/member/membership-card', icon: CreditCard },
  ];

  const links = userRole === 'admin' ? adminLinks : memberLinks;

  return (
    <aside className="w-72 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col hidden lg:flex">
      <div className="h-20 flex items-center px-8 border-b border-slate-100">
        <Logo />
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-4">
          Menu
        </div>
        <nav className="space-y-2">
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-semibold transition-all ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-brand-600'
                }`}
              >
                <link.icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-slate-100">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-semibold text-rose-500 hover:bg-rose-50 transition-all"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
