import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { calculateProfileCompletion, validateMemberData } from '../../rules/profileRules';
import { safeFormatDate } from '../../utils/formatters';

const MemberForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    planName: 'Basic',
    status: 'Pending',
    joinDate: safeFormatDate(initialData?.joinDate || new Date(), 'yyyy-MM-dd'),
    expiryDate: safeFormatDate(initialData?.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
    totalPaid: 0,
    paymentStatus: 'Unpaid',
    notes: '',
    profileImage: '',
    bio: '',
    skills: '',
    interests: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    ...initialData,
    // Overwrite with formatted dates if they exist in initialData
    ...(initialData?.joinDate ? { joinDate: safeFormatDate(initialData.joinDate, 'yyyy-MM-dd') } : {}),
    ...(initialData?.expiryDate ? { expiryDate: safeFormatDate(initialData.expiryDate, 'yyyy-MM-dd') } : {}),
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalPaid' ? Number(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate using rules
    const validation = validateMemberData(formData);
    if (!validation.isValid) {
      validation.errors.forEach(err => toast.error(err));
      return;
    }

    // Calculate completion
    const completion = calculateProfileCompletion(formData);
    
    const finalData = {
      ...formData,
      profileComplete: completion.isComplete,
      completionPercentage: completion.percentage,
      memberId: formData.memberId || `MEM-${Math.floor(1000 + Math.random() * 9000)}`
    };
    
    onSubmit(finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[80vh]">
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8 pb-8">
        {/* Personal Information */}
        <section className="space-y-4">
          <h3 className="text-sm font-black text-brand-600 uppercase tracking-widest border-b border-slate-100 pb-2">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Full Name *</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="premium-input py-2" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email Address *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="premium-input py-2" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Phone Number *</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="premium-input py-2" placeholder="+1 234 567 8900" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Join Date *</label>
              <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} required className="premium-input py-2" />
            </div>
          </div>
        </section>

        {/* Membership & Billing */}
        <section className="space-y-4">
          <h3 className="text-sm font-black text-brand-600 uppercase tracking-widest border-b border-slate-100 pb-2">Membership & Billing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Plan *</label>
              <select name="planName" value={formData.planName} onChange={handleChange} className="premium-input py-2">
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Payment Status</label>
              <select name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} className="premium-input py-2">
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Expiry Date *</label>
              <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required className="premium-input py-2" />
            </div>
          </div>
        </section>

        {/* Additional Info */}
        <section className="space-y-4">
          <h3 className="text-sm font-black text-brand-600 uppercase tracking-widest border-b border-slate-100 pb-2">Extended Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className="premium-input py-2" placeholder="123 Main St, City" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Emergency Contact</label>
                <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className="premium-input py-2" placeholder="Name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Emergency Phone</label>
                <input type="text" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className="premium-input py-2" placeholder="Phone" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Bio</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} className="premium-input py-2 min-h-[60px]" placeholder="Tell us about the member..."></textarea>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky Footer */}
      <div className="flex gap-4 pt-6 border-t border-slate-100 bg-white">
        <button type="button" onClick={onCancel} className="flex-1 premium-button-secondary py-3">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="flex-1 premium-button-primary py-3">
          {isLoading ? 'Saving...' : (initialData ? 'Update Member' : 'Create Member')}
        </button>
      </div>
    </form>
  );
};

export default MemberForm;
