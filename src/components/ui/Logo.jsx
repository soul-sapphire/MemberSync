import { motion } from 'framer-motion';

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <motion.div 
        whileHover={{ rotate: 10, scale: 1.05 }}
        className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-500/40 border border-brand-500"
      >
        M
      </motion.div>
      <span className="font-bold text-surface-900 tracking-tight text-lg">Member<span className="text-brand-600">Sync</span></span>
    </div>
  );
};

export default Logo;
