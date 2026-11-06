// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CloudLightning, Activity, ArrowRight, CheckCircle2 } from 'lucide-react';
import './HowItWorksSection.css';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: "01",
      icon: <ShieldCheck size={28} className="step-icon" />,
      title: "Connect Google Tag Manager & GA4",
      description: "Authorize via secure Google OAuth2 in 10 seconds. We query your accounts and containers via official Google REST APIs with zero third-party proxies.",
      bullets: ["OAuth2 scoped read/write access", "Multi-account GTM selector", "No custom scripts required on-site"]
    },
    {
      number: "02",
      icon: <CloudLightning size={28} className="step-icon" />,
      title: "Deploy Validated Container Recipes",
      description: "Select from our library of verified tracking modules (e-commerce, Elementor, CF7, booking engines, phone/email clicks) and inject them straight into your workspace.",
      bullets: ["Pre-built GA4 trigger architectures", "Schema-validated dataLayers", "Zero syntax errors or GTM debugging"]
    },
    {
      number: "03",
      icon: <Activity size={28} className="step-icon" />,
      title: "Autonomous GA4 Edge Telemetry",
      description: "Set your metric thresholds and comparison windows. Cloudflare Workers run automated hourly cron audits, dispatching alerts immediately if tracking breaks.",
      bullets: ["Hourly baseline comparisons", "Multi-recipient client email alerts", "Compound AND / OR rules engine"]
    }
  ];

  return (
    <section className="how-it-works-section" id="how-it-works" aria-labelledby="how-it-works-title">
      <div className="how-it-works-container">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="how-it-works-header"
        >
          <div className="section-pill">
            <CloudLightning size={14} />
            <span>Fast & Autonomous Workflow</span>
          </div>
          <h2 id="how-it-works-title" className="section-title">
            From Container Deployment to 24/7 Monitoring <br />
            <span className="title-highlight">In Three Frictionless Steps</span>
          </h2>
          <p className="section-subtitle">
            Say goodbye to hours of manual GTM tag creation, failed preview sessions, and broken conversion analytics.
          </p>
        </motion.div>

        <div className="steps-grid">
          {steps.map((step, idx) => (
            <motion.div 
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="step-card"
            >
              <div className="step-card-top">
                <span className="step-number">{step.number}</span>
                <div className="step-icon-box">{step.icon}</div>
              </div>
              
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
              
              <ul className="step-bullets">
                {step.bullets.map((b, i) => (
                  <li key={i}>
                    <CheckCircle2 size={15} className="bullet-check" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
