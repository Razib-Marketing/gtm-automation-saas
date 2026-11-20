// @ts-nocheck
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { FooterSection } from './components/sections/FooterSection';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Observer } from './pages/Observer';
import { Projects } from './pages/Projects';
import { Analytics } from './pages/Analytics';
import { Support } from './pages/Support';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { Documentation } from './pages/Documentation';
import { ApiReference } from './pages/ApiReference';
import { Community } from './pages/Community';
import { Settings } from './pages/Settings';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import Pricing from './pages/Pricing';
import { AnimatePresence } from 'framer-motion';
import { CookieConsent } from './components/ui/CookieConsent';
import { Loader2 } from 'lucide-react';
import './App.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#111', color: '#ff4444', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>React Rendering Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#222', padding: '1rem', borderRadius: '4px' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', marginTop: '1rem', background: '#333', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const RootRoute = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isAppSubdomain = hostname === 'app.gtmobserver.com' || hostname === 'dashboard.gtmobserver.com';

  if (isAppSubdomain) {
    if (!isLoaded) {
      return (
        <div style={{ minHeight: '100vh', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="animate-spin text-cyan-400" size={32} />
        </div>
      );
    }
    if (isSignedIn) {
      return <Navigate to="/dashboard" replace />;
    } else {
      window.location.replace('https://gtmobserver.com');
      return null;
    }
  }

  return <Home />;
};

const AppRoutes = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const id = location.hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }

    if (typeof window !== 'undefined') {
      const currentPath = location.pathname;
      const hostname = window.location.hostname;
      const isApp = hostname === 'app.gtmobserver.com' || hostname === 'dashboard.gtmobserver.com';
      const cleanPath = currentPath === '' ? '/' : currentPath;
      const canonicalHref = isApp 
        ? `https://app.gtmobserver.com${cleanPath}`
        : `https://gtmobserver.com${cleanPath === '/' ? '/' : cleanPath}`;

      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalHref);

      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute('content', canonicalHref);

      const twitterUrl = document.querySelector('meta[name="twitter:url"]');
      if (twitterUrl) twitterUrl.setAttribute('content', canonicalHref);
    }
  }, [location]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RootRoute />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/observer" element={<Observer />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/support" element={<Support />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/pricing" element={<Navigate to="/" replace />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/api-reference" element={<ApiReference />} />
        <Route path="/community" element={<Community />} />
      </Routes>
    </AnimatePresence>
  );
};

const AppLayout = () => {
  const location = useLocation();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isMarketingDomain = hostname === 'gtmobserver.com' || hostname === 'www.gtmobserver.com';

  const innerPaths = ['/dashboard', '/settings', '/projects', '/analytics', '/support', '/observer'];
  const isInnerApp = innerPaths.some(path => location.pathname.startsWith(path));
  const isAuthPage = location.pathname.startsWith('/sign-in') || location.pathname.startsWith('/sign-up');

  // If a user navigates directly to an app route on the marketing domain, redirect to app.gtmobserver.com
  React.useEffect(() => {
    if (isMarketingDomain && isInnerApp) {
      window.location.replace(`https://app.gtmobserver.com${location.pathname}${location.search}${location.hash}`);
    }
  }, [location.pathname, isMarketingDomain, isInnerApp]);

  return (
    <div className="app-wrapper">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {!isInnerApp && !isAuthPage && <Navbar />}
      
      {isInnerApp ? (
        <div className="inner-app-layout">
          <Sidebar />
          <main id="main-content" tabIndex={-1} className="inner-main-content">
            <AppRoutes />
          </main>
        </div>
      ) : (
        <main id="main-content" tabIndex={-1} className="main-content">
          <AppRoutes />
        </main>
      )}

      {!isInnerApp && !isAuthPage && <FooterSection />}
      <CookieConsent />
    </div>
  );
};

const getDashboardUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '/dashboard';
    }
  }
  return 'https://app.gtmobserver.com/dashboard';
};

function App() {
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl={getDashboardUrl()}
      afterSignUpUrl={getDashboardUrl()}
      appearance={{ baseTheme: dark, variables: { colorPrimary: '#00F0FF', colorBackground: '#121212', colorText: 'white' } }}
    >
      <Router>
        <ErrorBoundary>
          <AppLayout />
        </ErrorBoundary>
      </Router>
    </ClerkProvider>
  );
}

export default App;
