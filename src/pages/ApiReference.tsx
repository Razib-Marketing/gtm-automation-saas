// @ts-nocheck
import { motion } from 'framer-motion';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import './Legal.css';

export const ApiReference = () => {
  return (
    <PageTransition locationKey="api">
      <BackgroundMesh />
      <div className="legal-container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="legal-content"
        >
          <h1>API Reference</h1>
          <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2>Overview</h2>
            <p>GTMAuto interfaces directly with the <a href="https://developers.google.com/tag-platform/tag-manager/api/v2" target="_blank" rel="noopener noreferrer">Google Tag Manager API v2</a> to programmatically build container structures.</p>
          </section>

          <section>
            <h2>Endpoints Used</h2>
            <p>During a deployment, the platform utilizes the following core GTM API endpoints on your behalf:</p>
            <ul>
              <li><code>GET /tagmanager/v2/accounts</code> - Retrieves accessible GTM accounts.</li>
              <li><code>GET /tagmanager/v2/accounts/&#123;accountId&#125;/containers</code> - Lists containers for a given account.</li>
              <li><code>GET /tagmanager/v2/accounts/&#123;accountId&#125;/containers/&#123;containerId&#125;/workspaces</code> - Fetches active workspaces.</li>
              <li><code>POST /tagmanager/v2/accounts/&#123;accountId&#125;/containers/&#123;containerId&#125;/workspaces/&#123;workspaceId&#125;/tags</code> - Creates a new tag.</li>
              <li><code>POST /tagmanager/v2/accounts/&#123;accountId&#125;/containers/&#123;containerId&#125;/workspaces/&#123;workspaceId&#125;/triggers</code> - Creates a new trigger.</li>
              <li><code>POST /tagmanager/v2/accounts/&#123;accountId&#125;/containers/&#123;containerId&#125;/workspaces/&#123;workspaceId&#125;/variables</code> - Creates a new variable.</li>
            </ul>
          </section>

          <section>
            <h2>Rate Limiting</h2>
            <p>GTMAuto handles Google's API quota limits by implementing intelligent polling and delay mechanics (2000ms between POST requests) to prevent 429 Too Many Requests errors when deploying large architectures like hotel booking engines.</p>
          </section>
        </motion.div>
      </div>
    </PageTransition>
  );
};
