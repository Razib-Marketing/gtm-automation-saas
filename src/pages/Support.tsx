import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HelpCircle, BookOpen, Code2, Mail, ArrowRight, CreditCard } from 'lucide-react';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { PageTransition } from '../components/ui/PageTransition';
import './Dashboard.css';

export const Support: React.FC = () => {
  return (
    <PageTransition locationKey="support">
      <BackgroundMesh />
      <div className="dashboard-container" style={{ maxWidth: '920px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-header"
        >
          <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <HelpCircle size={28} color="#00F0FF" />
            Support &amp; Documentation Hub
          </h1>
          <p className="dashboard-subtitle">
            Guides for Personal &amp; Organization workspaces, team access sharing, project Trash &amp; monitor controls, GTM recipes, GA4 Observer schedules, and 22-point PDF audits.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1.15rem' }}>
          <div className="module-card" style={{ padding: '1.5rem', cursor: 'default' }}>
            <BookOpen size={24} color="#00F0FF" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ color: 'white', margin: '0 0 0.45rem' }}>Platform Documentation</h3>
            <p style={{ color: '#9CA3AF', fontSize: '0.86rem', lineHeight: 1.55, marginBottom: '1rem' }}>
              Explore full documentation covering Personal &amp; Organization workspaces, Access &amp; Teams, Onboarding, GTM recipes, GA4 Observer rules, and PDF audits.
            </p>
            <Link to="/docs" style={{ color: '#00F0FF', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem' }}>
              Read Documentation <ArrowRight size={15} />
            </Link>
          </div>

          <div className="module-card" style={{ padding: '1.5rem', cursor: 'default' }}>
            <Code2 size={24} color="#A855F7" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ color: 'white', margin: '0 0 0.45rem' }}>API &amp; Schema Reference</h3>
            <p style={{ color: '#9CA3AF', fontSize: '0.86rem', lineHeight: 1.55, marginBottom: '1rem' }}>
              Inspect endpoint contracts for GTM recipe deployment, GA4 Data API anomaly monitors, and workspace audits.
            </p>
            <Link to="/api-reference" style={{ color: '#C084FC', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem' }}>
              View API Reference <ArrowRight size={15} />
            </Link>
          </div>

          <div className="module-card" style={{ padding: '1.5rem', cursor: 'default' }}>
            <CreditCard size={24} color="#10B981" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ color: 'white', margin: '0 0 0.45rem' }}>Billing &amp; Onboarding</h3>
            <p style={{ color: '#9CA3AF', fontSize: '0.86rem', lineHeight: 1.55, marginBottom: '1rem' }}>
              Manage your Polar.sh subscription, check workspace capacity, open the billing portal, or launch guided onboarding for a new project.
            </p>
            <Link to="/billing" style={{ color: '#34D399', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem' }}>
              Go to Billing <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className="module-card" style={{ padding: '1.5rem', marginTop: '1.5rem', cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ color: 'white', margin: '0 0 0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={18} color="#00F0FF" /> Direct Engineering Support
            </h3>
            <p style={{ color: '#9CA3AF', margin: 0, fontSize: '0.88rem' }}>
              Need help connecting a hotel booking engine, cross-domain GA4 setup, or custom GTM recipe?
            </p>
          </div>
          <a
            href="mailto:info@gtmobserver.com"
            className="btn-deploy-bulk"
            style={{ marginTop: 0, textDecoration: 'none' }}
          >
            Email info@gtmobserver.com
          </a>
        </div>
      </div>
    </PageTransition>
  );
};
