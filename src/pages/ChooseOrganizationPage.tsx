import { useEffect } from 'react';
import { TaskChooseOrganization, CreateOrganization, ClerkLoaded, ClerkLoading, useAuth, useSession } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useNavigate, Link } from 'react-router-dom';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { X, Loader2, ArrowRight, User } from 'lucide-react';
import '../components/layout/Navbar.css';

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

export const ChooseOrganizationPage = () => {
  const { isLoaded, isSignedIn, orgId } = useAuth();
  const { session } = useSession();
  const navigate = useNavigate();
  const hasChooseOrgTask = session?.currentTask?.key === 'choose-organization';
  const personalWorkspaceHref = getDashboardUrl(true);
  const isExternalPersonal = /^https?:\/\//i.test(personalWorkspaceHref);

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
          {hasChooseOrgTask ? (
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
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.15rem', width: '100%', maxWidth: '460px' }}>
              <CreateOrganization
                routing="virtual"
                afterCreateOrganizationUrl="/organization"
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
              {isExternalPersonal ? (
                <a
                  href={personalWorkspaceHref}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: 'var(--btn-padding)',
                    minHeight: 'var(--btn-min-height)',
                    borderRadius: 'var(--btn-radius)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    color: '#F1F5F9',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                >
                  <User size={16} />
                  Continue with Personal Workspace
                  <ArrowRight size={15} />
                </a>
              ) : (
                <Link
                  to={personalWorkspaceHref}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: 'var(--btn-padding)',
                    minHeight: 'var(--btn-min-height)',
                    borderRadius: 'var(--btn-radius)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    color: '#F1F5F9',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                >
                  <User size={16} />
                  Continue with Personal Workspace
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>
          )}
        </ClerkLoaded>
      </div>
    </div>
  );
};
