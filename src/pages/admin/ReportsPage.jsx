import { useState, useEffect } from 'react';
import { fetchAllMembers, fetchAllPayments } from '../../reportEngine/reportDataService';
import { calculateMetrics } from '../../reportEngine/analyticsService';
import { generateReport, generateCSVReport } from '../../reportEngine/reportEngine';
import { FileText, Loader2, Users, DollarSign, Activity, AlertCircle, Download, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';

const ReportsPage = () => {
  const { organizationId } = useAuth();
  const [generating, setGenerating] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const [rawMembers, setRawMembers] = useState([]);
  const [rawPayments, setRawPayments] = useState([]);

  const handleFirestoreError = (error) => {
    console.error("Firestore Error:", error);
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      toast.error("Firestore index required. Please create the index using the Firebase console link shown in the browser console.", {
        duration: 6000,
        id: 'index-error'
      });
    } else {
      toast.error("Failed to load analytics data.");
    }
  };

  const initData = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const [members, payments] = await Promise.all([
        fetchAllMembers(organizationId),
        fetchAllPayments(organizationId)
      ]);
      
      setRawMembers(members);
      setRawPayments(payments);
      
      const m = calculateMetrics(members, payments);
      setMetrics(m);
    } catch (error) {
      handleFirestoreError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, [organizationId]);

  const handleGenerate = async (type, format = 'PDF') => {
    if (rawMembers.length === 0) {
      toast.error('No data available.');
      return;
    }
    const genId = `${type}_${format}`;
    setGenerating(genId);
    
    // Slight timeout to allow UI to update to loading state
    setTimeout(() => {
      try {
        let success = false;
        if (format === 'PDF') {
          success = generateReport(type, rawMembers, rawPayments);
        } else {
          success = generateCSVReport(type, rawMembers, rawPayments);
        }
        
        if (success) {
          toast.success(`${format} report generated successfully.`);
        }
      } catch (error) {
        console.error(error);
        toast.error(`Failed to generate ${format} report.`);
      } finally {
        setGenerating(null);
      }
    }, 100);
  };

  const reportsList = [
    { id: 'ALL_MEMBERS', title: 'Membership Overview', desc: 'Complete directory of all registered members.' },
    { id: 'ACTIVE_MEMBERS', title: 'Active Members', desc: 'Members currently holding an active status.' },
    { id: 'PENDING_MEMBERS', title: 'Pending Approvals', desc: 'Members awaiting profile completion or payment.' },
    { id: 'EXPIRED_MEMBERS', title: 'Expired Memberships', desc: 'Members whose subscriptions have expired.' },
    { id: 'SUSPENDED_MEMBERS', title: 'Suspended Accounts', desc: 'Members with suspended accounts.' },
    { id: 'PAYMENTS_SUMMARY', title: 'Payment Summary', desc: 'Log of all individual member transactions.' },
    { id: 'REVENUE_REPORT', title: 'Revenue Analytics', desc: 'Monthly aggregated revenue breakdown.' },
    { id: 'PLAN_DISTRIBUTION', title: 'Plan Distribution', desc: 'Analysis of membership tier adoption rates.' }
  ];

  if (loading || !metrics) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="w-16 h-16 border-8 border-brand-50 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-200 pb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Enterprise <span className="text-brand-600">Intelligence Hub</span></h1>
          <p className="text-slate-500 font-medium text-lg">Cross-collection analytics and high-fidelity report generation.</p>
        </div>
        {rawMembers.some(m => m.isDemo) && (
          <div className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-2xl border border-brand-100 font-bold text-xs uppercase tracking-widest">
            <Database size={16} /> Demo Environment Active
          </div>
        )}
      </div>

      {/* Top Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-6 shadow-inner"><Users size={28} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Members</p>
          <h3 className="text-4xl font-black text-slate-900 tabular-nums">{metrics.totalMembers}</h3>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="premium-card p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-6 shadow-inner"><Activity size={28} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Rate</p>
          <h3 className="text-4xl font-black text-slate-900 tabular-nums">{metrics.activeRate}%</h3>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${metrics.activeRate}%` }} />
          </div>
        </div>

        <div className="premium-card p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="p-4 bg-brand-50 text-brand-600 rounded-2xl w-fit mb-6 shadow-inner"><DollarSign size={28} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Revenue</p>
          <h3 className="text-4xl font-black text-slate-900 tabular-nums">{formatCurrency(metrics.totalRevenue)}</h3>
          <p className="mt-2 text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Verified Settlements</p>
        </div>

        <div className="premium-card p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-6 shadow-inner"><AlertCircle size={28} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Approval</p>
          <h3 className="text-4xl font-black text-slate-900 tabular-nums">{metrics.pendingCount}</h3>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${(metrics.pendingCount / (metrics.totalMembers || 1)) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {reportsList.map(report => {
          const isGenPDF = generating === `${report.id}_PDF`;
          const isGenCSV = generating === `${report.id}_CSV`;
          return (
            <div key={report.id} className="premium-card p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
              <div>
                <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300 shadow-inner">
                  <FileText size={28} />
                </div>
                <h3 className="font-black text-xl text-slate-900 mb-3">{report.title}</h3>
                <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">{report.desc}</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleGenerate(report.id, 'PDF')}
                  disabled={generating !== null}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                    isGenPDF 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-200'
                  }`}
                >
                  {isGenPDF ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                  Generate PDF
                </button>
                <button 
                  onClick={() => handleGenerate(report.id, 'CSV')}
                  disabled={generating !== null}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                    isGenCSV 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-white text-slate-700 border-2 border-slate-100 hover:border-brand-100 hover:text-brand-600'
                  }`}
                >
                  {isGenCSV ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Export CSV Raw
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportsPage;
