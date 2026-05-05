import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMemberByUid } from '../../services/memberService';
import { getPlans } from '../../services/planService';
import { recordPayment } from '../../services/paymentService';
import { Shield, Clock, CreditCard, CheckCircle, Wallet, Landmark, ArrowLeft } from 'lucide-react';
import CreditCardAnimation from "../../components/payments/CreditCardAnimation";
import toast from 'react-hot-toast';

const MyMembershipPage = () => {
  const { currentUser } = useAuth();
  const [member, setMember] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [memberData, plansData] = await Promise.all([
        getMemberByUid(currentUser.uid),
        getPlans()
      ]);
      setMember(memberData);
      setPlans(plansData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load membership details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const currentPlan = plans.find(p => p.name === member?.planName);
  const membershipPrice = currentPlan?.price || 0;

  const handleMemberPayment = async (cardData) => {
    setIsProcessing(true);
    try {
      await recordPayment(member, {
        amount: membershipPrice,
        method: paymentMethod === 'card' ? 'Credit Card' : paymentMethod,
        cardLast4: cardData?.cardLast4,
        cardType: cardData?.cardType,
        notes: `Member self-payment via ${paymentMethod}`
      });
      toast.success("Payment successful! Your membership is now Active.");
      setShowPayment(false);
      fetchData();
    } catch (error) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!member) return null;

  if (showPayment) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <button 
          onClick={() => { setShowPayment(false); setPaymentMethod(null); }}
          className="flex items-center gap-2 text-slate-500 hover:text-brand-600 font-bold transition-colors mb-4"
        >
          <ArrowLeft size={20} /> Back to Membership
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Complete Payment</h1>
          <p className="text-slate-500 font-medium">Securely activate your {member.planName} membership.</p>
        </div>

        {!paymentMethod ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'card', name: 'Credit Card', icon: CreditCard, color: 'brand' },
              { id: 'Cash', name: 'Cash', icon: Wallet, color: 'emerald' },
              { id: 'Bank', name: 'Bank Transfer', icon: Landmark, color: 'blue' }
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className="premium-card p-8 flex flex-col items-center gap-4 hover:border-brand-500 transition-all group"
              >
                <div className={`p-4 bg-${method.color}-50 text-${method.color}-600 rounded-2xl group-hover:scale-110 transition-transform`}>
                  <method.icon size={32} />
                </div>
                <h3 className="font-black text-xl text-slate-900">{method.name}</h3>
                <p className="text-slate-500 text-sm font-medium">Safe & Secure</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="premium-card p-8">
            {paymentMethod === 'card' ? (
              <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl font-black text-slate-900 mb-8 text-center flex items-center justify-center gap-3">
                  <CreditCard className="text-brand-600" /> Enter Card Details
                </h2>
                <CreditCardAnimation 
                  amount={membershipPrice} 
                  onPaymentSubmit={handleMemberPayment} 
                />
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  {paymentMethod === 'Cash' ? <Wallet size={40} /> : <Landmark size={40} />}
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Confirm {paymentMethod} Payment</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  You are choosing to pay <strong>${membershipPrice}</strong> via {paymentMethod}. 
                  Please confirm to proceed with activation.
                </p>
                <button 
                  onClick={() => handleMemberPayment()}
                  disabled={isProcessing}
                  className="premium-button-primary px-12 py-4 text-lg"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">My Membership Details</h1>
          <p className="text-slate-500 font-medium">View your current plan and benefits.</p>
        </div>
        {member.status === 'Pending' && (
          <button 
            onClick={() => setShowPayment(true)}
            className="premium-button-primary px-8 py-3 flex items-center gap-2"
          >
            <CreditCard size={20} /> Pay Membership
          </button>
        )}
      </div>

      <div className="premium-card p-8 bg-brand-600 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-brand-100 font-bold uppercase tracking-widest text-xs mb-1">Current Plan</p>
            <h2 className="text-5xl font-black">{member.planName} Tier</h2>
            <div className="flex items-center gap-2 mt-4">
              <span className={`w-2 h-2 rounded-full ${member.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`}></span>
              <span className={`text-sm font-bold uppercase tracking-widest ${member.status === 'Active' ? 'text-emerald-100' : 'text-rose-100'}`}>
                {member.status}
              </span>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-brand-100 font-bold uppercase tracking-widest text-xs mb-1">Membership ID</p>
            <p className="text-2xl font-bold font-mono">{member.memberId}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-6 text-slate-800">
            <Clock className="text-amber-500" />
            <h3 className="font-black text-lg">Billing Cycle</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-slate-100 pb-4">
              <span className="text-slate-500 font-medium">Joined On</span>
              <span className="font-bold text-slate-900">{member.joinDate}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-4">
              <span className="text-slate-500 font-medium">Valid Until</span>
              <span className="font-bold text-slate-900">{member.expiryDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Payment Status</span>
              <span className={`font-bold ${member.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {member.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-6 text-slate-800">
            <Shield className="text-brand-500" />
            <h3 className="font-black text-lg">Plan Benefits</h3>
          </div>
          <ul className="space-y-3">
            {['24/7 Facility Access', 'Free Group Classes', '1 Personal Training Session/mo', 'Guest Pass Included'].map((benefit, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                <CheckCircle size={18} className="text-emerald-500" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MyMembershipPage;
