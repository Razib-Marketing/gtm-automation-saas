import { useState } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import './FooterSection.css';

export const FooterSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (res.ok) {
        setIsSuccess(true);
        setEmail('');
        setTimeout(() => setIsSuccess(false), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="footer-section">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <img src="/gtmauto-logo.webp" alt="GTMAuto Logo" style={{ height: '48px', width: 'auto' }} />
            </div>
            <p className="footer-description">
              The Edge-Native Analytics Platform. Deploy advanced tracking architectures across your domains in seconds with zero latency.
            </p>
          </div>
          
          <div className="footer-links">
            <h4>Platform</h4>
            <ul>
              <li><Link to="/#features">Features</Link></li>
              <li><Link to="/#pricing">Pricing</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Resources</h4>
            <ul>
              <li><Link to="/docs">Documentation</Link></li>
              <li><Link to="/api-reference">API Reference</Link></li>
              <li><Link to="/community">Community</Link></li>
            </ul>
          </div>

          <div className="footer-newsletter">
            <h4>Stay Updated</h4>
            <p>Get the latest tracking recipes and platform updates.</p>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <div className="newsletter-input-group">
                <Mail size={18} className="newsletter-icon" />
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isSuccess}
                />
                <button type="submit" className="newsletter-submit" disabled={isSubmitting || isSuccess}>
                  {isSuccess ? <Check size={18} color="#00F0FF" /> : <ArrowRight size={18} />}
                </button>
              </div>
            </form>
            {isSuccess && <p style={{ color: '#00F0FF', fontSize: '0.875rem', marginTop: '0.5rem' }}>Subscribed successfully!</p>}
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} All rights reserved by GTMAuto.</p>
          <div className="footer-legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
