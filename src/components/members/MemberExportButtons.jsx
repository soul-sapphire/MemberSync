import { FileDown, FileText, ChevronDown, Table, User } from 'lucide-react';
import Dropdown from '../ui/Dropdown';

const MemberExportButtons = ({ members, onExportAll, onExportFiltered }) => {
  const isDisabled = members.length === 0;

  const exportItems = [
    { 
      label: 'Export All Members', 
      icon: Table, 
      onClick: onExportAll 
    },
    { 
      label: 'Export Filtered List', 
      icon: FileText, 
      onClick: onExportFiltered 
    },
  ];

  return (
    <div className="flex items-center gap-3">
      <Dropdown 
        trigger={
          <button
            disabled={isDisabled}
            className="premium-button-primary"
          >
            <FileDown size={18} />
            <span>Export Reports</span>
            <ChevronDown size={16} className="ml-1 opacity-60" />
          </button>
        }
        items={exportItems}
      />
    </div>
  );
};

export default MemberExportButtons;
