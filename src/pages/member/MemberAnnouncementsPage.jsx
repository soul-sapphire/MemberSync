import { useState, useEffect } from 'react';
import { getAnnouncements } from '../../services/announcementService';
import { Bell, Pin } from 'lucide-react';
import toast from 'react-hot-toast';

const MemberAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await getAnnouncements();
        // Sorting: Pinned first, then by date desc (which is default from service)
        const sorted = data.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0;
        });
        setAnnouncements(sorted);
      } catch (error) {
        toast.error('Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  if (loading) return <div className="flex justify-center p-10"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Notice Board</h1>
        <p className="text-slate-500 font-medium">Important updates and announcements from the admin team.</p>
      </div>

      <div className="space-y-6">
        {announcements.map(ann => (
          <div key={ann.id} className={`premium-card p-6 flex items-start gap-6 ${ann.isPinned ? 'border-l-4 border-l-brand-500 bg-brand-50/20' : ''}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${ann.isPinned ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-500'}`}>
              <Bell size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-black text-slate-900">{ann.title}</h3>
                {ann.isPinned && <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-600 bg-brand-100 px-2 py-0.5 rounded border border-brand-200"><Pin size={10} /> Pinned</span>}
              </div>
              <p className="text-slate-600 mb-4 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
              <div className="text-xs font-bold text-slate-400">
                Posted on {ann.createdAt?.toDate().toLocaleDateString() || 'Recently'}
              </div>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="premium-card p-12 text-center text-slate-500">
            <Bell size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-bold text-slate-700">No Announcements</h3>
            <p>You're all caught up. Check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberAnnouncementsPage;
