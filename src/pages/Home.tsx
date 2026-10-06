// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { Share2, ShieldCheck, Target, FileText, Calendar, ShoppingCart, Zap } from 'lucide-react';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { Fireflies } from '../components/ui/Fireflies';
import { FeatureCard } from '../components/ui/FeatureCard';
import { ClientsSection } from '../components/sections/ClientsSection';
import { ReviewsSection } from '../components/sections/ReviewsSection';
import { PricingSection } from '../components/sections/PricingSection';
import { ContactSection } from '../components/sections/ContactSection';
import { Link } from 'react-router-dom';
import { SignUpButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import './Home.css';

export const Home = () => {
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
            <span>Automate Google Tag Manager Instantly</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="hero-title">
            The Edge-Native <br/>
            <span className="hero-title-highlight">
              Analytics Platform
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="hero-description">
            Deploy advanced tracking architectures across your domains in seconds. Built natively on Cloudflare for zero-latency execution.
          </motion.p>

          <motion.div variants={itemVariants} className="hero-actions">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="btn-primary">Get Started for Free</button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
            </SignedIn>
            <a href="#features" className="btn-secondary">
              Explore Modules
            </a>
          </motion.div>
        </motion.div>

        {/* CLIENTS MARQUEE */}
        <ClientsSection />

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
              icon={<ShieldCheck />}
              title="Cloudflare Edge Hosted"
              description="Execute API mutations securely at the edge. No central servers, ultimate speed and privacy."
            />
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <ReviewsSection />

        {/* PRICING SECTION */}
        <PricingSection />

        {/* CONTACT SECTION */}
        <ContactSection />
      </div>
    </PageTransition>
  );
};
