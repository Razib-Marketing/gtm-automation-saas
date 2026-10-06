// @ts-nocheck
import { motion } from 'framer-motion';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import './Legal.css';

export const Community = () => {
  return (
    <PageTransition locationKey="community">
      <BackgroundMesh />
      <div className="legal-container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="legal-content"
        >
          <h1>Community</h1>
          
          <section style={{ marginTop: '2rem' }}>
            <h2 style={{ borderBottom: 'none' }}>Join the GTMAuto Developer Community</h2>
            <p style={{ fontSize: '1.1rem', color: '#9CA3AF' }}>Connect with other tracking specialists, share your custom recipes, and get help from our engineering team.</p>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
              <a href="#" className="btn-primary" style={{ textDecoration: 'none' }}>Join Discord</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ textDecoration: 'none' }}>GitHub Discussions</a>
            </div>
          </section>

          <section style={{ marginTop: '4rem' }}>
            <h2>Contribute a Recipe</h2>
            <p>Have a custom tracking module for an obscure booking engine or SaaS platform? The GTMAuto community thrives on shared knowledge.</p>
            <p>If you have an exported JSON container that you'd like to convert into a GTMAuto module, please email our integration team at <a href="mailto:hello@gtmauto.io">hello@gtmauto.io</a> and we'll add it to the platform directory!</p>
          </section>
        </motion.div>
      </div>
    </PageTransition>
  );
};
