import { Search, Filter, SortAsc, X } from 'lucide-react';
import { motion } from 'framer-motion';

const MemberFilters = ({ filters, setFilters }) => {
  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const clearSearch = () => setFilters(prev => ({ ...prev, search: '' }));

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center">
      <div className="relative flex-1 w-full group">
        <motion.div
          animate={{ x: filters.search ? 10 : 0 }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors"
        >
          <Search size={20} />
        </motion.div>
        <input
          type="text"
          placeholder="Search by name, email or ID..."
          className="premium-input pl-12 pr-12 w-full"
          value={filters.search}
          onChange={handleSearch}
        />
        {filters.search && (
          <button 
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-100 rounded-full text-surface-400 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
        <div className="relative min-w-[160px] flex-1 lg:flex-none">
          <select
            className="premium-input pl-10 appearance-none cursor-pointer pr-10"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Expired">Expired</option>
            <option value="Suspended">Suspended</option>
            <option value="Rejected">Rejected</option>
          </select>
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" size={18} />
        </div>

        <div className="relative min-w-[160px] flex-1 lg:flex-none">
          <select
            className="premium-input pl-10 appearance-none cursor-pointer pr-10"
            value={filters.plan}
            onChange={(e) => setFilters(prev => ({ ...prev, plan: e.target.value }))}
          >
            <option value="All">All Plans</option>
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
          </select>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-500 pointer-events-none" />
        </div>

        <div className="relative min-w-[160px] flex-1 lg:flex-none">
          <select
            className="premium-input pl-10 appearance-none cursor-pointer pr-10"
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="expiry">Expiry (Soonest)</option>
          </select>
          <SortAsc className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" size={18} />
        </div>
      </div>
    </div>
  );
};

export default MemberFilters;
