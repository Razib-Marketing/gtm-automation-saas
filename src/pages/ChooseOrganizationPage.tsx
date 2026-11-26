import { useEffect } from 'react';
import { TaskChooseOrganization, ClerkLoaded, ClerkLoading, useAuth, useSession } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useNavigate } from 'react-router-dom';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { X, Loader2 } from 'lucide-react';
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

export const ChooseOrganizationPage = () => {
  const { isLoaded, isSignedIn, orgId } = useAuth();
  const { session } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (!session?.currentTask && orgId) {
      const target = getDashboardUrl();
      if (/^https?:\/\//i.test(target) && new URL(target).origin !== window.location.origin) {
        window.location.replace(target);
      } else {
        navigate('/organization', { replace: true });
      }
    }
  }, [isLoaded, isSignedIn, session, orgId, navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <BackgroundMesh />

      <header className="navbar" style={{ position: 'absolute', background: 'transparent' }}>
        <div className="navbar-container">
          <a href="https://gtmobserver.com" className="navbar-logo" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/gtmobserver-logo.webp" alt="GTMObserver Logo" style={{ height: '42px', width: 'auto' }} />
          </a>
          <a
            href="https://gtmobserver.com"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#9CA3AF',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.3s'
            }}
          >
            <span>Close</span>
            <X size={20} />
          </a>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10,
          padding: '2rem'
        }}
      >
        <ClerkLoading>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={36} color="#00F0FF" />
            <p style={{ color: '#E5E7EB', fontSize: '1rem', fontWeight: 500 }}>Loading organization selector...</p>
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          <TaskChooseOrganization
            redirectUrlComplete="/organization"
            appearance={{
              baseTheme: dark,
              variables: {
                colorPrimary: '#00F0FF',
                colorBackground: '#0E1420',
                colorText: '#F9FAFB',
                borderRadius: '12px'
              }
            }}
          />
        </ClerkLoaded>
      </div>
    </div>
  );
};
