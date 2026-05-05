import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserCheck, Clock, AlertCircle, Plus, Database } from 'lucide-react';
import toast from 'react-hot-toast';

import { getMembers, deleteMember, addMember } from '../../services/memberService';
import { populateDatabase } from '../../services/databaseService';
import { exportMembersToPDF, exportSingleMemberToPDF } from '../../services/pdfExportService';
import { useAuth } from '../../context/AuthContext';

import MemberTable from '../../components/members/MemberTable';
import MemberCard from '../../components/members/MemberCard';
import MemberFilters from '../../components/members/MemberFilters';
import MemberExportButtons from '../../components/members/MemberExportButtons';
import MemberForm from '../../components/members/MemberForm';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Modal from '../../components/ui/Modal';

const MembersPage = () => {
  const { organizationId } = useAuth();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPopulating, setIsPopulating] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'All',
    plan: 'All',
    sortBy: 'newest'
  });

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, member: null });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFirestoreError = (error) => {
    console.error("Firestore Error:", error);
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      toast.error("Firestore index required. Please create the index using the Firebase console link shown in the browser console.", {
        duration: 6000,
        id: 'index-error' // Prevent spamming
      });
    } else {
      toast.error(`Error: ${error.message}`);
    }
  };

  const fetchMembers = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const data = await getMembers(organizationId, filters);
      setMembers(data);
      setFilteredMembers(data);
    } catch (error) {
      handleFirestoreError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [filters, organizationId]);

  const handleDelete = async () => {
    if (!deleteModal.member) return;
    try {
      await deleteMember(deleteModal.member.id);
      toast.success("Member deleted successfully");
      fetchMembers();
    } catch (error) {
      toast.error("Failed to delete member");
    }
  };

  const handleAddMember = async (data) => {
    try {
      setIsSubmitting(true);
      await addMember(organizationId, data);
      toast.success("Member created successfully");
      setIsAddModalOpen(false);
      fetchMembers();
    } catch (error) {
      toast.error("Failed to create member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePopulateData = async () => {
    if (isPopulating) return;
    try {
      setIsPopulating(true);
      const orgId = organizationId || "default";
      await toast.promise(populateDatabase(orgId), {
        loading: 'Populating database with demo data...',
        success: 'Database populated successfully!',
        error: (err) => `Population failed: ${err.message}`,
      });
      await fetchMembers();
    } catch (error) {
      console.error("Population error:", error);
    } finally {
      setIsPopulating(false);
    }
  };

  const stats = [
    { label: 'Total Base', value: members.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+12.5%' },
    { label: 'Active Now', value: members.filter(m => m.status === 'Active').length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+5.2%' },
    { label: 'Pending Appr', value: members.filter(m => m.status === 'Pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', trend: '-2.1%' },
    { label: 'Restricted', value: members.filter(m => ['Expired', 'Suspended', 'Rejected'].includes(m.status)).length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', trend: '0%' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 lg:p-12 max-w-[1600px] mx-auto min-h-screen"
    >
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-12">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-surface-900 tracking-tight xl:text-5xl">
            Members <span className="text-brand-600">Overview</span>
          </h1>
          <p className="text-surface-500 text-lg font-medium">
            Manage your community and export detailed analytics reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handlePopulateData}
            disabled={isPopulating}
            className="premium-button-secondary border-dashed border-brand-200 text-brand-600 hover:bg-brand-50/50 flex items-center gap-2"
          >
            <Database size={18} />
            {isPopulating ? "Populating..." : "Populate Database"}
          </button>

          <MemberExportButtons
            members={members}
            onExportAll={() => {
              exportMembersToPDF(members, "Complete System Audit");
              toast.success("System audit report generated");
            }}
            onExportFiltered={() => {
              exportMembersToPDF(filteredMembers, "Filtered Dataset Export");
              toast.success("Custom dataset report generated");
            }}
          />
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1, type: 'spring', stiffness: 100 }}
            className="premium-card p-8 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={80} />
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
                <stat.icon size={28} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.trend}
              </span>
            </div>

            <div>
              <p className="text-sm font-bold text-surface-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black text-surface-900 tabular-nums">
                {stat.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Data Management Section */}
      <div className="space-y-8">
        <div className="glass shadow-premium rounded-[2.5rem] p-6 lg:p-8">
          <MemberFilters filters={filters} setFilters={setFilters} />
        </div>

        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-6"
              >
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-surface-100/50 animate-pulse rounded-[2rem] w-full border border-surface-200/50" />
                ))}
              </motion.div>
            ) : filteredMembers.length > 0 ? (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* Desktop View */}
                <div className="hidden lg:block bg-white/40 rounded-[2.5rem] p-2">
                  <MemberTable
                    members={filteredMembers}
                    onViewDetails={(m) => window.location.href = `/admin/members/${m.id}`}
                    onDelete={(m) => setDeleteModal({ isOpen: true, member: m })}
                    onExportSingle={async (m) => {
                      const toastId = toast.loading(`Generating profile for ${m.fullName}...`);
                      await exportSingleMemberToPDF(m);
                      toast.success(`Profile for ${m.fullName} exported`, { id: toastId });
                    }}
                  />
                </div>
                {/* Mobile View */}
                <div className="lg:hidden grid gap-6">
                  {filteredMembers.map(m => (
                    <MemberCard
                      key={m.id}
                      member={m}
                      onViewDetails={(m) => window.location.href = `/admin/members/${m.id}`}
                      onDelete={(m) => setDeleteModal({ isOpen: true, member: m })}
                      onExportSingle={async (m) => {
                        const toastId = toast.loading(`Generating profile for ${m.fullName}...`);
                        await exportSingleMemberToPDF(m);
                        toast.success(`Profile for ${m.fullName} exported`, { id: toastId });
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="premium-card p-24 flex flex-col items-center justify-center text-center max-w-2xl mx-auto"
              >
                <div className="w-24 h-24 bg-brand-50 rounded-[2rem] flex items-center justify-center text-brand-300 mb-8 shadow-inner rotate-3">
                  <Users size={48} />
                </div>
                <h3 className="text-3xl font-black text-surface-900 mb-4">No members found</h3>
                <p className="text-surface-500 text-lg mb-10 leading-relaxed font-medium">
                  No members match your current filters. You can add a member manually or populate demo data for development.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="premium-button-primary px-10 py-4 text-lg"
                  >
                    Add New Member
                  </button>
                  <button
                    onClick={handlePopulateData}
                    disabled={isPopulating}
                    className="premium-button-secondary border-dashed border-brand-200 text-brand-600 hover:bg-brand-50/50 flex items-center gap-3 px-10 py-4 text-lg"
                  >
                    <Database size={22} />
                    {isPopulating ? "Populating..." : "Populate Database"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, member: null })}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message={`Are you absolutely sure you want to remove ${deleteModal.member?.fullName}? This will permanently delete their records.`}
        confirmText="Confirm Delete"
      />

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-10 right-10 lg:bottom-16 lg:right-16 w-20 h-20 bg-brand-600 text-white rounded-[2rem] shadow-2xl shadow-brand-500/40 flex items-center justify-center z-50 border-4 border-white"
      >
        <Plus size={40} />
      </motion.button>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Member" maxWidth="max-w-4xl">
        <MemberForm onSubmit={handleAddMember} onCancel={() => setIsAddModalOpen(false)} isLoading={isSubmitting} />
      </Modal>
    </motion.div>
  );
};

export default MembersPage;
