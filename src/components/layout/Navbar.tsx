// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { isLocalhost } from '../../utils/localDemoStore';
import './Navbar.css';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const location = useLocation();
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu when route or hash changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Close on Escape key and restore focus to trigger
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMobileMenuOpen]);

  const orgHref = isLocalhost() ? '/organization' : 'https://app.gtmobserver.com/organization';
  const isPricing = location.pathname === '/pricing';
  const isDocs = location.pathname === '/docs';

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
        <Link
          to="/"
          className="navbar-logo"
          style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
          aria-label="GTMObserver Homepage"
        >
          <img
            src="/gtmobserver-logo.webp"
            alt="GTMObserver - Edge-Native GTM Automation and GA4 Telemetry Platform"
            style={{ height: '38px', width: 'auto' }}
          />
        </Link>

        <div className="navbar-links">
          <Link to="/#about">About</Link>
          <Link to="/#features">Features</Link>
          <Link to="/#how-it-works">How It Works</Link>
          <Link to="/#observer">GA4 Observer</Link>
          <Link to="/#comparison">Why Us</Link>
          <Link to="/pricing" aria-current={isPricing ? 'page' : undefined}>Pricing</Link>
          <Link to="/docs" aria-current={isDocs ? 'page' : undefined}>Docs</Link>
          <Link to="/#faq">FAQ</Link>
          <Link to="/#contact">Contact</Link>
        </div>

        <div className="navbar-actions hidden-mobile">
          {isSignedIn ? (
            <>
              <a
                href={orgHref}
                className="btn-home-link hidden-mobile"
                style={{ textDecoration: 'none' }}
              >
                <LayoutDashboard size={16} aria-hidden="true" /> Dashboard
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
          ref={menuBtnRef}
          type="button"
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-site-menu"
        >
          {isMobileMenuOpen ? (
            <X size={24} color="white" aria-hidden="true" />
          ) : (
            <Menu size={24} color="white" aria-hidden="true" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <div
              className="mobile-menu-backdrop"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
            <motion.div
              id="mobile-site-menu"
              className="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              role="region"
              aria-label="Mobile Navigation Menu"
            >
              <div className="mobile-menu-content">
                <Link to="/#about" onClick={closeMobileMenu}>About</Link>
                <Link to="/#features" onClick={closeMobileMenu}>Features</Link>
                <Link to="/#how-it-works" onClick={closeMobileMenu}>How It Works</Link>
                <Link to="/#observer" onClick={closeMobileMenu}>GA4 Observer</Link>
                <Link to="/#comparison" onClick={closeMobileMenu}>Why Us</Link>
                <Link to="/pricing" aria-current={isPricing ? 'page' : undefined} onClick={closeMobileMenu}>Pricing</Link>
                <Link to="/docs" aria-current={isDocs ? 'page' : undefined} onClick={closeMobileMenu}>Documentation</Link>
                <Link to="/#faq" onClick={closeMobileMenu}>FAQ</Link>
                <Link to="/#contact" onClick={closeMobileMenu}>Contact</Link>

                <div className="mobile-auth">
                  {isSignedIn ? (
                    <>
                      <a
                        href={orgHref}
                        className="navbar-cta"
                        onClick={closeMobileMenu}
                        style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}
                      >
                        Go to Organization
                      </a>
                      <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                        <UserButton />
                      </div>
                    </>
                  ) : (
                    <>
                      <Link to="/sign-in" className="navbar-login" onClick={closeMobileMenu}>
                        Sign In
                      </Link>
                      <Link to="/sign-up" className="navbar-cta" onClick={closeMobileMenu}>
                        Start Free
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <div className="navbar-background" />
    </motion.nav>
  );
};
