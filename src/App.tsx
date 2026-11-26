// @ts-nocheck
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate, useParams, Link } from 'react-router-dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { FooterSection } from './components/sections/FooterSection';
import { WorkspaceProvider, SubscriptionGate, useWorkspace } from './context/WorkspaceContext';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Observer } from './pages/Observer';
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
import { OrganizationDashboard } from './pages/OrganizationDashboard';
import { AccessDashboard } from './pages/AccessDashboard';
import { OrganizationAccessPage } from './pages/OrganizationAccessPage';
import { Billing } from './pages/Billing';
import { ProjectOnboarding } from './pages/ProjectOnboarding';
import { ProjectOverview } from './pages/ProjectOverview';
import { ProjectSettings } from './pages/ProjectSettings';
// import Pricing from './pages/Pricing';
import { AnimatePresence } from 'framer-motion';
import { CookieConsent } from './components/ui/CookieConsent';
import { Loader2, FolderX } from 'lucide-react';
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
      return <Navigate to="/organization" replace />;
    } else {
      window.location.replace('https://gtmobserver.com');
      return null;
    }
  }

  return <Home />;
};

const ProjectScopedView: React.FC<{
  section: 'overview' | 'gtm' | 'observer' | 'analytics' | 'settings';
}> = ({ section }) => {
  const { projectId } = useParams();
  const { getProjectById, loading } = useWorkspace();
  const project = getProjectById(projectId);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="#00F0FF" />
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <FolderX size={44} color="#F87171" />
        <h2 style={{ color: 'white', margin: 0 }}>Project Workspace Not Found</h2>
        <p style={{ color: '#9CA3AF', maxWidth: '420px', margin: 0 }}>
          The requested project either does not exist or belongs to another organization.
        </p>
        <Link to="/organization" className="btn-deploy-bulk" style={{ textDecoration: 'none', marginTop: '0.5rem' }}>
          &larr; Return to Organization Dashboard
        </Link>
      </div>
    );
  }

  if (section === 'overview') return <ProjectOverview project={project} />;
  if (section === 'gtm') return <Dashboard project={project} />;
  if (section === 'observer') return <Observer project={project} />;
  if (section === 'analytics') return <Analytics project={project} />;
  return <ProjectSettings project={project} />;
};

const OrganizationScopedView: React.FC<{
  section: 'dashboard' | 'access';
}> = ({ section }) => {
  const { orgId } = useParams();
  const { getOrganizationById, loading } = useWorkspace();
  const organization = getOrganizationById(orgId);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="#00F0FF" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <FolderX size={44} color="#F87171" />
        <h2 style={{ color: 'white', margin: 0 }}>Organization Not Found</h2>
        <p style={{ color: '#9CA3AF', maxWidth: '420px', margin: 0 }}>
          The requested client organization either does not exist or you do not have access to it.
        </p>
        <Link to="/organization" className="btn-deploy-bulk" style={{ textDecoration: 'none', marginTop: '0.5rem' }}>
          &larr; Return to All Organizations
        </Link>
      </div>
    );
  }

  if (section === 'access') {
    return <OrganizationAccessPage organization={organization} />;
  }
  return <OrganizationDashboard scopedOrg={organization} />;
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

  const isAuthRoute = location.pathname.startsWith('/sign-in') || location.pathname.startsWith('/sign-up');

  const routesElement = (
      <Routes location={location} key={isAuthRoute ? 'auth-routes' : location.pathname}>
        <Route path="/" element={<RootRoute />} />

        {/* Organization Level Routes */}
        <Route
          path="/organization"
          element={
            <SubscriptionGate>
              <OrganizationDashboard />
            </SubscriptionGate>
          }
        />
        <Route
          path="/organizations/:orgId"
          element={
            <SubscriptionGate>
              <OrganizationScopedView section="dashboard" />
            </SubscriptionGate>
          }
        />
        <Route
          path="/organizations/:orgId/access"
          element={
            <SubscriptionGate>
              <OrganizationScopedView section="access" />
            </SubscriptionGate>
          }
        />
        <Route
          path="/access"
          element={
            <SubscriptionGate>
              <AccessDashboard />
            </SubscriptionGate>
          }
        />
        <Route
          path="/billing"
          element={
            <SubscriptionGate allowFree>
              <Billing />
            </SubscriptionGate>
          }
        />
        <Route
          path="/onboarding"
          element={
            <SubscriptionGate>
              <ProjectOnboarding />
            </SubscriptionGate>
          }
        />
        <Route
          path="/settings"
          element={
            <SubscriptionGate allowFree>
              <Settings />
            </SubscriptionGate>
          }
        />
        <Route
          path="/support"
          element={
            <SubscriptionGate allowFree>
              <Support />
            </SubscriptionGate>
          }
        />

        {/* Project Level Routes (Strictly Scoped Workspaces) */}
        <Route path="/projects/:projectId" element={<Navigate to="dashboard" replace />} />
        <Route
          path="/projects/:projectId/dashboard"
          element={
            <SubscriptionGate>
              <ProjectScopedView section="overview" />
            </SubscriptionGate>
          }
        />
        <Route
          path="/projects/:projectId/gtm"
          element={
            <SubscriptionGate>
              <ProjectScopedView section="gtm" />
            </SubscriptionGate>
          }
        />
        <Route
          path="/projects/:projectId/observer"
          element={
            <SubscriptionGate>
              <ProjectScopedView section="observer" />
            </SubscriptionGate>
          }
        />
        <Route
          path="/projects/:projectId/analytics"
          element={
            <SubscriptionGate>
              <ProjectScopedView section="analytics" />
            </SubscriptionGate>
          }
        />
        <Route
          path="/projects/:projectId/settings"
          element={
            <SubscriptionGate>
              <ProjectScopedView section="settings" />
            </SubscriptionGate>
          }
        />

        {/* Legacy App Route Redirects */}
        <Route path="/dashboard" element={<Navigate to="/organization" replace />} />
        <Route path="/projects" element={<Navigate to="/organization" replace />} />
        <Route path="/observer" element={<Navigate to="/organization" replace />} />
        <Route path="/analytics" element={<Navigate to="/organization" replace />} />
        <Route path="/ga4-audit" element={<Navigate to="/organization" replace />} />

        {/* Auth & Public Marketing Pages */}
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/pricing" element={<Navigate to="/" replace />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/api-reference" element={<ApiReference />} />
        <Route path="/community" element={<Community />} />
      </Routes>
  );

  if (isAuthRoute) {
    return routesElement;
  }

  return (
    <AnimatePresence mode="wait">
      {routesElement}
    </AnimatePresence>
  );
};

