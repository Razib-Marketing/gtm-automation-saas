// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import './FAQSection.css';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does GTMObserver automate Google Tag Manager deployments?",
      answer: "GTMObserver connects to your Google account via official OAuth2 REST APIs. Instead of manually creating tags, triggers, variables, and data layers inside Google Tag Manager, our engine compiles and pushes production-grade tracking recipes (WooCommerce e-commerce, Elementor, CF7, booking engines, phone/email clicks) directly into your container workspace in less than five seconds."
    },
    {
      question: "What metrics does GA4 Observer monitor for anomalies?",
      answer: "GA4 Observer continuously monitors key telemetry metrics including live sessions, key events (conversions), purchase revenue, and page views. You can filter by traffic dimensions (All Traffic, Organic Search, Paid Ads, Social, Referral) and set sensitive threshold rules (such as -20% drop or +50% surge) across customizable comparison periods (Yesterday vs 2 Days Ago, Weekly, Last 7 Days, Last 28 Days, or Last 30 Days)."
    },
    {
      question: "How quickly do I get notified when tracking breaks?",
      answer: "GA4 Observer checks your property on an automated hourly cron scheduled at the Cloudflare edge. The moment an anomaly breaches your threshold (for instance, if conversion events suddenly collapse to zero after a site redesign or plugin update), an authenticated alert email with full diagnostic comparisons is dispatched immediately to your team and client recipients."
    },
    {
      question: "Do I need to install any custom tracking scripts on my website?",
      answer: "No! GTMObserver interacts purely with the official Google Tag Manager API and Google Analytics Data API. You do not need to install heavy third-party tracking scripts, npm packages, or server daemons on your website. Everything runs serverless at the Cloudflare edge."
    },
    {
      question: "How does GTMObserver compare to ObservePoint or basic uptime checkers?",
      answer: "Basic uptime checkers only verify that your website returns HTTP 200, which offers zero protection if your checkout tracking, GTM trigger, or form listener crashes. Enterprise suites like ObservePoint cost thousands of dollars per month ($1,000–$5,000/mo) and require lengthy enterprise contracts. GTMObserver provides automated container recipes and edge-native GA4 telemetry monitoring with instantaneous self-service Google OAuth connection."
    },
    {
      question: "Is GTMObserver GDPR, CCPA, and privacy compliant?",
      answer: "Yes. GTMObserver never collects or stores personally identifiable information (PII) from your website visitors. We only access aggregate GA4 event metrics and GTM container configurations via official Google APIs, running encrypted sessions natively on Cloudflare Workers edge architecture."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq-section" id="faq" aria-labelledby="faq-title">
      <div className="faq-container">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="faq-header"
        >
          <div className="section-pill">
            <HelpCircle size={14} />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 id="faq-title" className="section-title">
            Everything You Need to Know <br />
            <span className="title-highlight">About GTM Automation & GA4 Audits</span>
          </h2>
          <p className="section-subtitle">
            Got questions? We've got answers. If you need custom enterprise requirements or agency volume setups, reach out to our team anytime.
          </p>
        </motion.div>

        <div className="faq-accordion" role="region" aria-label="Frequently Asked Questions Accordion">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx} 
                className={`faq-item ${isOpen ? 'open' : ''}`}
              >
                <button 
                  className="faq-question-btn"
                  onClick={() => toggleFAQ(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  id={`faq-btn-${idx}`}
                >
                  <span className="faq-question-text">{faq.question}</span>
                  <ChevronDown className={`faq-chevron ${isOpen ? 'rotated' : ''}`} size={20} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div 
                      id={`faq-answer-${idx}`}
                      role="region"
                      aria-labelledby={`faq-btn-${idx}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="faq-answer-wrapper"
                    >
                      <p className="faq-answer-text">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
