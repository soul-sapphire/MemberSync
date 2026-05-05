import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMemberByUid } from '../../services/memberService';
import { exportMembershipCardToPDF } from '../../services/pdfExportService';
import Avatar from '../../components/ui/Avatar';
import Logo from '../../components/ui/Logo';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

const MembershipCardPage = () => {
  const { currentUser } = useAuth();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const data = await getMemberByUid(currentUser.uid);
        setMember(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchMember();
  }, [currentUser]);

  const handleDownload = async () => {
    const toastId = toast.loading('Generating card...');
    try {
      await exportMembershipCardToPDF(member);
      toast.success('Membership Card downloaded!', { id: toastId });
    } catch (error) {
      toast.error('Failed to generate card', { id: toastId });
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!member) return null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Digital Membership Card</h1>
        <p className="text-slate-500 font-medium">Use this card for access and verification.</p>
      </div>

      {/* Card UI Design */}
      <div className="w-full max-w-md aspect-[1.586/1] bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 rounded-[2rem] shadow-2xl p-6 relative overflow-hidden text-white flex flex-col justify-between">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-brand-500/20 rounded-full blur-xl pointer-events-none -ml-10 -mb-10"></div>
        
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-brand-900 font-black text-sm">M</div>
              <span className="font-bold tracking-tight text-white/90">Member<span className="text-white">Sync</span></span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold ml-8">{member.planName} TIER</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest text-emerald-300">
            {member.status}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <Avatar src={member.profilePhoto || member.photoURL || member.profileImage} name={member.fullName} size="lg" className="border-2 border-white/20 shadow-lg" />
          <div>
            <h2 className="text-2xl font-black tracking-tight">{member.fullName}</h2>
            <p className="font-mono text-sm text-brand-200 mt-1">{member.memberId}</p>
          </div>
        </div>

        <div className="relative z-10 flex justify-between items-end border-t border-white/10 pt-4 mt-2">
          <div>
            <p className="text-[8px] uppercase tracking-widest text-white/50 font-bold mb-0.5">Valid Until</p>
            <p className="text-xs font-bold font-mono text-white/90">{member.expiryDate}</p>
          </div>
          {/* Fake Barcode/QR */}
          <div className="flex gap-0.5 opacity-70">
            {[...Array(16)].map((_, i) => (
              <div key={i} className={`h-8 bg-white ${Math.random() > 0.5 ? 'w-1' : 'w-0.5'}`}></div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleDownload} className="premium-button-primary mt-10 px-8 py-4 flex items-center gap-3">
        <Download size={20} />
        Download as PDF
      </button>
    </div>
  );
};

export default MembershipCardPage;
