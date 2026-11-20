// @ts-nocheck
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import './Navbar.css';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="navbar"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center' }} aria-label="GTMObserver Homepage">
          <img src="/gtmobserver-logo.webp" alt="GTMObserver - Edge-Native GTM Automation and GA4 Telemetry Platform" style={{ height: '42px', width: 'auto' }} />
        </Link>

        <div className="navbar-links">
          <Link to="/#features">Features</Link>
          <Link to="/#how-it-works">How It Works</Link>
          <Link to="/#observer">GA4 Observer</Link>
          <Link to="/#comparison">Why Us</Link>
          <Link to="/#faq">FAQ</Link>
          <Link to="/#contact">Contact</Link>
        </div>

        <div className="navbar-actions hidden-mobile">
          {isSignedIn ? (
            <>
              <a href="https://app.gtmobserver.com/dashboard" className="btn-home-link hidden-mobile" style={{ marginRight: '1rem', textDecoration: 'none' }}>
                <LayoutDashboard size={16} /> Dashboard
              </a>
              <UserButton />
            </>
          ) : (
            <>
              <Link to="/sign-in" className="navbar-login">Sign In</Link>
              <Link to="/sign-up" className="navbar-cta">Start Free</Link>
            </>
          )}
        </div>

        <button 
          className="mobile-menu-btn" 
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={24} color="white" /> : <Menu size={24} color="white" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            role="dialog"
            aria-label="Mobile Navigation Menu"
          >
            <div className="mobile-menu-content">
              <Link to="/#features" onClick={toggleMobileMenu}>Features</Link>
              <Link to="/#how-it-works" onClick={toggleMobileMenu}>How It Works</Link>
              <Link to="/#observer" onClick={toggleMobileMenu}>GA4 Observer</Link>
              <Link to="/#comparison" onClick={toggleMobileMenu}>Why Us</Link>
              <Link to="/#faq" onClick={toggleMobileMenu}>FAQ</Link>
              <Link to="/#contact" onClick={toggleMobileMenu}>Contact</Link>
              
              <div className="mobile-auth">
                {isSignedIn ? (
                  <>
                    <a href="https://app.gtmobserver.com/dashboard" className="navbar-cta" onClick={toggleMobileMenu} style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}>Go to Dashboard</a>
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                      <UserButton />
                    </div>
                  </>
                ) : (
                  <>
                    <Link to="/sign-in" className="navbar-login" onClick={toggleMobileMenu}>Sign In</Link>
                    <Link to="/sign-up" className="navbar-cta" onClick={toggleMobileMenu}>Start Free</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="navbar-background" />
    </motion.nav>
  );
};
