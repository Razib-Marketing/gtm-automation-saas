// @ts-nocheck
import { motion } from 'framer-motion';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import './Legal.css';

export const Documentation = () => {
  return (
    <PageTransition locationKey="docs">
      <BackgroundMesh />
      <div className="legal-container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="legal-content"
        >
          <h1>Documentation</h1>
          <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2>Getting Started</h2>
            <p>Welcome to the GTMAuto documentation. This guide will help you understand how to use our platform to automate your Google Tag Manager deployments.</p>
            <ul>
              <li><strong>Connect GTM:</strong> Navigate to the dashboard and securely authorize GTMAuto to manage your containers.</li>
              <li><strong>Select Modules:</strong> Choose from our library of enterprise tracking recipes, spanning basic clicks to complex e-commerce data layers.</li>
              <li><strong>Deploy:</strong> Click 'Deploy Selected Modules' and watch as your tags, triggers, and variables are built natively via the API.</li>
            </ul>
          </section>

          <section>
            <h2>Supported Tracking Modules</h2>
            <p>GTMAuto currently supports automated deployments for:</p>
            <ul>
              <li>Basic & Outbound Clicks (Phone, Email, Social, OTAs)</li>
              <li>Form Tracking (Elementor, Gravity Forms, HubSpot, Salesforce)</li>
              <li>Hotel Booking Engines (Synxis, iHotelier, StayNTouch, Mews, Windsurfer, Safara)</li>
              <li>Advanced Scroll Depth & Video Engagement</li>
            </ul>
          </section>

          <section>
            <h2>Plans and Limitations</h2>
            <p>Our packaging is structured to scale with your agency or business size:</p>
            <ul>
              <li><strong>Free Plan:</strong> Allows 1 GTM Workspace connection, Basic Full Tracking Access, and up to <strong>5 GTM Workspace Audits</strong>. Perfect for testing.</li>
              <li><strong>Pro Plan ($149/mo):</strong> Manage up to <strong>10 GTM Workspaces</strong> with unlimited module deployments, unlimited audits, and access to all premium modules.</li>
              <li><strong>Custom Plan:</strong> Need more than 10 workspaces? Our dynamic pricing scales up to 100 GTM accounts. <em>Bonus: Receive an automatic <strong>10% volume discount</strong> when selecting 15 or more GTM accounts!</em></li>
            </ul>
          </section>

          <section>
            <h2>Troubleshooting</h2>
            <p>If you encounter the "Already Exists" error during deployment, it means your container already has a Tag, Trigger, or Variable with that exact name. GTMAuto skips these to protect your existing configurations. If you hit an audit limitation, please check your subscription tier on the Settings page.</p>
          </section>
        </motion.div>
      </div>
    </PageTransition>
  );
};
