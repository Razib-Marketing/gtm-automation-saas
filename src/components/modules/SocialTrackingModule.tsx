// @ts-nocheck
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Code2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import './SocialTrackingModule.css';

interface SocialTrackingModuleProps {
  workspacePath: string; // e.g. accounts/123/containers/456/workspaces/789
}

export const SocialTrackingModule = ({ workspacePath }: SocialTrackingModuleProps) => {
  const [measurementId, setMeasurementId] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { getToken } = useAuth();

  const handleDeploy = async () => {
    if (!measurementId || !measurementId.startsWith('G-')) {
      alert("Please enter a valid GA4 Measurement ID starting with G-");
      return;
    }

    setDeploying(true);
    setStatus('idle');

    try {
      const token = await getToken();
      
      const res = await fetch('/api/gtm/deploy', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          moduleId: 'social_media',
          containerPath: workspacePath, // using the full workspacePath
          measurementId: measurementId
        })
      });

      if (res.ok) {
        setStatus('success');
      } else {
        const errorData = await res.json();
        console.error("Deploy failed:", errorData.error);
        setStatus('error');
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="module-card"
    >
      <div className="module-header">
        <div className="module-icon-wrap">
          <Share2 className="module-icon text-blue-400" />
        </div>
        <div className="module-title-wrap">
          <h3>Universal Social Tracking</h3>
          <p>Auto-configure GA4 click events for Facebook, LinkedIn, Twitter, and Instagram outbound links.</p>
        </div>
      </div>

      <div className="module-config">
        <label className="module-label">
          GA4 Measurement ID
          <div className="input-wrapper">
            <Code2 className="input-icon" />
            <input 
              type="text" 
              placeholder="G-XXXXXXXXXX" 
              value={measurementId}
              onChange={(e) => setMeasurementId(e.target.value)}
              className="module-input"
            />
          </div>
        </label>
      </div>

      <div className="module-actions">
        <button 
          onClick={handleDeploy} 
          disabled={deploying || !workspacePath}
          className={`btn-deploy ${deploying ? 'deploying' : ''}`}
        >
          {deploying ? 'Deploying to GTM...' : 'Deploy Module'}
        </button>

        {status === 'success' && (
          <span className="status-msg success">
            <Check className="w-4 h-4" /> Deployed successfully
          </span>
        )}
        {status === 'error' && (
          <span className="status-msg error">
            <AlertCircle className="w-4 h-4" /> Deployment failed
          </span>
        )}
      </div>
    </motion.div>
  );
};
