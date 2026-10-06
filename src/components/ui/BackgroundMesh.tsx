import { motion } from 'framer-motion';

export const BackgroundMesh = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
    {/* Abstract Glowing Orbs */}
    <motion.div
      animate={{ 
        x: [0, 100, 0],
        y: [0, -50, 0],
        scale: [1, 1.2, 1]
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-30"
      style={{ background: 'radial-gradient(circle, rgba(79, 70, 229, 0.4) 0%, transparent 70%)' }}
    />
    <motion.div
      animate={{ 
        x: [0, -100, 0],
        y: [0, 100, 0],
        scale: [1, 1.5, 1]
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute top-[20%] right-[-10%] w-[35vw] h-[35vw] rounded-full blur-[120px] opacity-20"
      style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)' }}
    />
    <motion.div
      animate={{ 
        x: [0, 50, 0],
        y: [0, 50, 0],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      className="absolute bottom-[-10%] left-[20%] w-[45vw] h-[45vw] rounded-full blur-[100px] opacity-20"
      style={{ background: 'radial-gradient(circle, rgba(0, 240, 255, 0.3) 0%, transparent 70%)' }}
    />
    
    <div className="mesh-grid-overlay" />
  </div>
);
