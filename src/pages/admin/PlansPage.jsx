import { useState, useEffect } from 'react';
import { getPlans, addPlan, updatePlan, deletePlan } from '../../services/planService';
import { Package, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { normalizeList, formatCurrency } from '../../utils/formatters';

const PlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    durationMonths: '12',
    benefits: '',
    isActive: true
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await getPlans();
      setPlans(data);
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name || '',
        price: plan.price || '',
        durationMonths: plan.durationMonths || '12',
        benefits: Array.isArray(plan.features || plan.benefits) 
          ? (plan.features || plan.benefits).join(', ') 
          : (plan.features || plan.benefits || ''),
        isActive: plan.isActive !== false
      });
    } else {
      setEditingPlan(null);
      setFormData({ name: '', price: '', durationMonths: '12', benefits: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        durationMonths: Number(formData.durationMonths),
        features: normalizeList(formData.benefits)
      };

      if (editingPlan) {
        await updatePlan(editingPlan.id, payload);
        toast.success('Plan updated');
      } else {
        await addPlan(payload);
        toast.success('Plan added');
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (error) {
      toast.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this plan?")) {
      try {
        await deletePlan(id);
        toast.success('Plan deleted');
        fetchPlans();
      } catch (error) {
        toast.error('Failed to delete plan');
      }
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Membership Plans</h1>
          <p className="text-slate-500 font-medium">Manage subscription tiers and pricing for your members.</p>
        </div>
        <button onClick={() => openModal()} className="premium-button-primary flex items-center gap-2">
          <Plus size={20} /> Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map(plan => (
          <div key={plan.id} className={`premium-card p-8 flex flex-col justify-between border-t-8 ${plan.isActive !== false ? 'border-t-brand-500 shadow-brand-100/20' : 'border-t-slate-300 opacity-75'}`}>
            <div className="relative">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-[1.25rem] flex items-center justify-center shadow-inner">
                  <Package size={28} />
                </div>
                {plan.isActive === false ? (
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Inactive</span>
                ) : (
                  <span className="bg-brand-50 text-brand-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Live</span>
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
              <p className="text-4xl font-black text-slate-900 mb-6">
                {formatCurrency(plan.price)}
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">/ {plan.durationMonths || 1} mo</span>
              </p>
              
              <div className="mb-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Core Benefits</p>
                <ul className="space-y-3">
                  {normalizeList(plan.features || plan.benefits).map((b, i) => (
                    <li key={i} className="flex items-start gap-3 group">
                      <div className="mt-1">
                        <CheckCircle2 size={16} className="text-brand-500" />
                      </div>
                      <span className="text-sm text-slate-600 font-bold group-hover:text-slate-900 transition-colors">{b}</span>
                    </li>
                  ))}
                  {normalizeList(plan.features || plan.benefits).length === 0 && (
                    <li className="text-sm text-slate-400 font-medium italic">No features listed</li>
                  )}
                </ul>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-100 pt-6">
              <button onClick={() => openModal(plan)} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                <Edit2 size={16} /> Edit
              </button>
              <button onClick={() => handleDelete(plan.id)} className="flex-1 flex items-center justify-center gap-2 bg-rose-50 text-rose-700 hover:bg-rose-100 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="col-span-full premium-card p-20 text-center flex flex-col items-center justify-center border-dashed">
            <Package size={60} className="text-slate-200 mb-6" />
            <h3 className="text-xl font-black text-slate-400">No Membership Plans</h3>
            <p className="text-slate-400 mt-2">Create your first subscription tier to get started.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPlan ? "Edit Plan" : "Add Plan"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Plan Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="premium-input" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Price ($)</label>
              <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="premium-input" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Duration (Months)</label>
              <input type="number" value={formData.durationMonths} onChange={(e) => setFormData({...formData, durationMonths: e.target.value})} className="premium-input" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Benefits (comma separated)</label>
            <textarea value={formData.benefits} onChange={(e) => setFormData({...formData, benefits: e.target.value})} className="premium-input h-24" placeholder="24/7 Access, Personal Trainer, Spa..."></textarea>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 accent-brand-600" />
              <span className="font-bold text-slate-700">Plan is Active</span>
            </label>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="premium-button-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="premium-button-primary">
              {saving ? 'Saving...' : 'Save Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlansPage;
