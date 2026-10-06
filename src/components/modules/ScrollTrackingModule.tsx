import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Code2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import './SocialTrackingModule.css'; // Reusing the same CSS for consistency

interface ScrollTrackingModuleProps {
  workspacePath: string;
}

export const ScrollTrackingModule = ({ workspacePath }: ScrollTrackingModuleProps) => {
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
          moduleId: 'scroll_depth',
          containerPath: workspacePath,
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
        <div className="module-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <ScrollText className="module-icon text-green-400" color="#10B981" />
        </div>
        <div className="module-title-wrap">
          <h3>Advanced Scroll Depth</h3>
          <p>Auto-configure GA4 scroll events to fire at 25%, 50%, 75%, and 90% page depth.</p>
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
