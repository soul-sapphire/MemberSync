import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMemberByUid } from '../../services/memberService';
import { motion } from 'framer-motion';
import { UserCircle, CreditCard, Bell, Calendar, Shield, Clock } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import { safeFormatDate, getStatusColor as getStatusColorUtil, formatCurrency } from '../../utils/formatters';

const MemberDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMemberByUid(currentUser.uid);
        if (!data) {
          navigate('/member/complete-profile');
        } else {
          setMember(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchProfile();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!member) return null;


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Member Dashboard</h1>
          <p className="text-slate-500 font-medium">Welcome back, {member.fullName?.split(' ')[0] || 'Member'}!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="premium-card p-8 flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
            
            <Avatar src={member.profileImage} name={member.fullName} size="xl" className="border-4 border-white shadow-xl" />
            
            <div className="flex-1 text-center sm:text-left z-10">
              <h2 className="text-2xl font-black text-slate-900 mb-1">{member.fullName}</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{member.memberId}</p>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border shadow-sm ${getStatusColorUtil(member.status)}`}>
                  {member.status}
                </span>
                <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-brand-200 bg-brand-50 text-brand-600 shadow-sm">
                  {member.planName || 'Basic'} Tier
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="premium-card p-6 border-t-4 border-t-indigo-500">
              <div className="flex items-center gap-3 mb-4 text-indigo-600">
                <Calendar size={24} />
                <h3 className="font-black text-slate-800">Membership Valid Until</h3>
              </div>
              <p className="text-3xl font-black text-slate-900">{safeFormatDate(member.expiryDate, 'MMM d, yyyy')}</p>
              <p className="text-sm font-bold text-slate-400 mt-2">Joined: {safeFormatDate(member.joinDate, 'MMM d, yyyy')}</p>
            </div>
            <div className="premium-card p-6 border-t-4 border-t-emerald-500">
              <div className="flex items-center gap-3 mb-4 text-emerald-600">
                <Shield size={24} />
                <h3 className="font-black text-slate-800">Payment Status</h3>
              </div>
              <p className="text-3xl font-black text-slate-900">{member.paymentStatus || 'Pending'}</p>
              <p className="text-sm font-bold text-slate-400 mt-2">Lifetime Paid: {formatCurrency(member.totalPaid)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="premium-card p-6 bg-slate-900 text-white shadow-xl shadow-slate-900/20">
            <h3 className="font-black text-lg mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-400"></span>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link to="/member/profile" className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors font-semibold group">
                <div className="p-2 bg-brand-500/20 rounded-xl text-brand-300 group-hover:scale-110 transition-transform">
                  <UserCircle size={20} />
                </div>
                Edit Profile
              </Link>
              <Link to="/member/membership-card" className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors font-semibold group">
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-300 group-hover:scale-110 transition-transform">
                  <CreditCard size={20} />
                </div>
                Digital Card
              </Link>
              <Link to="/member/announcements" className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors font-semibold group text-left">
                <div className="p-2 bg-amber-500/20 rounded-xl text-amber-300 group-hover:scale-110 transition-transform">
                  <Bell size={20} />
                </div>
                Announcements
              </Link>
            </div>
          </div>
          
          <div className="premium-card p-6 border border-slate-200">
            <h3 className="font-black text-slate-800 mb-4">Complete Profile</h3>
            <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
              <div className="bg-brand-500 h-3 rounded-full w-3/4"></div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-right">75% Completed</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MemberDashboard;
