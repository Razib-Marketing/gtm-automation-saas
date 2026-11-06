import { useState, useEffect } from 'react';
import { SignIn, ClerkLoaded, ClerkLoading } from '@clerk/clerk-react';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { X, Loader2, AlertCircle } from 'lucide-react';
import '../components/layout/Navbar.css';

export const SignInPage = () => {
  const [tookTooLong, setTookTooLong] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTookTooLong(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

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
          <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="https://gtmobserver.com" fallbackRedirectUrl="https://gtmobserver.com" />
        </ClerkLoaded>
      </div>
    </div>
  );
};
