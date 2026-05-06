import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }) => {
  
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`w-full ${maxWidth} bg-white rounded-[2.5rem] shadow-2xl relative my-auto overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
              <button 
                onClick={onClose}
                className="p-3 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-2xl transition-all hover:scale-110 active:scale-95"
                aria-label="Close modal"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="payment-modal-content custom-scrollbar p-8">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
