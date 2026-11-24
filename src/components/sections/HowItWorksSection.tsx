// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CloudLightning, Activity, FolderKanban, CheckCircle2 } from 'lucide-react';
import './HowItWorksSection.css';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      icon: <ShieldCheck size={28} className="step-icon" />,
      title: 'Create Account & Choose Plan',
      description:
        'Create your organization account and select a Pro or Custom package. Your billing plan unlocks unlimited workspace onboarding and autonomous monitoring capacity.',
      bullets: [
        'Instant package activation via Polar checkout',
        'Supports multi-client agency scale (10–100+ projects)',
        'Seamless handoff directly into guided setup'
      ]
    },
    {
      number: '02',
      icon: <CloudLightning size={28} className="step-icon" />,
      title: 'Guided Project Onboarding',
      description:
        'Configure your project in a structured 4-step setup wizard: name the website, authorize Google Analytics 4 and Google Tag Manager via OAuth2, and pick starter monitoring rules.',
      bullets: [
        'OAuth2 scoped GA4 + GTM property binding',
        'Industry perspective selection (Hospitality, E-Commerce, Lead Gen)',
        'Starter GA4 Observer rules attached during setup'
      ]
    },
    {
      number: '03',
      icon: <FolderKanban size={28} className="step-icon" />,
      title: 'Organization Hub & Isolated Projects',
      description:
        'View all projects separately on your Organization Dashboard. Selecting any project enters its dedicated workspace where navigation, telemetry, and audits are strictly scoped.',
      bullets: [
        'Clean separation between Organization & Project views',
        '1-click project switcher back to Organization Overview',
        'Zero cross-client container or property mix-ups'
      ]
    },
    {
      number: '04',
      icon: <Activity size={28} className="step-icon" />,
      title: 'Deploy Recipes, Run Audits & Monitor 24/7',
      description:
        'Inside each project workspace, deploy validated GTM recipes, run GTM or 22-point GA4 audits with PDF export, and receive custom-scheduled anomaly email alerts.',
      bullets: [
        'Custom evaluation time & timezone (Daily, Weekly, Monthly)',
        '22-point GA4 audit + GTM redundancy audit PDF reports',
        'WoW, MoM, YoY comparison windows with device filters'
      ]
    }
  ];

  return (
    <section className="how-it-works-section" id="how-it-works" aria-labelledby="how-it-works-title">
      <div className="how-it-works-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="how-it-works-header"
        >
          <div className="section-pill">
            <CloudLightning size={14} />
            <span>Organization-to-Project Workflow</span>
          </div>
          <h2 id="how-it-works-title" className="section-title">
            From Onboarding to Autonomous Project Monitoring <br />
            <span className="title-highlight">In Four Structured Steps</span>
          </h2>
          <p className="section-subtitle">
            Say goodbye to tangled GTM accounts, manual audits, and unmonitored GA4 conversion drops.
          </p>
        </motion.div>

        <div className="steps-grid">
          {steps.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
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
