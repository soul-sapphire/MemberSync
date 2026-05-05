import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Info, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserNotifications, markAsRead } from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';

const NotificationPanel = ({ isOpen, onClose, organizationId }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      const fetchNotifications = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await getUserNotifications(organizationId || 'default', currentUser.uid); 
          setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error(err);
          if (err.code === 'failed-precondition' && err.message.includes('index')) {
            setError('INDEX_REQUIRED');
          }
        } finally {
          setLoading(false);
        }
      };
      fetchNotifications();
    }
  }, [isOpen, currentUser, organizationId]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'MEMBERSHIP_EXPIRED':
      case 'MEMBERSHIP_SUSPENDED':
        return <AlertTriangle className="text-rose-600" size={18} />;
      case 'PAYMENT_RECEIVED':
        return <Check className="text-emerald-600" size={18} />;
      default:
        return <Info className="text-brand-600" size={18} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed right-4 top-20 z-[70] w-full max-w-sm bg-white rounded-[2rem] shadow-premium border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-brand-600" />
                <h3 className="font-black text-slate-900">Notifications</h3>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin mx-auto" />
                </div>
              ) : error === 'INDEX_REQUIRED' ? (
                <div className="p-12 text-center">
                  <AlertTriangle size={40} className="text-amber-500 mx-auto mb-4" />
                  <p className="text-slate-600 text-sm font-bold leading-relaxed">
                    Firestore index required. Create the index from the Firebase console link, then refresh.
                  </p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-5 hover:bg-slate-50 transition-colors cursor-pointer group relative ${!n.read ? 'bg-brand-50/30' : ''}`}
                      onClick={() => !n.read && handleMarkAsRead(n.id)}
                    >
                      {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-600" />}
                      <div className="flex gap-4">
                        <div className="mt-1">{getIcon(n.type)}</div>
                        <div className="flex-1">
                          <h4 className={`text-sm font-black mb-1 ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mb-2">{n.message}</p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            <Clock size={10} />
                            {n.createdAt?.toDate ? formatDistanceToNow(n.createdAt.toDate()) + ' ago' : 'Just now'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Bell size={40} className="text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">All caught up!</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                <button className="text-xs font-black text-brand-600 hover:underline">View All Notifications</button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;
