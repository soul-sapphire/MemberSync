import { useState, useEffect } from 'react';
import { getMembers } from '../../services/memberService';
import { isExpiringSoon } from '../../rules/membershipRules';
import { 
  Users, 
  UserCheck, 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  TrendingUp,
  BarChart3,
  Zap,
  Database,
  ShieldCheck,
  ClipboardList,
  History,
  Play,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { safeFormatDate, formatCurrency, safeTimestampToDate } from '../../utils/formatters';
import { runMembershipRulesEngineNow, getMaintenanceRuns } from '../../services/rulesEngineService';

const AdminDashboard = () => {
  const { organizationId } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAutomating, setIsAutomating] = useState(false);
  const [maintenanceRuns, setMaintenanceRuns] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Analytics State
  const [metrics, setMetrics] = useState({
    activeCount: 0,
    pendingCount: 0,
    expiringSoonCount: 0,
    atRiskCount: 0,
    totalRevenue: 0
  });

  const fetchDashboardData = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      
      const [membersData, runsData] = await Promise.all([
        getMembers(organizationId),
        getMaintenanceRuns(organizationId)
      ]);

      setMembers(membersData);
      setMaintenanceRuns(runsData);

      const computedActive = membersData.filter(m => m.status === 'Active').length;
      const computedPending = membersData.filter(m => m.status === 'Pending').length;
      const computedExpiringSoon = membersData.filter(m => isExpiringSoon(m.expiryDate, 7)).length;
      const computedAtRisk = membersData.filter(m => 
        m.status === 'Suspended' || 
        m.status === 'Expired' || 
        m.paymentStatus !== 'Paid' || 
        m.standing === 'critical' ||
        m.standing === 'at_risk'
      ).length;
      const computedRevenue = membersData.reduce((sum, m) => sum + (Number(m.totalPaid) || 0), 0);

      setMetrics({
        activeCount: computedActive,
        pendingCount: computedPending,
        expiringSoonCount: computedExpiringSoon,
        atRiskCount: computedAtRisk,
        totalRevenue: computedRevenue
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    setMounted(true);
  }, [organizationId]);

  const handleRunEngine = async (dryRun = false) => {
    try {
      setIsAutomating(true);
      const toastId = toast.loading(dryRun ? 'Simulating intelligence scan...' : 'Running intelligence scan...');
      
      const result = await runMembershipRulesEngineNow(organizationId, dryRun);
      
      if (dryRun) {
        toast.success(`Simulation complete! ${result.updated} members would be updated.`, { id: toastId });
      } else {
        toast.success(`Intelligence Scan complete! ${result.updated} updated, ${result.notificationsCreated} notifications.`, { id: toastId });
        await fetchDashboardData();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Intelligence scan failed to run");
    } finally {
      setIsAutomating(false);
    }
  };

  if (loading) return (
    <div className="flex h-[70vh] items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-50 border-t-brand-600 rounded-full animate-spin"></div>
    </div>
  );

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  const growthData = months.slice(0, currentMonth + 1).map((month, idx) => {
    const count = members.filter(m => {
      const date = safeTimestampToDate(m.createdAt || m.joinDate);
      return date.getMonth() === idx;
    }).length;
    const previousTotal = idx > 0 ? 10 : 0;
    return { name: month, members: count + (idx * 2) + previousTotal };
  });

  const pieData = [
    { name: 'Active', value: metrics.activeCount, color: '#10b981' },
    { name: 'Other', value: members.length - metrics.activeCount, color: '#e2e8f0' }
  ];

  const stats = [
    { label: 'Active', value: metrics.activeCount, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending', value: metrics.pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Expiring', value: metrics.expiringSoonCount, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Restricted', value: metrics.atRiskCount, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const lastRun = maintenanceRuns[0];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight xl:text-4xl">Platform <span className="text-brand-600">Pulse</span></h1>
            {members.some(m => m.isDemo) && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 text-[10px] font-black uppercase tracking-widest shadow-sm">
                <Database size={12} />
                Demo Records
              </div>
            )}
          </div>
          <p className="text-slate-500 font-medium">Real-time oversight of your membership ecosystem.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/admin/review-tasks" className="px-6 py-3 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-2">
            <ShieldCheck size={18} /> Review Tasks
          </Link>
          <Link to="/admin/reports" className="px-6 py-3 bg-white text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all flex items-center gap-2">
            <BarChart3 size={18} /> Reports
          </Link>
        </div>
      </div>

      {/* Section B: Main top dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Acquisition Trends */}
        <div className="lg:col-span-2 premium-card p-10 flex flex-col shadow-sm border border-slate-50">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-brand-600 font-black uppercase tracking-widest text-[10px] mb-1">Growth Vectors</p>
              <h3 className="text-2xl font-black text-slate-900">Acquisition Trends</h3>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Collections</p>
              <h3 className="text-3xl font-black text-emerald-600">{formatCurrency(metrics.totalRevenue)}</h3>
            </div>
          </div>
          <div className="h-72 w-full">
            {mounted && growthData.length > 0 && members.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="members"
                    stroke="#6366f1"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorMembers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <BarChart3 size={48} className="mb-2 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest">Awaiting growth data...</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Stat Cards - 2x2 grid on desktop */}
        <div className="grid grid-cols-2 gap-4 h-full content-start">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx} 
              className="premium-card p-6 group hover:border-brand-500 transition-all border border-slate-50 flex flex-col justify-center"
            >
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 tabular-nums">{stat.value}</h3>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Section C: Below the graph/stat grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT: Member Health */}
        <div className="premium-card p-10 flex flex-col items-center justify-center text-center border border-slate-50">
          <div className="w-full text-left mb-6">
            <h3 className="text-xl font-black text-slate-900 mb-2">Member Health</h3>
            <p className="text-slate-500 text-sm font-medium">Healthy vs Restricted accounts.</p>
          </div>
          <div className="h-64 w-full relative">
            {mounted && members.length > 0 && metrics.activeCount + (members.length - metrics.activeCount) > 0 ? (
              <>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-slate-900">
                    {members.length > 0 ? Math.round((metrics.activeCount / members.length) * 100) : 0}%
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <Database size={40} className="mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No data available</p>
              </div>
            )}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 w-full">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50 text-left">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Active</p>
              <p className="text-xl font-black text-emerald-700">{metrics.activeCount}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-rose-500">Restricted</p>
              <p className="text-xl font-black text-rose-600">{members.length - metrics.activeCount}</p>
            </div>
          </div>
        </div>

        {/* RIGHT: MemberSync Intelligence Engine */}
        <div className="premium-card p-10 border-t-4 border-t-brand-600 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Zap size={120} />
          </div>
          
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="mb-8">
              <div className="flex items-center gap-2 text-brand-600 mb-2">
                <Zap size={16} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Lifecycle Intelligence</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">MemberSync Intelligence Engine</h3>
              <p className="text-sm text-slate-500 font-medium max-w-sm">
                Automated status escalation, expiry reminders, and attendance risk detection. 
                System runs daily at 00:00.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 mb-auto">
              <button 
                onClick={() => handleRunEngine(false)}
                disabled={isAutomating}
                className="px-5 py-2.5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Play size={14} fill="currentColor" /> {isAutomating ? 'Processing...' : 'Run Intelligence Scan'}
              </button>
              <button 
                onClick={() => handleRunEngine(true)}
                disabled={isAutomating}
                className="px-5 py-2.5 bg-white text-slate-700 border-2 border-slate-100 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Eye size={14} /> Preview Scan
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <History size={10} /> Last Run
                  </p>
                  <p className="text-xs font-black text-slate-900">
                    {lastRun ? safeFormatDate(lastRun.createdAt, 'MMM d, p') : 'Never'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Users size={10} /> Checked
                  </p>
                  <p className="text-lg font-black text-slate-900">{lastRun?.checked || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 text-brand-600">
                    <CheckCircle2 size={10} /> Updated
                  </p>
                  <p className="text-lg font-black text-brand-600">{lastRun?.updated || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 text-rose-500">
                    <ClipboardList size={10} /> Tasks
                  </p>
                  <p className="text-lg font-black text-rose-500">{lastRun?.reviewTasksCreated || 0}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="mt-5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-600 transition-colors flex items-center gap-1"
              >
                {showHistory ? 'Hide Run History' : 'View Detailed Run History'} <ChevronRight size={12} className={showHistory ? 'rotate-90' : ''} />
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-2 bg-slate-50 rounded-xl p-3 max-h-[150px] overflow-y-auto no-scrollbar border border-slate-100 shadow-inner">
                      {maintenanceRuns.length > 0 ? maintenanceRuns.map((run, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${run.dryRun ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {run.dryRun ? <Eye size={12} /> : <CheckCircle2 size={12} />}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-900">{safeFormatDate(run.createdAt, 'MMM d, HH:mm')}</p>
                              <p className="text-[8px] font-bold text-slate-400">Trigger: {run.triggeredBy}</p>
                            </div>
                          </div>
                          <div className="flex gap-3 text-center">
                            <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Update</p>
                              <p className="text-[10px] font-black text-brand-600">{run.updated}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Notif</p>
                              <p className="text-[10px] font-black text-slate-900">{run.notificationsCreated}</p>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <p className="text-center py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No runs recorded yet</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
