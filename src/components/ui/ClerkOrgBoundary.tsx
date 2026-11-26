import React from 'react';
import { OrganizationSwitcher, OrganizationProfile, useAuth, useClerk } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { Building2, AlertCircle, Plus, User } from 'lucide-react';

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
            <strong>Organization Notice:</strong> Organization management is loading or unavailable on this session.
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
        afterSelectPersonalUrl="/organization?scope=personal"
        afterSelectOrganizationUrl="/organization"
        afterCreateOrganizationUrl="/organization"
        afterLeaveOrganizationUrl="/organization?scope=personal"
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
              padding: compact ? '0.48rem 0.7rem' : 'var(--btn-padding)',
              borderRadius: 'var(--btn-radius, 10px)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              color: '#F3F4F6'
            }
          }
        }}
      />
    </ClerkOrgBoundary>
  );
};

export const ClerkOrgProfileWidget: React.FC<{ isSandboxMode?: boolean }> = ({ isSandboxMode = false }) => {
  const { orgId } = useAuth();
  const { openCreateOrganization } = useClerk();

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
        Organization management is active on signed-in sessions (`app.gtmobserver.com`). Use the <strong>Organizations</strong> and <strong>Universal Project Access</strong> tabs here to test team sharing in Local Sandbox mode.
      </div>
    );
  }

  return (
    <ClerkOrgBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem', color: '#FFFFFF', fontSize: '1.05rem' }}>
              Active Organization
            </h3>
            <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.84rem' }}>
              Switch between Personal Account and Organizations, create a new organization, or invite teammates and manage roles.
            </p>
          </div>
          <ClerkOrgSwitcherWidget />
        </div>

        {!orgId ? (
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', maxWidth: '580px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(0, 240, 255, 0.12)',
                  border: '1px solid rgba(0, 240, 255, 0.28)',
                  color: '#00F0FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <User size={19} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem', color: '#FFFFFF', fontSize: '1rem' }}>
                  Personal Account Active
                </h4>
                <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.86rem', lineHeight: 1.5 }}>
                  You are currently working in your Personal Workspace. Switch to an existing organization above or create a new organization to invite team members and assign roles.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openCreateOrganization({ afterCreateOrganizationUrl: '/access' })}
              className="org-btn-primary"
            >
              <Plus size={16} />
              Create Organization
            </button>
          </div>
        ) : (
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
        )}
      </div>
    </ClerkOrgBoundary>
  );
};
