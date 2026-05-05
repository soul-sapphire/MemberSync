import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAdminReviewTasks, updateAdminReviewTask } from '../../services/rulesEngineService';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  AlertTriangle,
  ExternalLink,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { safeFormatDate } from '../../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

const AdminReviewTasksPage = () => {
  const { organizationId } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTasks = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const data = await getAdminReviewTasks(organizationId);
      setTasks(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load review tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [organizationId]);

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await updateAdminReviewTask(taskId, { status: newStatus });
      toast.success(`Task marked as ${newStatus}`);
      fetchTasks();
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getReasonLabel = (reason) => {
    return reason.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) return <div className="flex justify-center p-20"><div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Administrative <span className="text-rose-600">Review Queue</span></h1>
          <p className="text-slate-500 font-medium">Critical membership issues requiring manual intervention.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
            {['open', 'resolved', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by member or reason..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-500 focus:ring-0 transition-all font-semibold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.length > 0 ? (
          <AnimatePresence>
            {filteredTasks.map((task, idx) => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`premium-card p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-brand-500 transition-all ${
                  task.status === 'resolved' ? 'opacity-60 grayscale' : ''
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                  task.priority === 'critical' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
                }`}>
                  <AlertTriangle size={28} />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-slate-900">{task.memberName}</h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.status === 'resolved' && (
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Resolved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1 text-rose-600">
                      <ShieldAlert size={14} /> {getReasonLabel(task.reason)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> Created {safeFormatDate(task.createdAt, 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={14} /> UID: {task.memberUID}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {task.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Link 
                    to={`/admin/members/${task.memberId}`}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-black transition-all"
                  >
                    <ExternalLink size={14} /> View Member
                  </Link>
                  {task.status === 'open' ? (
                    <button 
                      onClick={() => handleStatusUpdate(task.id, 'resolved')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all"
                    >
                      <CheckCircle2 size={14} /> Resolve
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleStatusUpdate(task.id, 'open')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-400 border border-slate-200 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all"
                    >
                      <XCircle size={14} /> Reopen
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="premium-card p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Queue is Empty</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">
              No pending membership issues found. All membership logic is currently synchronized.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviewTasksPage;
