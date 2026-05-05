import { motion } from 'framer-motion';
import { Download, Eye, Trash2, Mail, Phone, Database } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { getStatusColor, safeFormatDate } from '../../utils/formatters';

const MemberCard = ({ member, onViewDetails, onDelete, onExportSingle }) => {

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="premium-card p-6 flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={member.profilePhoto || member.photoURL || member.profileImage} name={member.fullName} size="lg" />
          <div>
            <h3 className="font-bold text-surface-900 text-lg leading-tight truncate" title={member.fullName}>{member.fullName}</h3>
            <p className="text-xs text-surface-400 font-bold uppercase tracking-wider mt-0.5">{member.memberId || 'NO ID'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`badge ${getStatusColor(member.status)}`}>
            {member.status}
          </span>
          {member.isDemo && (
            <div className="flex items-center gap-1 text-[10px] text-brand-300 font-black uppercase tracking-widest">
              <Database size={10} /> Demo
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center gap-3 text-surface-600 bg-surface-50/50 p-3 rounded-xl border border-surface-100/50">
          <Mail size={16} className="text-brand-400" />
          <span className="text-sm font-medium truncate">{member.email}</span>
        </div>
        <div className="flex items-center gap-3 text-surface-600 bg-surface-50/50 p-3 rounded-xl border border-surface-100/50">
          <Phone size={16} className="text-brand-400" />
          <span className="text-sm font-medium">{member.phone || 'N/A'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-100/50">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-surface-400 font-black mb-1">Current Tier</p>
          <p className="text-sm font-bold text-surface-700">{member.planName}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-surface-400 font-black mb-1">Expiry Date</p>
          <p className="text-sm font-bold text-surface-700">{safeFormatDate(member.expiryDate, 'MMM d, yyyy')}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={() => onViewDetails(member)}
          className="flex-1 premium-button-primary py-3 text-sm"
        >
          View Profile
        </button>
        <button
          onClick={async (e) => {
            e.stopPropagation();
            await onExportSingle(member);
          }}
          className="p-3 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-2xl transition-all border border-surface-200/50"
        >
          <Download size={20} />
        </button>
        <button
          onClick={() => onDelete(member)}
          className="p-3 text-surface-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-surface-200/50"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </motion.div>
  );
};

export default MemberCard;
