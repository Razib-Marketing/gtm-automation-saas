import { useState } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { pushDataLayer } from '../../utils/analytics';
import './FooterSection.css';

export const FooterSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (res.ok) {
        pushDataLayer('newsletter_submission', {
          form_id: 'footer_newsletter',
          form_name: 'Footer Newsletter Form',
          newsletter_email: email
        });
        setIsSuccess(true);
        setErrorMessage('');
        setEmail('');
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setErrorMessage(errorData.error?.message || 'Subscription failed. Please try again.');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Network error');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="footer-section" role="contentinfo" aria-label="Site Footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <img src="/gtmobserver-logo.webp" alt="GTMObserver - Edge-Native GTM Automation & GA4 Telemetry Platform" style={{ height: '48px', width: 'auto' }} />
            </div>
            <p className="footer-description">
              The Edge-Native Analytics Platform. Deploy validated Google Tag Manager tracking architectures in seconds and monitor GA4 telemetry 24/7 with zero latency.
            </p>
          </div>
          
          <div className="footer-links">
            <h4>Platform</h4>
            <ul>
              <li><Link to="/#features">Features</Link></li>
              <li><Link to="/#how-it-works">How It Works</Link></li>
              <li><Link to="/#observer">GA4 Observer</Link></li>
              <li><Link to="/#comparison">Why Us</Link></li>
              <li><a href="https://app.gtmobserver.com/dashboard">Dashboard</a></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Resources & AI</h4>
            <ul>
              <li><Link to="/#faq">FAQ</Link></li>
              <li><Link to="/docs">Documentation</Link></li>
              <li><Link to="/api-reference">API Reference</Link></li>
              <li><Link to="/community">Community</Link></li>
              <li><a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">Sitemap (XML)</a></li>
              <li><a href="/llms.txt" target="_blank" rel="noopener noreferrer">LLMs.txt (GEO)</a></li>
            </ul>
          </div>

          <div className="footer-newsletter">
            <h4>Stay Updated</h4>
            <p>Get the latest tracking recipes, GA4 anomaly alerts, and platform updates.</p>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit} aria-label="Newsletter Subscription Form">
              <div className="newsletter-input-group">
                <Mail size={18} className="newsletter-icon" aria-hidden="true" />
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  required 
                  aria-label="Email address for tracking recipes newsletter"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isSuccess}
                />
                <button 
                  type="submit" 
                  className="newsletter-submit" 
                  disabled={isSubmitting || isSuccess}
                  aria-label="Submit newsletter subscription"
                >
                  {isSuccess ? <Check size={18} color="#00F0FF" /> : <ArrowRight size={18} />}
                </button>
              </div>
            </form>
            {isSuccess && <p style={{ color: '#00F0FF', fontSize: '0.875rem', marginTop: '0.5rem' }}>Subscribed successfully!</p>}
            {errorMessage && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errorMessage}</p>}
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} GTMObserver. All rights reserved. Edge-Native Analytics Intelligence.</p>
          <div className="footer-legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
