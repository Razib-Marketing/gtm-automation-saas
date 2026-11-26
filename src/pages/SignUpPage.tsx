import { useState, useEffect } from 'react';
import { SignUp, ClerkLoaded, ClerkLoading, useAuth } from '@clerk/clerk-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { X, Loader2, AlertCircle } from 'lucide-react';
import '../components/layout/Navbar.css';

const getDashboardUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '/organization';
    }
  }
  return 'https://app.gtmobserver.com/organization';
};

export const SignUpPage = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isSsoCallback = location.pathname.includes('sso-callback');
  const [tookTooLong, setTookTooLong] = useState(false);
  const [ssoStalled, setSsoStalled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTookTooLong(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const target = getDashboardUrl();
    if (/^https?:\/\//i.test(target) && new URL(target).origin !== window.location.origin) {
      window.location.replace(target);
    } else {
      navigate('/organization', { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

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
              <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                fallbackRedirectUrl="/organization"
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
