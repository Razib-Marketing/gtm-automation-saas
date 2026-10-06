import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import './PricingSection.css';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    interval: '/mo',
    description: 'Perfect for testing the waters and single client testing.',
    features: [
      'Deploy Base GA4 Config',
      'Basic Full Tracking Access',
      '1 GTM Account Limit',
      '5 GTM Workspace Audits'
    ],
    buttonText: 'Get Started Free',
    isPopular: false,
  },
  {
    name: 'Pro',
    price: '$149',
    interval: '/mo',
    description: 'For freelancers and small agencies managing multiple client containers.',
    features: [
      'Unlimited Module Deployments',
      'Up to 10 GTM Workspaces',
      'Unlimited GTM Workspace Audits',
      'All Premium Modules'
    ],
    buttonText: 'Upgrade to Pro',
    isPopular: true,
  },
  {
    name: 'Custom',
    price: '$149+',
    interval: '/mo',
    description: 'Scale to any number of clients with our dynamic pricing. Get 10% off for 15+ accounts!',
    features: [
      '10 to 100 GTM Accounts',
      'Unlimited Premium Modules',
      'Unlimited GTM Workspace Audits',
      'Priority Support'
    ],
    buttonText: 'Upgrade / Contact Sales',
    isPopular: false,
  }
];

export const PricingSection = () => {
  return (
    <section className="pricing-section" id="pricing">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="section-header"
      >
        <h2 className="section-title">Simple, Transparent Pricing</h2>
        <p className="section-subtitle">Scale your tracking architecture without worrying about unpredictable server costs.</p>
      </motion.div>

      <div className="pricing-grid">
        {tiers.map((tier, i) => (
          <motion.div 
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1 }}
            className={`pricing-card ${tier.isPopular ? 'popular' : ''}`}
          >
            {tier.isPopular && <div className="popular-badge">Most Popular</div>}
            
            <div className="pricing-header">
              <h3 className="tier-name">{tier.name}</h3>
              <div className="tier-price">
                <span className="price-value">{tier.price}</span>
                {tier.interval && <span className="price-interval">{tier.interval}</span>}
              </div>
              <p className="tier-description">{tier.description}</p>
            </div>

            <div className="pricing-features">
              {tier.features.map((feature, j) => (
                <div key={j} className="feature-item">
                  <Check size={20} className="feature-check" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="pricing-cta">
              {tier.name === 'Enterprise' ? (
                <a href="#contact" className="btn-outline w-full">{tier.buttonText}</a>
              ) : (
                <Link to="/pricing" className={`btn-outline w-full text-center inline-block ${tier.isPopular ? 'btn-primary' : ''}`} style={{ textDecoration: 'none' }}>
                  {tier.buttonText}
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
