import React from 'react';
import { motion } from 'framer-motion';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { HelpCircle } from 'lucide-react';
import { PageTransition } from '../components/ui/PageTransition';
import '../pages/Dashboard.css';

export const Support: React.FC = () => {
  return (
    <PageTransition locationKey="support">
      <BackgroundMesh />
      <div className="dashboard-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="oauth-card"
          style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem' }}
        >
          <HelpCircle className="oauth-icon text-blue-400" style={{ margin: '0 auto 1.5rem', width: '48px', height: '48px' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Support & Documentation</h2>
          <p style={{ color: '#9CA3AF' }}>Access FAQs, open support tickets, and view documentation. Coming soon.</p>
        </motion.div>
      </div>
    </PageTransition>
  );
};
