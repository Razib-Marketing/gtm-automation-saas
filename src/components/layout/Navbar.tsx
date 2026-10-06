// @ts-nocheck
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import './Navbar.css';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="navbar"
    >
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/gtmauto-logo.webp" alt="GTMAuto Logo" style={{ height: '40px', width: 'auto' }} />
        </Link>

        <div className="navbar-links">
          <Link to="/#features">Features</Link>
          <Link to="/#reviews">Testimonials</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/#contact">Contact Us</Link>
        </div>

        <div className="navbar-actions hidden-mobile">
          <SignedOut>
            <Link to="/sign-in" className="navbar-login">Sign In</Link>
            <Link to="/sign-up" className="navbar-cta">Start Free</Link>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard" className="btn-home-link hidden-mobile" style={{ marginRight: '1rem' }}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </div>

        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
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
          >
            <div className="mobile-menu-content">
              <Link to="/#features" onClick={toggleMobileMenu}>Features</Link>
              <Link to="/#reviews" onClick={toggleMobileMenu}>Testimonials</Link>
              <Link to="/pricing" onClick={toggleMobileMenu}>Pricing</Link>
              <Link to="/#contact" onClick={toggleMobileMenu}>Contact Us</Link>
              
              <div className="mobile-auth">
                <SignedOut>
                  <Link to="/sign-in" className="navbar-login" onClick={toggleMobileMenu}>Sign In</Link>
                  <Link to="/sign-up" className="navbar-cta" onClick={toggleMobileMenu}>Start Free</Link>
                </SignedOut>
                <SignedIn>
                  <Link to="/dashboard" className="navbar-cta" onClick={toggleMobileMenu} style={{ width: '100%', textAlign: 'center' }}>Go to Dashboard</Link>
                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                    <UserButton />
                  </div>
                </SignedIn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="navbar-background" />
    </motion.nav>
  );
};
