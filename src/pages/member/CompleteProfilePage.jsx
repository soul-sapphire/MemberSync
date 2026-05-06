import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMemberByUid, addMember, updateMember } from '../../services/memberService';
import toast from 'react-hot-toast';

const CompleteProfilePage = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState(null);

  useEffect(() => {
    // ADMIN GUARD: Do not force admins to complete member profiles
    if (userRole === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [userRole, navigate]);

  const [formData, setFormData] = useState({
    fullName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    planName: 'Basic',
    bio: '',
    skills: '',
    interests: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    profileImage: currentUser?.photoURL || '',
  });

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const member = await getMemberByUid(currentUser.uid);
        if (member) {
          setExistingId(member.id);
          setFormData(prev => ({ ...prev, ...member }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) checkExisting();
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    console.log("Current user:", currentUser);

    try {
      const payload = {
        ...formData,
        uid: currentUser.uid,
        status: 'Pending',
        joinDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        totalPaid: 0,
        paymentStatus: 'Unpaid',
      };

      if (!existingId) {
        payload.memberId = `MEM-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      if (existingId) {
        await updateMember(existingId, payload);
      } else {
        await addMember("default", {
          ...payload,
          uid: currentUser.uid
        });
      }

      toast.success('Profile completed successfully!');
      navigate('/member/dashboard');
    } catch (error) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-4xl mx-auto premium-card p-8 bg-white">
      <div className="mb-8 border-b border-slate-100 pb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Complete Your Profile</h1>
        <p className="text-slate-500 font-medium">Please fill in your details to activate your membership.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name *</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="premium-input" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address *</label>
            <input type="email" name="email" value={formData.email} disabled className="premium-input bg-slate-50 text-slate-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number *</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="premium-input" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Date of Birth</label>
            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="premium-input" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">Residential Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="premium-input" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="premium-input">
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Membership Plan Request</label>
            <select name="planName" value={formData.planName} onChange={handleChange} className="premium-input">
              <option value="Basic">Basic</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8">
          <h3 className="font-black text-lg text-slate-800 mb-6">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Contact Name</label>
              <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className="premium-input" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Contact Phone</label>
              <input type="text" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className="premium-input" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8">
          <h3 className="font-black text-lg text-slate-800 mb-6">Additional Info</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Short Bio</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} className="premium-input min-h-[100px]"></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Skills</label>
                <input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g. Design, Coding" className="premium-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Interests</label>
                <input type="text" name="interests" value={formData.interests} onChange={handleChange} placeholder="e.g. Hiking, Reading" className="premium-input" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <button type="submit" disabled={saving} className="w-full md:w-auto premium-button-primary px-10 py-4 text-lg">
            {saving ? 'Saving...' : 'Complete Registration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompleteProfilePage;