const AppLayout = () => {
  const location = useLocation();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isMarketingDomain = hostname === 'gtmobserver.com' || hostname === 'www.gtmobserver.com';

  const innerPaths = [
    '/organization',
    '/organizations',
    '/access',
    '/billing',
    '/onboarding',
    '/projects',
    '/dashboard',
    '/settings',
    '/analytics',
    '/support',
    '/observer'
  ];
  const isInnerApp = innerPaths.some(path => location.pathname.startsWith(path));
  const isAuthPage = location.pathname.startsWith('/sign-in') || location.pathname.startsWith('/sign-up');

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
        <WorkspaceProvider>
          <div className="inner-app-layout">
            <Sidebar />
            <main id="main-content" tabIndex={-1} className="inner-main-content">
              <AppRoutes />
            </main>
          </div>
        </WorkspaceProvider>
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

const ClerkProviderWithRoutes = () => {
  const navigate = useNavigate();

  const navigateWithOriginCheck = React.useCallback((to: string, replace = false) => {
    if (/^https?:\/\//i.test(to)) {
      try {
        const target = new URL(to);
        if (target.origin !== window.location.origin) {
          if (replace) {
            window.location.replace(to);
          } else {
            window.location.assign(to);
          }
          return;
        }
        navigate(`${target.pathname}${target.search}${target.hash}`, { replace });
        return;
      } catch (_) {
        window.location.assign(to);
        return;
      }
    }
    navigate(to, { replace });
  }, [navigate]);

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to) => navigateWithOriginCheck(to, false)}
      routerReplace={(to) => navigateWithOriginCheck(to, true)}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/organization"
      signUpFallbackRedirectUrl="/organization"
      allowedRedirectOrigins={[
        'https://gtmobserver.com',
        'https://www.gtmobserver.com',
        'https://app.gtmobserver.com',
        'https://dashboard.gtmobserver.com'
      ]}
      appearance={{ baseTheme: dark, variables: { colorPrimary: '#00F0FF', colorBackground: '#121212', colorText: 'white' } }}
    >
      <ErrorBoundary>
        <AppLayout />
      </ErrorBoundary>
    </ClerkProvider>
  );
};

function App() {
  return (
    <Router>
      <ClerkProviderWithRoutes />
    </Router>
  );
}

export default App;
