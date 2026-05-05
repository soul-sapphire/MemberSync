import { motion } from 'framer-motion';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full premium-card p-12 text-center shadow-2xl"
      >
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <ShieldAlert size={40} />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Access Denied</h1>
        <p className="text-slate-500 font-medium mb-10">
          You do not have the required permissions to access this administrative area.
        </p>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 w-full premium-button-secondary py-3.5 font-bold"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
          
          <Link 
            to="/"
            className="flex items-center justify-center gap-2 w-full premium-button-primary py-3.5 font-bold"
          >
            <Home size={18} /> Return Home
          </Link>
        </div>

        <p className="mt-8 text-[10px] text-slate-400 font-black uppercase tracking-widest">
          Error Code: 403_FORBIDDEN_ROLE
        </p>
      </motion.div>
    </div>
  );
};

export default AccessDenied;
