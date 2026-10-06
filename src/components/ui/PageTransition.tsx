import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PageTransition = ({ children, locationKey }: { children: React.ReactNode, locationKey: string }) => (
  <AnimatePresence mode="wait">
    <motion.main
      key={locationKey}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="min-h-screen bg-[#0A0A0A] text-white relative z-10"
    >
      {children}
    </motion.main>
  </AnimatePresence>
);
