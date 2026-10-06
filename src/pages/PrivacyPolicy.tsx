// @ts-nocheck
import { motion } from 'framer-motion';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import './Legal.css';

export const PrivacyPolicy = () => {
  return (
    <PageTransition locationKey="privacy">
      <BackgroundMesh />
      <div className="legal-container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="legal-content"
        >
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2>1. Introduction</h2>
            <p>Welcome to GTMAuto. We respect your privacy and are committed to protecting your personal data. This Privacy Policy will inform you as to how we look after your personal data when you visit our website and use our Google Tag Manager automation services.</p>
          </section>

          <section>
            <h2>2. The Data We Collect</h2>
            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
            <ul>
              <li><strong>Identity Data:</strong> First name, last name, username or similar identifier.</li>
              <li><strong>Contact Data:</strong> Email address.</li>
              <li><strong>Technical Data:</strong> Internet protocol (IP) address, your login data, browser type and version, time zone setting and location, and other technology on the devices you use to access this website.</li>
              <li><strong>Google API Data:</strong> Our application accesses your Google Tag Manager data via Google's APIs. This includes container structures, tags, triggers, and variables. We do <strong>NOT</strong> collect end-user tracking data (e.g., your website visitors' data).</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Data and Google User Data</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul>
              <li>To provide our Tag Manager deployment automation services to you.</li>
              <li>To manage your account and provide customer support.</li>
            </ul>
            <h3>Google API Services User Data Policy</h3>
            <p>GTMAuto's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
            <p>Specifically, we require the <code>https://www.googleapis.com/auth/tagmanager.edit.containers</code> scope to programmatically create, edit, and publish tags, triggers, and variables inside your designated Google Tag Manager containers. We do not sell this data, and we do not use this data for serving advertisements.</p>
          </section>

          <section>
            <h2>4. Data Security</h2>
            <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. Your Google OAuth tokens are securely encrypted and stored, and are only utilized when you actively initiate a deployment or audit.</p>
          </section>

          <section>
            <h2>5. Your Legal Rights</h2>
            <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.</p>
          </section>

          <section>
            <h2>6. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at support@gtmauto.io.</p>
          </section>
        </motion.div>
      </div>
    </PageTransition>
  );
};
