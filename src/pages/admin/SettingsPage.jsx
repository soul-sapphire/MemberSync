import { Settings, Shield, Bell } from 'lucide-react';

const SettingsPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">System Settings</h1>
        <p className="text-slate-500 font-medium">Manage global platform configurations.</p>
      </div>

      <div className="premium-card p-8 bg-white">
        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
          <Shield className="text-brand-600" size={24} />
          <h2 className="text-xl font-black text-slate-800">Security & Roles</h2>
        </div>
        <p className="text-slate-500 font-medium mb-4">Administrators can assign roles manually via the Firebase Console for security purposes. The default role for new users is "member".</p>
        <button className="premium-button-secondary" disabled>Advanced Security Settings (Locked)</button>
      </div>

      <div className="premium-card p-8 bg-white">
        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
          <Bell className="text-amber-500" size={24} />
          <h2 className="text-xl font-black text-slate-800">Notifications</h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
            <span className="font-bold text-slate-700">Email Alerts for New Members</span>
            <input type="checkbox" className="w-5 h-5 accent-brand-600" defaultChecked />
          </label>
          <label className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
            <span className="font-bold text-slate-700">Weekly Summary Reports</span>
            <input type="checkbox" className="w-5 h-5 accent-brand-600" defaultChecked />
          </label>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
