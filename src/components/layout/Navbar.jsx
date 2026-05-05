import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';
import { LogOut, UserCircle, Menu, Bell, Crown, User } from 'lucide-react';
import { logout } from '../../services/authService';
import { subscribeToUserNotifications } from '../../services/notificationService';
import NotificationPanel from '../notifications/NotificationPanel';
import toast from 'react-hot-toast';

const Navbar = ({ onMenuClick, isAdmin }) => {
  const { currentUser, userRole, organizationId, loading: authLoading } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Wait for auth to be fully loaded before subscribing
    if (!authLoading && currentUser && organizationId) {
      const unsubscribe = subscribeToUserNotifications(
        organizationId, 
        currentUser.uid, 
        (data) => {
          if (Array.isArray(data)) {
            setUnreadCount(data.filter(n => !n.read).length);
          }
        }
      );
      return () => unsubscribe();
    }
  }, [authLoading, currentUser, organizationId]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const userMenuItems = [
    {
      label: 'My Profile',
      icon: UserCircle,
      onClick: () => {
        window.location.href = userRole === 'admin' ? '/admin/dashboard' : '/member/profile';
      }
    },
    {
      label: 'Sign out',
      icon: LogOut,
      onClick: handleLogout,
      variant: 'danger'
    }
  ];

  return (
    <nav className={`h-20 backdrop-blur-xl border-b sticky top-0 z-40 flex items-center justify-between px-6 lg:px-10 transition-colors ${
      isAdmin ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/80 border-slate-200 text-slate-800'
    }`}>
      <div className="flex items-center gap-4">
        <button 
          className={`lg:hidden p-2 rounded-xl ${isAdmin ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
          onClick={onMenuClick}
        >
          <Menu size={24} />
        </button>
        <div className="text-xl font-black tracking-tight hidden sm:block">
          MemberSync <span className="text-brand-500 font-black">Portal</span>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`p-2 rounded-xl transition-all ${
              isAdmin ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-slate-900">
                {unreadCount}
              </span>
            )}
          </button>
          <NotificationPanel 
            isOpen={isNotificationsOpen} 
            onClose={() => setIsNotificationsOpen(false)} 
            organizationId={organizationId}
          />
        </div>

        <div className="hidden md:flex flex-col items-end mr-2">
          <span className={`text-sm font-bold ${isAdmin ? 'text-white' : 'text-slate-900'}`}>{currentUser?.displayName || 'User'}</span>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border mt-0.5 ${
            userRole === 'admin' 
              ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' 
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {userRole === 'admin' ? (
              <>
                <Crown size={10} className="text-brand-400" />
                <span>Admin</span>
              </>
            ) : (
              <>
                <User size={10} />
                <span>Member</span>
              </>
            )}
          </div>
        </div>
        
        <Dropdown 
          trigger={
            <button className="flex items-center hover:scale-105 transition-transform cursor-pointer">
              <Avatar 
                src={currentUser?.photoURL} 
                name={currentUser?.displayName || currentUser?.email || 'User'} 
                size="md" 
                className={isAdmin ? 'border-slate-700' : ''}
              />
            </button>
          }
          items={userMenuItems}
        />
      </div>
    </nav>
  );
};

export default Navbar;
