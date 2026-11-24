// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { Share2, ShieldCheck, Target, FileText, Calendar, ShoppingCart, Zap, Activity } from 'lucide-react';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { Fireflies } from '../components/ui/Fireflies';
import { FeatureCard } from '../components/ui/FeatureCard';
import { ClientsSection } from '../components/sections/ClientsSection';
import { AboutPlatformSection } from '../components/sections/AboutPlatformSection';
import { HowItWorksSection } from '../components/sections/HowItWorksSection';
import { ObserverSection } from '../components/sections/ObserverSection';
import { CompetitorComparisonSection } from '../components/sections/CompetitorComparisonSection';
import { ReviewsSection } from '../components/sections/ReviewsSection';
import { PricingSection } from '../components/sections/PricingSection';
import { FAQSection } from '../components/sections/FAQSection';
import { ContactSection } from '../components/sections/ContactSection';
import { pushDataLayer } from '../utils/analytics';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import './Home.css';

export const Home = () => {
  const { isSignedIn } = useAuth();
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <PageTransition locationKey="home">
      <BackgroundMesh />
      <Fireflies />
      
      <div className="home-container">
        {/* HERO SECTION */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="hero-section"
        >
          <motion.div variants={itemVariants} className="hero-badge">
            <Zap className="hero-badge-icon" />
            <span>Multi-Project GTM Automation, 22-Point GA4 Audits &amp; 24/7 Anomaly Alerts</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="hero-title">
            The Edge-Native <br/>
            <span className="hero-title-highlight">
              Analytics Platform
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="hero-description">
            Manage isolated client projects, deploy validated GTM recipes in one click, run 22-point GA4 &amp; GTM PDF audits, and catch conversion drops 24/7 with custom-scheduled Cloudflare edge monitoring.
          </motion.p>

          <motion.div variants={itemVariants} className="hero-actions">
            {isSignedIn ? (
              <a 
                href="https://app.gtmobserver.com/organization" 
                className="btn-primary" 
                style={{ textDecoration: 'none' }}
                onClick={() => pushDataLayer('cta_click', { cta_text: 'Go to Dashboard', cta_location: 'hero' })}
              >
                Open Organization Dashboard
              </a>
            ) : (
              <Link 
                to="/sign-up" 
                className="btn-primary"
                onClick={() => pushDataLayer('cta_click', { cta_text: 'Get Started for Free', cta_location: 'hero' })}
              >
                Get Started for Free
              </Link>
            )}
            <a 
              href="#features" 
              className="btn-secondary"
              onClick={() => pushDataLayer('cta_click', { cta_text: 'Explore Modules', cta_location: 'hero' })}
            >
              Explore Modules
            </a>
          </motion.div>
        </motion.div>

        {/* CLIENTS MARQUEE (Hidden temporarily) */}
        {/* <ClientsSection /> */}

        {/* FEATURES GRID */}
        <div className="features-section" id="features">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="features-header"
          >
            <h2 className="features-title">Enterprise Tracking Recipes</h2>
            <p className="features-description">One-click deployments for complex data layers and triggers.</p>
          </motion.div>
          
          <div className="features-grid">
            <FeatureCard 
              icon={<Target />}
              title="Basic Event Trackings"
              description="Instantly deploy essential listeners for phone clicks, email clicks, outbound links, and scroll depth."
            />
            <FeatureCard 
              icon={<FileText />}
              title="Automated Form Trackings"
              description="Native listeners for WP Elementor, Gravity Forms, Contact Form 7, and HubSpot."
            />
            <FeatureCard 
              icon={<Calendar />}
              title="Booking Engine Trackings"
              description="Seamlessly capture conversions from embedded Calendly and Acuity scheduling widgets."
            />
            <FeatureCard 
              icon={<ShoppingCart />}
              title="E-Commerce Data Layers"
              description="Generate standard GA4 e-commerce data layers (view_item, add_to_cart, purchase) effortlessly."
            />
            <FeatureCard 
              icon={<Share2 />}
              title="Universal Social Module"
              description="Automatically detects outbound social links and configures GA4 click event listeners dynamically."
            />
            <FeatureCard 
              icon={<Activity />}
              title="Autonomous GA4 Observer"
              description="24/7 background edge monitoring. Detects tracking crashes, conversion dropoffs, and anomalies with instant multi-email alerts."
            />
            <FeatureCard 
              icon={<ShieldCheck />}
              title="Cloudflare Edge Hosted"
              description="Execute API mutations securely at the edge. No central servers, ultimate speed and privacy."
            />
          </div>
        </div>

        {/* ABOUT / WHAT IS GTM OBSERVER & WHAT WE DO */}
        <AboutPlatformSection />

        {/* HOW IT WORKS SECTION */}
        <HowItWorksSection />

        {/* GA4 OBSERVER & ANOMALY ALERTING SECTION */}
        <ObserverSection />

        {/* COMPETITOR COMPARISON SECTION */}
        <CompetitorComparisonSection />

        {/* REVIEWS SECTION (Hidden temporarily) */}
        {/* <ReviewsSection /> */}

        {/* PRICING SECTION */}
        <PricingSection />

        {/* FREQUENTLY ASKED QUESTIONS SECTION */}
        <FAQSection />

        {/* CONTACT SECTION */}
        <ContactSection />
      </div>
    </PageTransition>
  );
};
