import { motion } from 'framer-motion';
import { MoreHorizontal, Eye, Download, Trash2, ShieldCheck, Database } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { calculateMemberHealth, getHealthColor } from '../../utils/healthScore';
import { getStatusColor, safeFormatDate } from '../../utils/formatters';

const MemberTable = ({ members, onViewDetails, onDelete, onExportSingle }) => {

  return (
    <div className="w-full overflow-x-auto pb-4">
      <table className="w-full text-left border-separate border-spacing-y-4 px-2 min-w-[800px]">
        <thead>
          <tr className="text-surface-400 text-xs font-black uppercase tracking-widest">
            <th className="px-8 pb-2">Profile</th>
            <th className="px-6 pb-2">Account Status</th>
            <th className="px-6 pb-2 text-center">Health</th>
            <th className="px-6 pb-2 text-center">Tier</th>
            <th className="px-6 pb-2">Next Billing</th>
            <th className="px-8 pb-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => (
            <motion.tr
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="premium-card group cursor-pointer hover:bg-white transition-all"
              onClick={() => onViewDetails(member)}
            >
              <td className="px-8 py-5 rounded-l-[2rem]">
                <div className="flex items-center gap-4 max-w-[300px]">
                  <Avatar src={member.profileImage} name={member.fullName} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-surface-900 text-base truncate" title={member.fullName}>{member.fullName}</div>
                    <div className="text-xs text-surface-400 font-medium truncate" title={member.email}>{member.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                  <span className={`badge ${getStatusColor(member.status)} whitespace-nowrap`}>
                    {member.status}
                  </span>
                  {member.isDemo && (
                    <Database size={12} className="text-brand-300" title="Demo Data" />
                  )}
                </div>
              </td>
              <td className="px-6 py-5 text-center">
                {(() => {
                  // Simplified health for table
                  const score = member.status === 'Active' && member.paymentStatus === 'Paid' ? 100 : 
                                member.status === 'Active' ? 70 : 
                                member.status === 'Suspended' ? 30 : 10;
                  const label = score > 70 ? 'Excellent' : score > 40 ? 'At Risk' : 'Critical';
                  return (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${getHealthColor(label)}`}>
                      <ShieldCheck size={12} />
                      {score}%
                    </div>
                  );
                })()}
              </td>
              <td className="px-6 py-5 text-center">
                <span className="text-sm font-bold text-surface-700 bg-surface-100/50 px-3 py-1 rounded-lg border border-surface-200/50 whitespace-nowrap">
                  {member.planName}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="text-sm font-bold text-surface-700 whitespace-nowrap">
                  {safeFormatDate(member.expiryDate, 'MMM d, yyyy')}
                </div>
                <div className="text-[10px] text-surface-400 font-bold uppercase whitespace-nowrap">
                  {member.paymentStatus === 'Paid' ? 'Renewed' : 'Pending Payment'}
                </div>
              </td>
              <td className="px-8 py-5 rounded-r-[2rem] text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button 
                    onClick={() => onExportSingle(member)}
                    className="p-2.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                    title="Export Profile"
                  >
                    <Download size={20} />
                  </button>
                  <button 
                    onClick={() => onViewDetails(member)}
                    className="p-2.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                    title="View Full Profile"
                  >
                    <Eye size={20} />
                  </button>
                  <button 
                    onClick={() => onDelete(member)}
                    className="p-2.5 text-surface-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Remove Member"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MemberTable;
