import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import { 
  LayoutDashboard, Users, FileText, Settings, 
  CheckSquare, DollarSign, Package, Bell, LogOut, ClipboardList 
} from 'lucide-react';
import { logout } from '../../services/authService';
import toast from 'react-hot-toast';

const AdminSidebar = () => {
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
    { name: 'Approvals', path: '/admin/approvals', icon: CheckSquare },
    { name: 'Payments', path: '/admin/payments', icon: DollarSign },
    { name: 'Plans', path: '/admin/plans', icon: Package },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Announcements', path: '/admin/announcements', icon: Bell },
    { name: 'Audit Trail', path: '/admin/audit-logs', icon: ClipboardList },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-slate-900 h-screen sticky top-0 flex flex-col text-white shadow-2xl z-40">
      <div className="h-20 flex items-center px-8 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded flex items-center justify-center text-white font-black">M</div>
          <span className="font-bold tracking-tight text-xl">MemberSync <span className="text-brand-400">Admin</span></span>
        </div>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
        <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 px-4">
          Admin Panel
        </div>
        <nav className="space-y-1">
          {adminLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <link.icon size={20} className={isActive ? 'text-white' : 'text-slate-500'} />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-950">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
};

const AdminLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>
      
      {/* Mobile Sidebar Overlay */}
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
              <AdminSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} isAdmin />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
