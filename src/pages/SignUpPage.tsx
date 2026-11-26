import { useState, useEffect } from 'react';
import { SignUp, ClerkLoaded, ClerkLoading, useAuth, useSession } from '@clerk/clerk-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { X, Loader2, AlertCircle, User, Building2 } from 'lucide-react';
import '../components/layout/Navbar.css';

const SIGNUP_INTENT_KEY = 'gtm_signup_intent';

const getDashboardUrl = (personal = false) => {
  const suffix = personal ? '/organization?scope=personal' : '/organization';
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return suffix;
    }
  }
  return `https://app.gtmobserver.com${suffix}`;
};

export const SignUpPage = () => {
  const { isLoaded, isSignedIn, orgId } = useAuth();
  const { session } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const isSsoCallback = location.pathname.includes('sso-callback');
  const [tookTooLong, setTookTooLong] = useState(false);
  const [ssoStalled, setSsoStalled] = useState(false);
  const [signupMode, setSignupMode] = useState<'personal' | 'organization'>(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('type');
      if (q === 'organization' || q === 'personal') return q;
      const saved = sessionStorage.getItem(SIGNUP_INTENT_KEY);
      if (saved === 'organization') return 'organization';
    }
    return 'personal';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SIGNUP_INTENT_KEY, signupMode);
    }
  }, [signupMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTookTooLong(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (session?.currentTask?.key === 'choose-organization') {
      if (!location.pathname.includes('choose-organization')) {
        navigate('/choose-organization', { replace: true });
      }
      return;
    }
    if (session?.currentTask) return;

    const intent = signupMode;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SIGNUP_INTENT_KEY);
    }

    if (intent === 'organization' && !orgId) {
      navigate('/choose-organization', { replace: true });
      return;
    }

    const target = getDashboardUrl(intent === 'personal');
    if (/^https?:\/\//i.test(target) && new URL(target).origin !== window.location.origin) {
      window.location.replace(target);
    } else {
      navigate(target, { replace: true });
    }
  }, [isLoaded, isSignedIn, session, orgId, signupMode, location.pathname, navigate]);

  useEffect(() => {
    if (!isSsoCallback || isSignedIn) {
      setSsoStalled(false);
      return;
    }
    const timer = setTimeout(() => setSsoStalled(true), 8000);
    return () => clearTimeout(timer);
  }, [isSsoCallback, isSignedIn]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <BackgroundMesh />
      
      <header className="navbar" style={{ position: 'absolute', background: 'transparent' }}>
        <div className="navbar-container">
          <a href="https://gtmobserver.com" className="navbar-logo" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/gtmobserver-logo.webp" alt="GTMObserver Logo" style={{ height: '42px', width: 'auto' }} />
          </a>
          <a href="https://gtmobserver.com" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9CA3AF', textDecoration: 'none', fontWeight: 500, transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>
            <span>Close</span>
            <X size={20} />
          </a>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, padding: '2rem' }}>
        <ClerkLoading>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', maxWidth: '420px' }}>
            <Loader2 className="animate-spin" size={36} color="#00F0FF" />
            <p style={{ color: '#E5E7EB', fontSize: '1rem', fontWeight: 500 }}>Connecting to authentication...</p>
            {tookTooLong && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444', fontWeight: 600, marginBottom: '0.5rem', justifyContent: 'center' }}>
                  <AlertCircle size={18} />
                  <span>Waiting for DNS Resolution</span>
                </div>
                <p style={{ color: '#9CA3AF', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                  Clerk is waiting to connect to <code>clerk.gtmobserver.com</code>. Please add the CNAME record <code>clerk &rarr; frontend-api.clerk.services</code> in your Cloudflare DNS (DNS-only / grey cloud).
                </p>
              </div>
            )}
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          {isLoaded && isSignedIn ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
              <Loader2 className="animate-spin" size={36} color="#00F0FF" />
              <p style={{ color: '#E5E7EB', fontSize: '1rem', fontWeight: 500 }}>Redirecting to your workspace...</p>
            </div>
          ) : (
            <>
              {!isSsoCallback && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    marginBottom: '1rem',
                    padding: '0.85rem',
                    borderRadius: '14px',
                    background: 'rgba(15, 23, 38, 0.88)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(12px)'
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: '#94A3B8',
                      textTransform: 'uppercase',
                      marginBottom: '0.55rem'
                    }}
                  >
                    Choose Workspace Type
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                    <button
                      type="button"
                      onClick={() => setSignupMode('personal')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        padding: 'var(--btn-padding)',
                        minHeight: 'var(--btn-min-height)',
                        borderRadius: 'var(--btn-radius)',
                        border: signupMode === 'personal'
                          ? '1px solid rgba(0, 240, 255, 0.55)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        background: signupMode === 'personal'
                          ? 'rgba(0, 240, 255, 0.14)'
                          : 'rgba(255, 255, 255, 0.03)',
                        color: signupMode === 'personal' ? '#00F0FF' : '#CBD5E1',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <User size={15} />
                      Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupMode('organization')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        padding: 'var(--btn-padding)',
                        minHeight: 'var(--btn-min-height)',
                        borderRadius: 'var(--btn-radius)',
                        border: signupMode === 'organization'
                          ? '1px solid rgba(0, 240, 255, 0.55)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        background: signupMode === 'organization'
                          ? 'rgba(0, 240, 255, 0.14)'
                          : 'rgba(255, 255, 255, 0.03)',
                        color: signupMode === 'organization' ? '#00F0FF' : '#CBD5E1',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Building2 size={15} />
                      Organization
                    </button>
                  </div>
                  <p style={{ margin: '0.55rem 0 0', fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.4 }}>
                    {signupMode === 'organization'
                      ? 'Create a team organization for client portfolios & shared members.'
                      : 'Solo personal workspace for your own websites & GA4 monitors.'}
                  </p>
                </div>
              )}
              <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                fallbackRedirectUrl={signupMode === 'organization' ? '/choose-organization' : '/organization?scope=personal'}
                signInFallbackRedirectUrl="/organization"
              />
              {ssoStalled && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    maxWidth: '420px',
                    width: '100%',
                    background: 'rgba(15, 23, 38, 0.92)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    borderRadius: '12px',
                    padding: '1.15rem',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#00F0FF', fontWeight: 600, marginBottom: '0.45rem' }}>
                    <AlertCircle size={18} />
                    <span>Sign-up Callback Interrupted</span>
                  </div>
                  <p style={{ color: '#9CA3AF', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem' }}>
                    This OAuth callback may have expired or been interrupted. Return to Sign In to restart authentication cleanly.
                  </p>
                  <Link
                    to="/sign-in"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 'var(--btn-padding)',
                      minHeight: 'var(--btn-min-height)',
                      borderRadius: 'var(--btn-radius)',
                      background: 'linear-gradient(135deg, #4F46E5, #00F0FF)',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      textDecoration: 'none'
                    }}
                  >
                    Return to Sign In
                  </Link>
                </div>
              )}
            </>
          )}
        </ClerkLoaded>
      </div>
    </div>
  );
};
