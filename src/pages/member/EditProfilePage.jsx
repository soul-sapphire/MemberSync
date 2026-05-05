import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMemberByUid, updateMember } from '../../services/memberService';
import { uploadMemberProfilePhoto } from '../../services/profilePhotoService';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';
import { Upload, Camera } from 'lucide-react';

const EditProfilePage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memberId, setMemberId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    bio: '',
    skills: '',
    interests: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    profilePhoto: '',
    profileImage: '',
    photoURL: '',
  });

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const member = await getMemberByUid(currentUser.uid);
        if (member) {
          setMemberId(member.id);
          setFormData({
            fullName: member.fullName || '',
            phone: member.phone || '',
            address: member.address || '',
            dateOfBirth: member.dateOfBirth || '',
            gender: member.gender || '',
            bio: member.bio || '',
            skills: member.skills || '',
            interests: member.interests || '',
            emergencyContactName: member.emergencyContactName || '',
            emergencyContactPhone: member.emergencyContactPhone || '',
            profilePhoto: member.profilePhoto || '',
            profileImage: member.profileImage || '',
            photoURL: member.photoURL || '',
          });
          setPreviewUrl(member.profilePhoto || member.photoURL || member.profileImage);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchMember();
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("EditProfile: Image selected:", file);
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let finalPhotoURL = formData.profilePhoto || formData.photoURL || formData.profileImage;
      
      if (imageFile) {
        console.log("EditProfile: Uploading image for UID:", currentUser.uid);
        const toastId = toast.loading('Uploading image...', { id: 'upload' });
        finalPhotoURL = await uploadMemberProfilePhoto(currentUser.uid, imageFile);
        console.log("EditProfile: Upload result URL:", finalPhotoURL);
        toast.success('Image uploaded', { id: 'upload' });
      }

      const updateData = {
        ...formData,
        profilePhoto: finalPhotoURL,
        photoURL: finalPhotoURL,
        profileImage: finalPhotoURL
      };

      await updateMember(memberId, updateData);
      
      setFormData(updateData);
      setPreviewUrl(finalPhotoURL);
      setImageFile(null);
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error("EditProfile: Save error:", error);
      toast.error('Failed to update profile');
      toast.dismiss('upload');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const currentPhoto = previewUrl || formData.profilePhoto || formData.photoURL || formData.profileImage || currentUser?.photoURL || "";

  return (
    <div className="max-w-4xl mx-auto premium-card p-8 bg-white">
      <div className="mb-8 border-b border-slate-100 pb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Edit My Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
          <div className="relative group">
            <Avatar src={currentPhoto} name={formData.fullName} size="xl" className="border-4 border-slate-100" />
            <label className="absolute bottom-0 right-0 p-3 bg-brand-600 text-white rounded-full cursor-pointer hover:bg-brand-700 hover:scale-110 transition-all shadow-lg">
              <Camera size={20} />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Profile Picture</h3>
            <p className="text-sm text-slate-500 mb-4">Upload a high quality image. JPG or PNG.</p>
            {imageFile && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">New Image Selected</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name *</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="premium-input" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number *</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="premium-input" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Date of Birth</label>
            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="premium-input" />
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
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">Residential Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="premium-input" />
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
                <input type="text" name="skills" value={formData.skills} onChange={handleChange} className="premium-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Interests</label>
                <input type="text" name="interests" value={formData.interests} onChange={handleChange} className="premium-input" />
              </div>
            </div>
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

        <div className="pt-6">
          <button type="submit" disabled={saving} className="w-full md:w-auto premium-button-primary px-10 py-4 text-lg">
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfilePage;
