import { useState } from 'react';
import { Settings, Shield, Bell, Database, RefreshCw } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const SettingsPage = () => {
  const { organizationId } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);

  const handlePopulateDatabase = async () => {
    try {
      setIsSeeding(true);
      const toastId = toast.loading('Populating database with demo records...');
      const populateFn = httpsCallable(functions, 'populateDatabase');
      const result = await populateFn({ organizationId: organizationId || 'default' });
      
      toast.success(result.data.message || 'Database seeded successfully', { id: toastId });
      // Reload to refresh cache if needed
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to populate database');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">System Settings</h1>
        <p className="text-slate-500 font-medium">Manage global platform configurations.</p>
      </div>

      <div className="premium-card p-8 bg-white border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <Database className="text-brand-600" size={24} />
            <div>
              <h2 className="text-xl font-black text-slate-800">Development & Data</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Environment: Staging/Demo</p>
            </div>
          </div>
          <button 
            onClick={handlePopulateDatabase}
            disabled={isSeeding}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={isSeeding ? 'animate-spin' : ''} />
            {isSeeding ? 'Seeding...' : 'Populate Database'}
          </button>
        </div>
        <p className="text-slate-600 text-sm font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
          <span className="font-black text-brand-600">Note:</span> This will reset your current organization's demo data. 
          It will create 30 members with various states (Active, Expiring, At Risk, Pending) to test the Membership Rules Engine.
        </p>
      </div>

      <div className="premium-card p-8 bg-white border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
          <Shield className="text-brand-600" size={24} />
          <h2 className="text-xl font-black text-slate-800">Security & Roles</h2>
        </div>
        <p className="text-slate-500 font-medium mb-4">Administrators can assign roles manually via the Firebase Console for security purposes. The default role for new users is "member".</p>
        <button className="premium-button-secondary py-3 px-6" disabled>Advanced Security Settings (Locked)</button>
      </div>

      <div className="premium-card p-8 bg-white border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
          <Bell className="text-amber-500" size={24} />
          <h2 className="text-xl font-black text-slate-800">Notifications</h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
            <span className="font-bold text-slate-700">Email Alerts for New Members</span>
            <input type="checkbox" className="w-5 h-5 accent-brand-600 cursor-pointer" defaultChecked />
          </label>
          <label className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
            <span className="font-bold text-slate-700">Weekly Summary Reports</span>
            <input type="checkbox" className="w-5 h-5 accent-brand-600 cursor-pointer" defaultChecked />
          </label>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
