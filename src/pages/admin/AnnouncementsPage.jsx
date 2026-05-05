import { useState, useEffect } from 'react';
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../services/announcementService';
import { Bell, Plus, Edit2, Trash2, Pin, Clock, AlertCircle, Megaphone, Info } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { safeFormatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const AnnouncementsPage = () => {
  const { organizationId } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target: 'All Members',
    isPinned: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnnouncements(organizationId);
      // Sort in memory to avoid index requirements during development
      const sortedData = data.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      setAnnouncements(sortedData);
    } catch (err) {
      console.error("Error loading announcements:", err);
      if (err.code === 'failed-precondition' && err.message.includes('index')) {
        setError('INDEX_REQUIRED');
      } else {
        toast.error('Failed to load announcements');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchData();
    }
  }, [organizationId]);

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        content: item.content,
        target: item.target,
        isPinned: item.isPinned || false
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', content: '', target: 'All Members', isPinned: false });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await updateAnnouncement(editingItem.id, formData);
        toast.success('Announcement updated');
      } else {
        await addAnnouncement(formData, organizationId);
        toast.success('Announcement posted');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await deleteAnnouncement(id);
        toast.success('Announcement deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete announcement');
      }
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Announcements</h1>
          <p className="text-slate-500 font-medium">Broadcast updates to your members.</p>
        </div>
        <button onClick={() => openModal()} className="premium-button-primary flex items-center gap-2">
          <Plus size={20} /> Post Update
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {error === 'INDEX_REQUIRED' ? (
          <div className="premium-card p-12 text-center border-dashed border-2 border-amber-200 bg-amber-50/30">
            <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-900 mb-2">Index Required</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Firestore index required. Create the index from the Firebase console link shown in the browser console, then refresh.
            </p>
          </div>
        ) : announcements.length > 0 ? (
          announcements.map(ann => (
            <div key={ann.id} className={`premium-card p-6 flex flex-col sm:flex-row gap-6 items-start ${ann.isPinned ? 'border-l-4 border-l-brand-500 bg-brand-50/30' : ''}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${ann.isPinned ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-500'}`}>
                <Bell size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-black text-slate-900">{ann.title}</h3>
                  {ann.isPinned && <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-600 bg-brand-100 px-2 py-0.5 rounded border border-brand-200"><Pin size={10} /> Pinned</span>}
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{ann.target || 'All Members'}</span>
                </div>
                <p className="text-slate-600 mb-4 whitespace-pre-wrap">{ann.content || ann.message}</p>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={12} />
                  Posted: {safeFormatDate(ann.createdAt, 'MMM d, yyyy')}
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                <button onClick={() => openModal(ann)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
                  <Edit2 size={16} /> Edit
                </button>
                <button onClick={() => handleDelete(ann.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-500 font-medium">No announcements posted yet.</div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Announcement" : "Post Announcement"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="premium-input" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Content</label>
            <textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="premium-input h-32" required></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Target Audience</label>
            <select value={formData.target} onChange={(e) => setFormData({...formData, target: e.target.value})} className="premium-input">
              <option value="All Members">All Members</option>
              <option value="Active Members">Active Members Only</option>
              <option value="Pending Members">Pending Members Only</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.isPinned} onChange={(e) => setFormData({...formData, isPinned: e.target.checked})} className="w-5 h-5 accent-brand-600" />
              <span className="font-bold text-slate-700">Pin to top</span>
            </label>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="premium-button-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="premium-button-primary">
              {saving ? 'Saving...' : 'Post Announcement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AnnouncementsPage;
