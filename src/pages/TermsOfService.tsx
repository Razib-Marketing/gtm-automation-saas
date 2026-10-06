// @ts-nocheck
import { motion } from 'framer-motion';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import './Legal.css';

export const TermsOfService = () => {
  return (
    <PageTransition locationKey="terms">
      <BackgroundMesh />
      <div className="legal-container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="legal-content"
        >
          <h1>Terms of Service</h1>
          <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using GTMAuto ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>GTMAuto provides automation tools for managing Google Tag Manager configurations, including the bulk deployment of tags, triggers, and variables, as well as workspace auditing tools. You understand and agree that the Service is provided "AS-IS" and that GTMAuto assumes no responsibility for the timeliness, deletion, mis-delivery or failure to store any user communications or personalization settings.</p>
          </section>

          <section>
            <h2>3. Google Account Integration</h2>
            <p>To use our core features, you must authenticate with your Google Account and grant GTMAuto access to your Google Tag Manager containers. You retain full responsibility for the configurations deployed to your containers. We strongly recommend testing all deployments in a staging environment before publishing to a live website.</p>
          </section>

          <section>
            <h2>4. User Conduct</h2>
            <p>You agree to not use the Service to:</p>
            <ul>
              <li>Upload, post, email, transmit or otherwise make available any content that is unlawful, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically or otherwise objectionable;</li>
              <li>Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity;</li>
              <li>Interfere with or disrupt the Service or servers or networks connected to the Service.</li>
            </ul>
          </section>

          <section>
            <h2>5. Modifications to Service</h2>
            <p>GTMAuto reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. You agree that GTMAuto shall not be liable to you or to any third party for any modification, suspension or discontinuance of the Service.</p>
          </section>

          <section>
            <h2>6. Limitation of Liability</h2>
            <p>You expressly understand and agree that GTMAuto shall not be liable to you for any direct, indirect, incidental, special, consequential or exemplary damages, including but not limited to, damages for loss of profits, goodwill, use, data or other intangible losses resulting from the use or the inability to use the service.</p>
          </section>

          <section>
            <h2>7. Contact Information</h2>
            <p>If you have any questions regarding these Terms, please contact us at support@gtmauto.io.</p>
          </section>
        </motion.div>
      </div>
    </PageTransition>
  );
};
