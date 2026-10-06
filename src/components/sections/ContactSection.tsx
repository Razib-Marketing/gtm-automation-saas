import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare, Mail, MapPin } from 'lucide-react';
import './ContactSection.css';

export const ContactSection = () => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formState)
      });
      
      if (res.ok) {
        setIsSuccess(true);
        setFormState({ name: '', email: '', message: '' });
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        const errorData = await res.json();
        const errorMessage = errorData.error?.message || "Failed to send message. Please try again later.";
        alert(`Error: ${errorMessage}`);
      }
    } catch (err) {
      alert("An error occurred while sending your message.");
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
                <h4>Email Us</h4>
                <p>ovi.cse23@gmail.com</p>
              </div>
            </div>
            <div className="contact-method">
              <div className="method-icon"><MessageSquare size={24} /></div>
              <div>
                <h4>Live Chat</h4>
                <p>Available 9am - 5pm EST</p>
              </div>
            </div>
            <div className="contact-method">
              <div className="method-icon"><MapPin size={24} /></div>
              <div>
                <h4>Headquarters</h4>
                <p>100 Edge Server Lane, Cloud City</p>
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
          </form>
        </motion.div>
      </div>
    </section>
  );
};
