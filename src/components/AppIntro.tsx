import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2 } from 'lucide-react';

export function AppIntro({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Only show the intro once per session to avoid annoying the user on refresh
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    
    if (hasSeenIntro) {
      setIsVisible(false);
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('hasSeenIntro', 'true');
      setTimeout(onComplete, 800); // Wait for exit animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible && sessionStorage.getItem('hasSeenIntro')) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
          className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center overflow-hidden"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center justify-center space-y-6"
          >
            <div className="relative">
              <motion.div
                initial={{ rotate: -10, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.7, type: "spring" }}
                className="w-24 h-24 sm:w-32 sm:h-32 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-900/50"
              >
                <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-white" strokeWidth={1.5} />
              </motion.div>
              
              {/* Ripple effect */}
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ delay: 0.4, duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 bg-blue-500 rounded-2xl -z-10"
              />
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-center space-y-2"
            >
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Paflegis
              </h1>
              <p className="text-sm sm:text-lg text-blue-200 font-medium tracking-wide uppercase">
                Transparência Legislativa
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
