import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Download, Calendar, Mail, Phone, MapPin,
  CreditCard, Shield, Clock, FileText, Edit2, AlertTriangle,
  History, CheckCircle, XCircle, Ban, ShieldAlert, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';


import { getMemberAttendance, recordAttendance } from '../../services/attendanceService';
import { getMemberViolations, addViolation } from '../../services/violationService';
import { getAuditLogs, logAction } from '../../services/auditService';
import { getMemberById, updateMember } from '../../services/memberService';
import { exportSingleMemberToPDF } from '../../services/pdfExportService';
import { MEMBERSHIP_STATUS } from '../../rules/membershipRules';
import { useAuth } from '../../context/AuthContext';
import { calculateMemberHealth, getHealthColor } from '../../utils/healthScore';
import { safeFormatDate, formatCurrency, getStatusColor } from '../../utils/formatters';

import Modal from '../../components/ui/Modal';
import MemberForm from '../../components/members/MemberForm';
import Avatar from '../../components/ui/Avatar';

const MemberDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [member, setMember] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [violations, setViolations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViolationModalOpen, setIsViolationModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getMemberById(id);
      setMember(data);

      const [att, viol, logs] = await Promise.all([
        getMemberAttendance(data.organizationId, data.memberId),
        getMemberViolations(data.organizationId, data.memberId),
        getAuditLogs(data.organizationId, id)
      ]);

      setAttendance(att);
      setViolations(viol);
      setAuditLogs(logs);
    } catch (error) {
      toast.error("Profile not found in system");
      navigate('/admin/members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleUpdateMember = async (data) => {
    try {
      setIsSubmitting(true);
      await updateMember(id, data);
      await logAction(member.organizationId, currentUser, 'UPDATE_PROFILE', 'member', id, 'Profile details modified by admin');
      toast.success("Profile updated successfully");
      await fetchData();
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus, reason = '') => {
    try {
      setIsSubmitting(true);
      await updateMember(id, { status: newStatus });
      await logAction(member.organizationId, currentUser, `STATUS_CHANGE_${newStatus.toUpperCase()}`, 'member', id, reason);
      toast.success(`Member status updated to ${newStatus}`);
      await fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddViolation = async (vData) => {
    try {
      setIsSubmitting(true);
      await addViolation(member.organizationId, {
        memberId: member.memberId,
        ...vData,
        adminId: currentUser.uid
      });
      await logAction(member.organizationId, currentUser, 'ADD_VIOLATION', 'member', id, `${vData.severity} violation: ${vData.type}`);
      // await syncMemberStatus(id);
      toast.success("Violation recorded");
      await fetchData();
      setIsViolationModalOpen(false);
    } catch (error) {
      toast.error("Failed to add violation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="p-10 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-20 h-20 border-8 border-brand-50 border-t-brand-600 rounded-full animate-spin mb-6" />
      <p className="text-surface-500 font-bold text-xl tracking-tight">Syncing SaaS Records...</p>
    </div>
  );

  if (!member) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 lg:p-12 max-w-[1400px] mx-auto min-h-screen"
    >
      {/* Action Header */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-6 mb-12">
        <button
          onClick={() => navigate('/admin/members')}
          className="group flex items-center gap-3 text-surface-500 hover:text-brand-600 transition-all font-bold text-lg"
        >
          <div className="p-2 rounded-xl group-hover:bg-brand-50 transition-colors">
            <ArrowLeft size={24} />
          </div>
          Back to Directory
        </button>

        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => {
              exportSingleMemberToPDF(member);
              toast.success("Document generated");
            }}
            className="premium-button-secondary py-3 px-6"
          >
            <Download size={20} /> PDF Export
          </button>

          {member.status === MEMBERSHIP_STATUS.PENDING && (
            <button
              onClick={() => handleStatusChange(MEMBERSHIP_STATUS.ACTIVE, 'Admin manual approval')}
              className="premium-button-primary bg-emerald-600 hover:bg-emerald-700 py-3 px-6"
            >
              <CheckCircle size={20} /> Approve Member
            </button>
          )}

          {member.status === MEMBERSHIP_STATUS.ACTIVE && (
            <button
              onClick={() => handleStatusChange(MEMBERSHIP_STATUS.SUSPENDED, 'Admin manual suspension')}
              className="premium-button-primary bg-amber-600 hover:bg-amber-700 py-3 px-6"
            >
              <ShieldAlert size={20} /> Suspend Member
            </button>
          )}

          {member.status === MEMBERSHIP_STATUS.SUSPENDED && (
            <button
              onClick={() => handleStatusChange(MEMBERSHIP_STATUS.ACTIVE, 'Reactivated by admin')}
              className="premium-button-primary bg-emerald-600 hover:bg-emerald-700 py-3 px-6 shadow-emerald-200/50"
            >
              <History size={20} /> Reactivate Member
            </button>
          )}

          {member.status === MEMBERSHIP_STATUS.PENDING && (
            <button
              onClick={() => handleStatusChange('Rejected', 'Admin manual rejection')}
              className="premium-button-secondary border-rose-200 text-rose-600 hover:bg-rose-50 py-3 px-6"
            >
              <XCircle size={20} /> Reject Member
            </button>
          )}

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="premium-button-primary py-3 px-6"
          >
            <Edit2 size={20} /> Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Profile Sidebar */}
        <div className="xl:col-span-4 space-y-8">
          <div className="premium-card p-8 text-center relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 ${member.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

            <div className="mx-auto mb-6 w-max relative">
              <Avatar src={member.profileImage} name={member.fullName} size="xl" className="border-4 border-white shadow-xl" />
              <div className="absolute bottom-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-50">
                <div className={`w-4 h-4 rounded-full ${member.status === 'Active' ? 'bg-emerald-500 shadow-emerald-200 shadow-lg' : 'bg-slate-300'}`} />
              </div>
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-1 truncate" title={member.fullName}>{member.fullName}</h2>
            <p className="text-slate-400 font-bold text-xs mb-4">{member.memberId}</p>

            <div className="flex flex-col gap-4 text-left border-t border-slate-100 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Profile Completion</span>
                <span className="text-xs font-black text-brand-600">{member.completionPercentage || 0}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500"
                  style={{ width: `${member.completionPercentage || 0}%` }}
                />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Mail size={16} className="text-slate-400" />
                <span className="text-sm font-bold text-slate-700 truncate">{member.email}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Phone size={16} className="text-slate-400" />
                <span className="text-sm font-bold text-slate-700">{member.phone}</span>
              </div>
            </div>
          </div>

          <div className="premium-card p-6">
            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
              <Shield size={18} className="text-brand-600" />
              Intelligence Score
            </h3>
            <div className="space-y-4">
              {(() => {
                const { score, label } = calculateMemberHealth(member, attendance, violations);
                return (
                  <>
                    <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className={`text-5xl font-black mb-1 ${score > 70 ? 'text-emerald-600' : score > 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {score}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${getHealthColor(label)}`}>
                        {label} Health
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Violation Points</span>
                        <span className="text-sm font-black text-slate-900">{member.offenseCount || violations.reduce((sum, v) => sum + (v.points || 0), 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Attendance Rate</span>
                        <span className="text-sm font-black text-emerald-600">
                          {member.attendanceCount || attendance.length > 0
                            ? Math.round(( (member.attendanceCount || attendance.filter(a => a.status === 'Present').length) / (member.attendanceCount ? 30 : attendance.length)) * 100)
                            : 100}%
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="xl:col-span-8 space-y-8">
          <div className="flex border-b border-slate-200 gap-8 overflow-x-auto no-scrollbar">
            {['overview', 'attendance', 'violations', 'audit'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-1 bg-brand-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="premium-card p-8 bg-brand-600 text-white shadow-xl shadow-brand-100">
                    <p className="text-brand-200 text-xs font-black uppercase tracking-widest mb-1">Membership Plan</p>
                    <h4 className="text-4xl font-black mb-6">{member.planName}</h4>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-brand-200 text-[10px] font-black uppercase">Expires On</p>
                        <p className="font-bold">{safeFormatDate(member.expiryDate, 'MMM d, yyyy')}</p>
                      </div>
                      <CreditCard size={32} className="opacity-50" />
                    </div>
                  </div>
                  <div className="premium-card p-8 border-2 border-slate-100 shadow-sm">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Revenue</p>
                    <h4 className="text-4xl font-black text-slate-900 mb-6">{formatCurrency(member.totalPaid || 0)}</h4>
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                      <CheckCircle size={16} /> {member.paymentStatus === 'Paid' ? 'Account Current' : 'Balance Due'}
                    </div>
                  </div>
                </div>

                <div className="premium-card p-8">
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <FileText size={20} className="text-brand-600" /> Administrative Bio
                  </h3>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 font-medium leading-relaxed italic">
                    {member.bio || "No biography provided for this member."}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'attendance' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-900">Attendance History</h3>
                  <button onClick={() => setIsAttendanceModalOpen(true)} className="premium-button-primary py-2 px-4 text-xs">
                    Record Attendance
                  </button>
                </div>
                <div className="grid gap-4">
                  {attendance.map((record, i) => (
                    <div key={i} className="premium-card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{record.status}</p>
                          <p className="text-xs text-slate-500">{record.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {attendance.length === 0 && <div className="text-center py-12 text-slate-400 font-medium">No records found.</div>}
                </div>
              </motion.div>
            )}

            {activeTab === 'violations' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-900">Violations & Offenses</h3>
                  <button onClick={() => setIsViolationModalOpen(true)} className="premium-button-primary bg-rose-600 hover:bg-rose-700 py-2 px-4 text-xs">
                    Add Violation
                  </button>
                </div>
                <div className="grid gap-4">
                  {violations.map((v, i) => (
                    <div key={i} className="premium-card p-5 border-l-4 border-rose-500">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-black text-slate-900">{v.type}</h4>
                          <p className="text-xs text-rose-600 font-black uppercase tracking-widest">{v.severity} Severity • {v.points} Points</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400">{safeFormatDate(v.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium">{v.description}</p>
                    </div>
                  ))}
                  {violations.length === 0 && <div className="text-center py-12 text-slate-400 font-medium">Clear record. No violations.</div>}
                </div>
              </motion.div>
            )}

            {activeTab === 'audit' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <h3 className="text-xl font-black text-slate-900">System Audit Log</h3>
                <div className="space-y-4">
                  {auditLogs.map((log, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-600 shrink-0">
                        <Shield size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 text-sm">{log.actorName}</span>
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{log.action}</span>
                        </div>
                        <p className="text-sm text-slate-600 font-medium mt-1">{log.reason || log.description || 'System event recorded'}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tighter">
                          {safeFormatDate(log.createdAt, 'MMM d, yyyy HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modify Profile">
        <MemberForm initialData={member} onSubmit={handleUpdateMember} onCancel={() => setIsEditModalOpen(false)} isLoading={isSubmitting} />
      </Modal>

      <Modal isOpen={isViolationModalOpen} onClose={() => setIsViolationModalOpen(false)} title="Record Violation">
        <ViolationForm onSubmit={handleAddViolation} onCancel={() => setIsViolationModalOpen(false)} isLoading={isSubmitting} />
      </Modal>

      <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title="Record Attendance">
        <AttendanceForm
          onSubmit={async (data) => {
            try {
              setIsSubmitting(true);
              await recordAttendance(member.organizationId, { memberId: member.memberId, ...data });
              await logAction(member.organizationId, currentUser, 'RECORD_ATTENDANCE', 'member', id, `Marked as ${data.status}`);
              toast.success("Attendance recorded");
              await fetchData();
              setIsAttendanceModalOpen(false);
            } catch (error) { toast.error("Failed to record attendance"); }
            finally { setIsSubmitting(false); }
          }}
          onCancel={() => setIsAttendanceModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </motion.div>
  );
};

const ViolationForm = ({ onSubmit, onCancel, isLoading }) => {
  const [data, setData] = useState({ type: 'Rules Violation', severity: 'Low', description: '' });
  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSubmit(data); }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase mb-2">Offense Type</label>
          <input type="text" className="premium-input" value={data.type} onChange={e => setData({ ...data, type: e.target.value })} required />
        </div>
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase mb-2">Severity</label>
          <select className="premium-input" value={data.severity} onChange={e => setData({ ...data, severity: e.target.value })}>
            <option value="Low">Low (1 pt)</option>
            <option value="Medium">Medium (2 pts)</option>
            <option value="High">High (3 pts)</option>
            <option value="Critical">Critical (Suspension)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-black text-slate-500 uppercase mb-2">Description</label>
        <textarea className="premium-input min-h-[100px]" value={data.description} onChange={e => setData({ ...data, description: e.target.value })} required />
      </div>
      <div className="flex gap-4 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="flex-1 premium-button-secondary py-3">Cancel</button>
        <button type="submit" disabled={isLoading} className="flex-1 premium-button-primary bg-rose-600 hover:bg-rose-700 py-3">
          {isLoading ? 'Processing...' : 'Record Violation'}
        </button>
      </div>
    </form>
  );
};

const AttendanceForm = ({ onSubmit, onCancel, isLoading }) => {
  const [data, setData] = useState({ date: new Date().toISOString().split('T')[0], status: 'Present' });
  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSubmit(data); }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase mb-2">Meeting Date</label>
          <input type="date" className="premium-input" value={data.date} onChange={e => setData({ ...data, date: e.target.value })} required />
        </div>
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase mb-2">Status</label>
          <select className="premium-input" value={data.status} onChange={e => setData({ ...data, status: e.target.value })}>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Excused">Excused</option>
          </select>
        </div>
      </div>
      <div className="flex gap-4 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="flex-1 premium-button-secondary py-3">Cancel</button>
        <button type="submit" disabled={isLoading} className="flex-1 premium-button-primary py-3">
          {isLoading ? 'Processing...' : 'Save Record'}
        </button>
      </div>
    </form>
  );
};

export default MemberDetails;
