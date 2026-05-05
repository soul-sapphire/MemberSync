import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Filter, Clock, User, Target, ChevronRight, Hash, Database } from 'lucide-react';
import { getAuditLogs } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { safeFormatDate } from '../../utils/formatters';

const AuditLogsPage = () => {
  const { organizationId } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    action: 'All',
  });

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

  const fetchLogs = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const data = await getAuditLogs(organizationId, null, filters);
      setLogs(data);
    } catch (error) {
      handleFirestoreError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [organizationId, filters.action]);

  const getActionColor = (action) => {
    if (!action) return 'text-slate-600 bg-slate-50 border-slate-100';
    if (action.includes('UPDATE')) return 'text-amber-600 bg-amber-50 border-amber-100';
    if (action.includes('DELETE') || action.includes('BAN') || action.includes('REJECT')) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (action.includes('ADD') || action.includes('CREATE') || action.includes('APPROVE')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (action.includes('PAYMENT')) return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    return 'text-brand-600 bg-brand-50 border-brand-100';
  };

  const filteredLogs = logs.filter(log => 
    log.actorName?.toLowerCase().includes(filters.search.toLowerCase()) ||
    log.action?.toLowerCase().includes(filters.search.toLowerCase()) ||
    log.reason?.toLowerCase().includes(filters.search.toLowerCase()) ||
    log.targetId?.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-100 pb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight xl:text-4xl">System <span className="text-brand-600">Audit Trail</span></h1>
            {logs.some(l => l.isDemo) && (
              <div className="flex items-center gap-1 px-3 py-1 bg-brand-50 text-brand-600 rounded-xl border border-brand-100 text-[10px] font-black uppercase tracking-widest shadow-sm">
                <Database size={12} /> Seeded Events
              </div>
            )}
          </div>
          <p className="text-slate-500 font-medium">Full transparency into administrative actions and automated system triggers.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Filter by actor, action or ID..." 
              className="premium-input pl-11 py-3 w-72"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div className="relative">
            <select 
              className="premium-input py-3 pl-10 pr-10 appearance-none cursor-pointer"
              value={filters.action}
              onChange={(e) => setFilters({...filters, action: e.target.value})}
            >
              <option value="All">All Categories</option>
              <option value="STATUS_SYNC">Automated Status Sync</option>
              <option value="UPDATE_PROFILE">Profile Management</option>
              <option value="RECORD_PAYMENT">Revenue/Payments</option>
              <option value="ADD_VIOLATION">Compliance/Violations</option>
              <option value="APPROVE_MEMBER">Access Approvals</option>
            </select>
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      <div className="premium-card overflow-hidden shadow-sm border border-slate-50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Initiator</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action Class</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Context & Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-brand-50 border-t-brand-600 rounded-full animate-spin" />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Decrypting Logs...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                        <Clock size={16} className="text-slate-300" />
                        {safeFormatDate(log.createdAt, 'MMM d, yyyy • HH:mm:ss')}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand-600 transition-colors">
                          <User size={18} />
                        </div>
                        <div className="min-w-0">
                          <span className="font-black text-slate-900 text-sm block">{log.actorName}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Authorized Admin</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getActionColor(log.action)}`}>
                        {log.action?.replace(/_/g, ' ') || 'SYSTEM EVENT'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-slate-600 font-bold leading-snug">{log.reason || log.description || 'System state change recorded.'}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-brand-500 uppercase bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">
                            <Target size={12} />
                            {log.targetType}
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                            <Hash size={12} />
                            {log.targetId}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <Shield size={48} className="text-slate-300" />
                      <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No matching system events found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
