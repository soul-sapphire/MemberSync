import { useState, useEffect } from 'react';
import { getMembers } from '../../services/memberService';
import { getPayments, recordPayment } from '../../services/paymentService';
import { getPlans } from '../../services/planService';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, Plus, FileText, CreditCard, Users, CheckCircle, Search, Calendar, Landmark } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import CreditCardAnimation from "../../components/payments/CreditCardAnimation";
import { safeFormatDate, formatCurrency, getPaymentStatusColor } from '../../utils/formatters';

const PaymentsPage = () => {
  const { organizationId, currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFirestoreError = (error) => {
    console.error("Firestore Error:", error);
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      toast.error("Firestore index required. Please create the index using the Firebase console link shown in the browser console.", {
        duration: 6000,
        id: 'index-error'
      });
    } else {
      toast.error(`Error: ${error.message}`);
    }
  };

  const fetchData = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const [membersData, paymentsData, plansData] = await Promise.all([
        getMembers(organizationId),
        getPayments(organizationId),
        getPlans(organizationId)
      ]);
      setMembers(membersData);
      setPayments(paymentsData);
      setPlans(plansData);
    } catch (error) {
      handleFirestoreError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  const pendingMembers = members.filter(m => 
    m.status === 'Pending' || m.paymentStatus === 'Pending'
  ).filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.memberId && m.memberId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAdminPayment = async (member, cardData) => {
    setIsSaving(true);
    try {
      const plan = plans.find(p => p.name === member.planName);
      const amount = plan?.price || 0;

      await recordPayment(organizationId, member, {
        amount,
        method: paymentMethod,
        cardLast4: cardData?.cardLast4,
        cardType: cardData?.cardType,
        notes: `Admin recorded payment via ${paymentMethod}`
      }, currentUser);

      toast.success(`Payment recorded for ${member.fullName}`);
      setIsModalOpen(false);
      setSelectedMember(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setIsSaving(false);
    }
  };

  const openPaymentModal = (member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
    setPaymentMethod('Credit Card');
  };

  if (loading) return <div className="flex justify-center p-10"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Revenue <span className="text-brand-600">Center</span></h1>
          <p className="text-slate-500 font-medium">Full visibility into collections, member billings, and transaction history.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Filter by name or ID..." 
            className="premium-input pl-11 py-3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Stats Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-card p-8 bg-slate-900 text-white relative overflow-hidden shadow-xl shadow-slate-200">
            <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12"><DollarSign size={120} /></div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Revenue</p>
            <h3 className="text-4xl font-black mb-2">
              {formatCurrency(members.reduce((sum, m) => sum + (Number(m.totalPaid) || 0), 0))}
            </h3>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-white/5 w-fit px-3 py-1 rounded-full">
              <CheckCircle size={12} /> System-wide collection
            </div>
          </div>

          <div className="premium-card p-8 border-2 border-slate-50">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Pending Approvals</p>
            <h3 className="text-4xl font-black text-rose-600 mb-2">
              {members.filter(m => m.status === 'Pending').length}
            </h3>
            <p className="text-slate-500 text-xs font-bold">Requires verification</p>
          </div>
        </div>

        {/* Pending Members Table */}
        <div className="lg:col-span-3 premium-card p-8 overflow-hidden shadow-sm">
          <h3 className="font-black text-xl text-slate-900 mb-8 flex items-center gap-3">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl"><Users size={20} /></div>
            Unpaid / Pending Members
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-4">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-4 pb-2">Member Details</th>
                  <th className="px-4 pb-2">Selected Plan</th>
                  <th className="px-4 pb-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingMembers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-16 text-center text-slate-400 font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle size={40} className="text-slate-200" />
                        <p>All members are currently paid up.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendingMembers.map(member => (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-5 bg-slate-50/50 rounded-l-[1.5rem] border-y border-l border-slate-100">
                        <div className="font-black text-slate-900 text-sm truncate" title={member.fullName}>{member.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase truncate" title={member.email}>{member.email}</div>
                      </td>
                      <td className="px-4 py-5 bg-slate-50/50 border-y border-slate-100">
                        <div className="font-bold text-brand-600 text-sm">{member.planName || 'Standard Plan'}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Pending Verification</div>
                      </td>
                      <td className="px-4 py-5 bg-slate-50/50 rounded-r-[1.5rem] border-y border-r border-slate-100 text-right">
                        <button 
                          onClick={() => openPaymentModal(member)}
                          className="premium-button-primary py-2.5 px-6 text-xs font-black uppercase tracking-widest flex items-center gap-2 ml-auto shadow-brand-200/50"
                        >
                          <CreditCard size={14} /> Record Payment
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="premium-card p-8 shadow-sm">
        <h3 className="font-black text-xl text-slate-900 mb-8 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><FileText size={20} /></div>
          Recent Transactions Audit
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-4 pb-4">Beneficiary</th>
                <th className="px-4 pb-4">Transaction Date</th>
                <th className="px-4 pb-4">Payment Method</th>
                <th className="px-4 pb-4 text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map(payment => (
                <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 text-sm truncate max-w-[250px]" title={payment.fullName}>
                      {payment.fullName} 
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold font-mono">ID: {payment.memberId || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      {safeFormatDate(payment.paymentDate || payment.paidAt, 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200">
                      {payment.method === 'Credit Card' ? <CreditCard size={12} className="text-slate-500" /> : <Landmark size={12} className="text-slate-500" />}
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                        {payment.method} {payment.cardLast4 && `•••• ${payment.cardLast4}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="font-black text-emerald-600 text-base">
                      +{formatCurrency(payment.amount)}
                    </div>
                    <div className="text-[9px] font-black uppercase text-emerald-400 tracking-tighter">Settled</div>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No transactions recorded in current period</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedMember(null); }} 
        title={`Record Payment for ${selectedMember?.fullName}`}
        maxWidth="max-w-5xl"
      >
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6 p-6 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-brand-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Target Billing Plan</p>
              <p className="text-xl font-black text-white">{selectedMember?.planName || 'Standard Tier'}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Required Settlement</p>
              <p className="text-3xl font-black text-brand-400">
                {formatCurrency(plans.find(p => p.name === selectedMember?.planName)?.price || 0)}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Choose Payment Gateway</label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'Credit Card', icon: CreditCard },
                { id: 'Cash', icon: DollarSign },
                { id: 'Bank', icon: Landmark }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all flex flex-col items-center gap-3 ${
                    paymentMethod === method.id 
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-xl shadow-brand-100/50' 
                      : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <method.icon size={20} />
                  {method.id}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'Credit Card' ? (
            <div className="pt-6 border-t border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
              <CreditCardAnimation 
                amount={plans.find(p => p.name === selectedMember?.planName)?.price || 0}
                onPaymentSubmit={(data) => handleAdminPayment(selectedMember, data)}
              />
            </div>
          ) : (
            <div className="pt-8 flex flex-col gap-6 text-center animate-in zoom-in-95 duration-300">
              <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-500 font-medium">
                  Recording this as a <span className="font-black text-slate-900">{paymentMethod}</span> payment will immediately update the member's account status and issue a digital receipt.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleAdminPayment(selectedMember)}
                  disabled={isSaving}
                  className="premium-button-primary w-full py-5 text-lg shadow-xl shadow-brand-200"
                >
                  {isSaving ? 'Synchronizing Records...' : `Finalize ${paymentMethod} Collection`}
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PaymentsPage;
