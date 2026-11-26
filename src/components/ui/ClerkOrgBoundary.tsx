import React from 'react';
import { OrganizationSwitcher, OrganizationProfile } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { Building2, AlertCircle } from 'lucide-react';

interface BoundaryState {
  hasError: boolean;
  message: string;
}

export class ClerkOrgBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  BoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: any): BoundaryState {
    return { hasError: true, message: error?.message || 'Clerk Organizations not enabled on this instance' };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;
      return (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.28)',
            color: '#FCD34D',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Clerk Organizations Notice:</strong> Enable <em>Organizations</em> inside your Clerk Dashboard (Configure &rarr; Organizations) to use Clerk&apos;s native organization switcher &amp; invitations alongside our built-in Client Organizations.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ClerkOrgSwitcherWidget: React.FC<{
  compact?: boolean;
  isSandboxMode?: boolean;
}> = ({ compact = false, isSandboxMode = false }) => {
  if (isSandboxMode) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.45rem 0.7rem',
          borderRadius: '10px',
          background: 'rgba(0, 240, 255, 0.08)',
          border: '1px solid rgba(0, 240, 255, 0.22)',
          color: '#E5E7EB',
          fontSize: '0.78rem',
          fontWeight: 600,
          width: '100%'
        }}
      >
        <Building2 size={14} color="#00F0FF" />
        <span>Sandbox Organization</span>
      </div>
    );
  }

  return (
    <ClerkOrgBoundary
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.4rem 0.65rem',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#9CA3AF',
            fontSize: '0.75rem',
            width: '100%'
          }}
        >
          <Building2 size={13} color="#00F0FF" />
          <span>Personal &amp; Client Orgs</span>
        </div>
      }
    >
      <OrganizationSwitcher
        hidePersonal={false}
        afterSelectOrganizationUrl="/organization"
        afterSelectPersonalUrl="/organization"
        afterCreateOrganizationUrl="/organization"
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: '#00F0FF',
            colorBackground: '#0E1420',
            colorText: '#F9FAFB',
            borderRadius: '10px'
          },
          elements: {
            rootBox: { width: compact ? '100%' : 'auto' },
            organizationSwitcherTrigger: {
              width: compact ? '100%' : 'auto',
              justifyContent: 'space-between',
              padding: compact ? '0.48rem 0.7rem' : '0.55rem 0.9rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#F3F4F6'
            }
          }
        }}
      />
    </ClerkOrgBoundary>
  );
};

export const ClerkOrgProfileWidget: React.FC<{ isSandboxMode?: boolean }> = ({ isSandboxMode = false }) => {
  if (isSandboxMode) {
    return (
      <div
        style={{
          padding: '1.5rem',
          borderRadius: '14px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#9CA3AF',
          fontSize: '0.9rem'
        }}
      >
        Clerk Organization Profile is active on signed-in sessions (`app.gtmobserver.com`). Use the <strong>Client Organizations</strong> and <strong>Universal Project Access</strong> tabs here to test team sharing in Local Sandbox mode.
      </div>
    );
  }

  return (
    <ClerkOrgBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem', color: '#FFFFFF', fontSize: '1.05rem' }}>
              Active Clerk Organization
            </h3>
            <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.84rem' }}>
              Switch between your personal workspace and Clerk Organizations, or create a new Clerk Organization and invite teammates.
            </p>
          </div>
          <ClerkOrgSwitcherWidget />
        </div>

        <OrganizationProfile
          routing="hash"
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
      </div>
    </ClerkOrgBoundary>
  );
};
