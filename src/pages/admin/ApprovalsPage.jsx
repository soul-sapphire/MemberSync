import { useState, useEffect } from 'react';
import { getMembers, updateMember } from '../../services/memberService';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, XCircle, AlertTriangle, Clock, Mail, Calendar, CreditCard, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';
import { safeFormatDate } from '../../utils/formatters';

const ApprovalsPage = () => {
  const { organizationId } = useAuth();
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const data = await getMembers(organizationId);
      // Support both "Pending" status and "Pending" paymentStatus for broader visibility
      setPendingMembers(data.filter(m => m.status === 'Pending' || m.paymentStatus === 'Pending'));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load approvals queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [organizationId]);

  const handleAction = async (id, status, actionName) => {
    try {
      await updateMember(id, { status });
      toast.success(`Member ${actionName} successfully`);
      fetchPending();
    } catch (error) {
      toast.error(`Failed to execute ${actionName.toLowerCase()} action`);
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-50 border-t-brand-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-100 pb-8 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight xl:text-4xl">Approvals <span className="text-brand-600">Queue</span></h1>
          <p className="text-slate-500 font-medium">Verify credentials and activate new membership licenses.</p>
        </div>
        <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
          <Clock size={16} className="text-brand-500" />
          {pendingMembers.length} Request{pendingMembers.length !== 1 ? 's' : ''} Active
        </div>
      </div>

      {pendingMembers.length === 0 ? (
        <div className="premium-card p-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
          <div className="p-6 bg-emerald-50 text-emerald-600 rounded-[2rem] mb-6 shadow-inner">
            <ShieldCheck size={48} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Queue Fully Processed</h3>
          <p className="text-slate-500 max-w-md mx-auto font-medium">Excellent work! There are no pending applications requiring your attention at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pendingMembers.map(member => (
            <div key={member.id} className="premium-card p-8 flex flex-col justify-between border-t-4 border-t-amber-400 shadow-sm hover:shadow-xl transition-all duration-300">
              <div>
                <div className="flex items-center gap-5 mb-8">
                  <Avatar src={member.profileImage} name={member.fullName} size="lg" className="border-2 border-white shadow-md" />
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-lg leading-tight truncate" title={member.fullName}>{member.fullName}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {member.memberId || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                    <Mail size={16} className="text-brand-500 shrink-0" />
                    <span className="font-bold truncate">{member.email}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tier</p>
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                        <div className="w-2 h-2 rounded-full bg-brand-500" />
                        {member.planName || 'Standard'}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Billing</p>
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-600">
                        <CreditCard size={12} />
                        {member.paymentStatus || 'Pending'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    <Calendar size={14} />
                    Applied On: {safeFormatDate(member.joinDate || member.createdAt, 'MMM d, yyyy')}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => handleAction(member.id, 'Active', 'Approved')}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all"
                >
                  <CheckCircle size={14} /> Approve
                </button>
                <button 
                  onClick={() => handleAction(member.id, 'Rejected', 'Rejected')}
                  className="px-4 flex items-center justify-center text-rose-500 hover:bg-rose-50 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-rose-100 transition-all"
                  title="Reject"
                >
                  <XCircle size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;
