import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { pushDataLayer } from '../../utils/analytics';
import './ContactSection.css';

export const ContactSection = () => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formState)
      });
      
      if (res.ok) {
        pushDataLayer('contact_form_submission', {
          form_id: 'contact_form',
          form_name: 'Contact Us Form',
          contact_name: formState.name,
          contact_email: formState.email
        });
        setIsSuccess(true);
        setErrorMessage('');
        setFormState({ name: '', email: '', message: '' });
        setTimeout(() => setIsSuccess(false), 6000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        const msg = (typeof errorData.error === 'string' ? errorData.error : errorData.error?.message) || errorData.message || "Failed to send message. Please try again later.";
        setErrorMessage(msg);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while sending your message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="contact-info"
        >
          <h2 className="section-title text-left">Get in Touch</h2>
          <p className="contact-description">
            Have questions about enterprise deployment or custom tracking modules? Our engineering team is here to help.
          </p>
          
          <div className="contact-methods">
            <div className="contact-method">
              <div className="method-icon"><Mail size={24} /></div>
              <div>
                <h4>Contact Direct</h4>
                <p><a href="mailto:contact@gtmobserver.com" style={{ color: '#00F0FF', textDecoration: 'none' }}>contact@gtmobserver.com</a></p>
              </div>
            </div>
            <div className="contact-method">
              <div className="method-icon"><MessageSquare size={24} /></div>
              <div>
                <h4>General Inquiries</h4>
                <p><a href="mailto:info@gtmobserver.com" style={{ color: '#E2E8F0', textDecoration: 'none' }}>info@gtmobserver.com</a></p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="contact-form-wrapper"
        >
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                placeholder="John Doe" 
                required
                value={formState.name}
                onChange={e => setFormState({...formState, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Work Email</label>
              <input 
                type="email" 
                id="email" 
                placeholder="john@company.com" 
                required
                value={formState.email}
                onChange={e => setFormState({...formState, email: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">How can we help?</label>
              <textarea 
                id="message" 
                rows={4} 
                placeholder="Tell us about your tracking architecture needs..." 
                required
                value={formState.message}
                onChange={e => setFormState({...formState, message: e.target.value})}
              ></textarea>
            </div>
            
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : isSuccess ? 'Message Sent!' : (
                <>Send Message <Send size={18} /></>
              )}
            </button>

            {isSuccess && (
              <div style={{ background: 'rgba(0, 240, 255, 0.1)', border: '1px solid #00F0FF', borderRadius: '8px', padding: '12px 16px', color: '#00F0FF', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', fontSize: '0.9rem' }}>
                <CheckCircle size={18} /> Thank you! Your message has been sent successfully. Our team will get back to you shortly.
              </div>
            )}
            {errorMessage && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', padding: '12px 16px', color: '#F87171', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', fontSize: '0.9rem' }}>
                <AlertCircle size={18} /> {errorMessage}
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  );
};
