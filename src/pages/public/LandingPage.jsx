import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const LandingPage = () => {
  return (
    <div className="text-center max-w-3xl">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight"
      >
        Manage your community with <span className="text-brand-600">MemberSync</span>
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-xl text-slate-500 mb-10"
      >
        A premium SaaS platform to manage memberships, reports, and community engagement securely and efficiently.
      </motion.p>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-4"
      >
        <Link to="/login" className="premium-button-primary px-8 py-4 text-lg">
          Sign In
        </Link>
        <Link to="/register" className="premium-button-secondary px-8 py-4 text-lg bg-white">
          Create Account
        </Link>
      </motion.div>
    </div>
  );
};
export default LandingPage;
