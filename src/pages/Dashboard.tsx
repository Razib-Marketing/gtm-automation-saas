// @ts-nocheck
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useUser, useAuth, RedirectToSignIn, UserButton } from '@clerk/clerk-react';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { Tag, CheckCircle2, LayoutDashboard, Settings, Layers, Code2, AlertCircle, Loader2, Key, HelpCircle, X, ShieldAlert, Activity, Play, LogOut, Home, FileText, Download, ChevronRight, Lock } from 'lucide-react';
import { AuditModal } from '../components/ui/AuditModal';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const TRACKING_MODULES = [
  { id: 'basic_phone', category: 'Basic & Outbound Clicks', title: 'Phone Click', description: 'Tracks clicks on tel: links' },
  { id: 'basic_email', category: 'Basic & Outbound Clicks', title: 'Email Click', description: 'Tracks clicks on mailto: links' },
  { id: 'basic_facebook', category: 'Basic & Outbound Clicks', title: 'Facebook Click', description: 'Tracks outbound clicks to Facebook' },
  { id: 'basic_instagram', category: 'Basic & Outbound Clicks', title: 'Instagram Click', description: 'Tracks outbound clicks to Instagram' },
  { id: 'basic_gmb', category: 'Basic & Outbound Clicks', title: 'Google My Business Click', description: 'Tracks clicks to Google Maps/GMB listings' },
  { id: 'basic_direction', category: 'Basic & Outbound Clicks', title: 'Direction/Map Click', description: 'Tracks clicks to Apple Maps or Waze' },
  { id: 'basic_tripadvisor', category: 'Basic & Outbound Clicks', title: 'TripAdvisor Click', description: 'Tracks outbound clicks to TripAdvisor' },
  { id: 'basic_booking', category: 'Basic & Outbound Clicks', title: 'Booking.com Click', description: 'Tracks outbound clicks to Booking.com' },
  { id: 'basic_expedia', category: 'Basic & Outbound Clicks', title: 'Expedia Click', description: 'Tracks outbound clicks to Expedia' },
  { id: 'basic_agoda', category: 'Basic & Outbound Clicks', title: 'Agoda Click', description: 'Tracks outbound clicks to Agoda' },
  { id: 'basic_generic_outbound', category: 'Basic & Outbound Clicks', title: 'Generic Outbound Click', description: 'Tracks clicks to any external website' },
  { id: 'social_media', category: 'General', title: 'Universal Social Tracking', description: 'Tracks Facebook, LinkedIn, Twitter, etc.' },
  { id: 'scroll_depth', category: 'General', title: 'Advanced Scroll Depth', description: 'Tracks 25%, 50%, 75%, 90% scroll' },
  { id: 'video_engagement', category: 'General', title: 'YouTube/Vimeo Tracking', description: 'Tracks play, pause, complete' },

  // E-Commerce
  { id: 'ecom_woocommerce', category: 'E-Commerce', title: 'WooCommerce Standard', description: 'Standard GA4 E-Commerce tracking (view_item, add_to_cart, purchase, etc.)' },

  // Forms
  { 
    id: 'group_elementor', category: 'WordPress Ecosystem', title: 'Elementor Forms', description: 'Smart triggers for Elementor forms',
    subModules: [
      { id: 'form_elementor_wedding', title: 'Wedding RFP', description: 'Smart trigger for Elementor wedding forms' },
      { id: 'form_elementor_event', title: 'Event RFP', description: 'Smart trigger for Elementor event forms' },
      { id: 'form_elementor_newsletter', title: 'Newsletter', description: 'Smart trigger for Elementor newsletter forms' },
      { id: 'form_elementor_contact', title: 'Contact', description: 'Smart trigger for Elementor contact forms' },
      { id: 'form_elementor_generic', title: 'Generic (Any)', description: 'Tracks any Elementor form submission' }
    ]
  },
  {
    id: 'group_cf7', category: 'WordPress Ecosystem', title: 'Contact Form 7', description: 'Smart triggers for Contact Form 7',
    subModules: [
      { id: 'form_cf7_wedding', title: 'Wedding RFP', description: 'Smart trigger for CF7 wedding forms' },
      { id: 'form_cf7_event', title: 'Event RFP', description: 'Smart trigger for CF7 event forms' },
      { id: 'form_cf7_newsletter', title: 'Newsletter', description: 'Smart trigger for CF7 newsletter forms' },
      { id: 'form_cf7_contact', title: 'Contact', description: 'Smart trigger for CF7 contact forms' },
      { id: 'form_cf7_generic', title: 'Generic (Any)', description: 'Tracks any Contact Form 7 submission' }
    ]
  },
  {
    id: 'group_gravity', category: 'WordPress Ecosystem', title: 'Gravity Forms', description: 'Smart triggers for Gravity forms',
    subModules: [
      { id: 'form_gravity_wedding', title: 'Wedding RFP', description: 'Smart trigger for Gravity wedding forms' },
      { id: 'form_gravity_event', title: 'Event RFP', description: 'Smart trigger for Gravity event forms' },
      { id: 'form_gravity_newsletter', title: 'Newsletter', description: 'Smart trigger for Gravity newsletter forms' },
      { id: 'form_gravity_contact', title: 'Contact', description: 'Smart trigger for Gravity contact forms' },
      { id: 'form_gravity_generic', title: 'Generic (Any)', description: 'Tracks any Gravity form submission' }
    ]
  },
  {
    id: 'group_hubspot', category: 'Marketing Automation', title: 'HubSpot Forms', description: 'Smart triggers for HubSpot forms',
    subModules: [
      { id: 'form_hubspot_wedding', title: 'Wedding RFP', description: 'Smart trigger for HubSpot wedding forms' },
      { id: 'form_hubspot_event', title: 'Event RFP', description: 'Smart trigger for HubSpot event forms' },
      { id: 'form_hubspot_newsletter', title: 'Newsletter', description: 'Smart trigger for HubSpot newsletter forms' },
      { id: 'form_hubspot_contact', title: 'Contact', description: 'Smart trigger for HubSpot contact forms' },
      { id: 'form_hubspot_generic', title: 'Generic (Any)', description: 'Tracks any HubSpot form submission' }
    ]
  },
  {
    id: 'group_salesforce', category: 'Marketing Automation', title: 'Salesforce Forms', description: 'Smart triggers for Salesforce forms',
    subModules: [
      { id: 'form_salesforce_wedding', title: 'Wedding RFP', description: 'Smart trigger for Salesforce wedding forms' },
      { id: 'form_salesforce_event', title: 'Event RFP', description: 'Smart trigger for Salesforce event forms' },
      { id: 'form_salesforce_newsletter', title: 'Newsletter', description: 'Smart trigger for Salesforce newsletter forms' },
      { id: 'form_salesforce_contact', title: 'Contact', description: 'Smart trigger for Salesforce contact forms' },
      { id: 'form_salesforce_generic', title: 'Generic (Any)', description: 'Tracks any Salesforce form submission' }
    ]
  },
  {
    id: 'group_revinate', category: 'Hospitality & Niche', title: 'Revinate Forms', description: 'Smart triggers for Revinate forms',
    subModules: [
      { id: 'form_revinate_wedding', title: 'Wedding RFP', description: 'Smart trigger for Revinate wedding forms' },
      { id: 'form_revinate_event', title: 'Event RFP', description: 'Smart trigger for Revinate event forms' },
      { id: 'form_revinate_newsletter', title: 'Newsletter', description: 'Smart trigger for Revinate newsletter forms' },
      { id: 'form_revinate_contact', title: 'Contact', description: 'Smart trigger for Revinate contact forms' },
      { id: 'form_revinate_generic', title: 'Generic (Any)', description: 'Tracks any Revinate form submission' }
    ]
  },
  {
    id: 'group_zmail', category: 'Hospitality & Niche', title: 'Zmail Direct', description: 'Smart triggers for Zmail forms',
    subModules: [
      { id: 'form_zmail_newsletter', title: 'Newsletter', description: 'Smart trigger for Zmail Direct newsletter iframe forms' }
    ]
  },
  {
    id: 'group_generic', category: 'Website Builders & General', title: 'Generic HTML Forms', description: 'Smart triggers for any standard HTML forms',
    subModules: [
      { id: 'form_generic_wedding', title: 'Wedding RFP', description: 'Smart trigger for generic HTML wedding forms' },
      { id: 'form_generic_event', title: 'Event RFP', description: 'Smart trigger for generic HTML event forms' },
      { id: 'form_generic_newsletter', title: 'Newsletter', description: 'Smart trigger for generic HTML newsletter forms' },
      { id: 'form_generic_contact', title: 'Contact', description: 'Smart trigger for generic HTML contact forms' },
      { id: 'form_generic_generic', title: 'Generic (Any)', description: 'Tracks any generic HTML form submission' }
    ]
  },
  {
    id: 'group_custom_php', category: 'Website Builders & General', title: 'Custom PHP Forms (sendmail.php)', description: 'Smart triggers for AJAX forms using sendmail.php',
    subModules: [
      { id: 'form_custom_php_wedding', title: 'Wedding RFP', description: 'Smart trigger for PHP wedding forms' },
      { id: 'form_custom_php_event', title: 'Event RFP', description: 'Smart trigger for PHP event forms' },
      { id: 'form_custom_php_newsletter', title: 'Newsletter', description: 'Smart trigger for PHP newsletter forms' },
      { id: 'form_custom_php_contact', title: 'Contact', description: 'Smart trigger for PHP contact forms' },
      { id: 'form_custom_php_generic', title: 'Generic (Any)', description: 'Tracks any PHP form submission' }
    ]
  },

  {
    id: 'group_stayntouch', category: 'Hotel Booking Engines', title: 'StayNTouch', description: 'StayNTouch booking engine suite',
    subModules: [
      { id: 'hotel_stayntouch', title: 'Standard E-Commerce', description: 'Main tracking suite for StayNTouch' },
      { id: 'hotel_stayntouch_entrance', title: 'Booking Entrance', description: 'Fires when user clicks StayNTouch link' }
    ]
  },
  {
    id: 'group_synxis', category: 'Hotel Booking Engines', title: 'Synxis/SBE', description: 'Synxis booking engine suite',
    subModules: [
      { id: 'hotel_synxis', title: 'Standard E-Commerce', description: 'Main tracking suite for Synxis' },
      { id: 'hotel_synxis_entrance', title: 'Booking Entrance', description: 'Fires when user clicks Synxis link' }
    ]
  },
  {
    id: 'group_windsurfers', category: 'Hotel Booking Engines', title: 'Windsurfers', description: 'Windsurfers booking engine suite',
    subModules: [
      { id: 'hotel_windsurfers', title: 'Standard E-Commerce', description: 'Main tracking suite for Windsurfers' },
      { id: 'hotel_windsurfers_entrance', title: 'Booking Entrance', description: 'Fires when user clicks Windsurfers link' }
    ]
  },
  {
    id: 'group_mews', category: 'Hotel Booking Engines', title: 'Mews', description: 'Mews booking engine suite',
    subModules: [
      { id: 'hotel_mews', title: 'Standard E-Commerce', description: 'Main tracking suite for Mews' },
      { id: 'hotel_mews_entrance', title: 'Booking Entrance', description: 'Fires when user clicks Mews link' }
    ]
  },
  {
    id: 'group_ihotelier', category: 'Hotel Booking Engines', title: 'iHotelier', description: 'iHotelier booking engine suite',
    subModules: [
      { id: 'hotel_ihotelier', title: 'Standard E-Commerce', description: 'Main tracking suite for iHotelier' },
      { id: 'hotel_ihotelier_entrance', title: 'Booking Entrance', description: 'Fires when user clicks iHotelier link' }
    ]
  }
];

export const Dashboard = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken, signOut } = useAuth();
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);
  const location = useLocation();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  const [selectedAccount, setSelectedAccount] = useState(() => localStorage.getItem('gtm_selectedAccount') || '');
  const [selectedContainer, setSelectedContainer] = useState(() => localStorage.getItem('gtm_selectedContainer') || '');
  const [selectedWorkspace, setSelectedWorkspace] = useState(() => localStorage.getItem('gtm_selectedWorkspace') || '');

  // Bulk Deployment State
  const [measurementId, setMeasurementId] = useState(() => localStorage.getItem('gtm_measurementId') || '');
  const [fbPixelId, setFbPixelId] = useState(() => localStorage.getItem('gtm_fbPixelId') || '');
  const [googleAdsId, setGoogleAdsId] = useState(() => localStorage.getItem('gtm_googleAdsId') || '');
  const [customFormEventsText, setCustomFormEventsText] = useState('');
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [deployedModules, setDeployedModules] = useState<Set<string>>(new Set());
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'custom'>('free');
  const [deploymentCount, setDeploymentCount] = useState(0);
  const [moduleConfigs, setModuleConfigs] = useState<Record<string, { pagePath?: string, injectDataLayer?: boolean, enableFb?: boolean, enableAds?: boolean, adsLabel?: string }>>({});
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'loading' | 'configured' | 'not_configured'>(() => {
    return (localStorage.getItem('gtm_verifyStatus') as any) || 'idle';
  });
  const [isNewGtmConfig, setIsNewGtmConfig] = useState(() => {
    return localStorage.getItem('gtm_isNewGtmConfig') === 'false' ? false : true;
  });
  const [debugGtmData, setDebugGtmData] = useState<any>(() => {
    const saved = localStorage.getItem('gtm_debugGtmData');
    return saved ? JSON.parse(saved) : null;
  }); // State for debugging GTM payload
  const [deploying, setDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [deployErrorMsg, setDeployErrorMsg] = useState('');
  const [deploymentLogs, setDeploymentLogs] = useState<{status: 'info' | 'success' | 'error', message: string}[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!deploying && deployStatus === 'success') {
      setProgress(100);
    } else if (!deploying && deployStatus === 'idle') {
      setProgress(0);
    }
  }, [deploying, deployStatus]);

  useEffect(() => { localStorage.setItem('gtm_selectedAccount', selectedAccount); }, [selectedAccount]);
  useEffect(() => { localStorage.setItem('gtm_selectedContainer', selectedContainer); }, [selectedContainer]);
  useEffect(() => { localStorage.setItem('gtm_selectedWorkspace', selectedWorkspace); }, [selectedWorkspace]);
  useEffect(() => { localStorage.setItem('gtm_measurementId', measurementId); }, [measurementId]);
  useEffect(() => { localStorage.setItem('gtm_fbPixelId', fbPixelId); }, [fbPixelId]);
  useEffect(() => { localStorage.setItem('gtm_googleAdsId', googleAdsId); }, [googleAdsId]);
  useEffect(() => { localStorage.setItem('gtm_verifyStatus', verifyStatus); }, [verifyStatus]);
  useEffect(() => { localStorage.setItem('gtm_isNewGtmConfig', String(isNewGtmConfig)); }, [isNewGtmConfig]);
  useEffect(() => { localStorage.setItem('gtm_debugGtmData', debugGtmData ? JSON.stringify(debugGtmData) : ''); }, [debugGtmData]);

  useEffect(() => {
    if (hasGoogleAuth && selectedAccount) {
      getToken().then(token => {
        if (!token) return;
        return fetch(`/api/gtm/containers?accountId=${selectedAccount}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(async res => {
            const data = await res.json();
            if (!res.ok) {
              alert(`Error fetching containers: ${data.error?.message || data.error || 'Unknown error'}`);
              setContainers([]);
              return;
            }
            const fetchedContainers = data.container || [];
            setContainers(fetchedContainers);
            if (selectedContainer) {
              const isValid = fetchedContainers.some((c: any) => c.path === selectedContainer);
              if (!isValid) {
                setSelectedContainer('');
                setSelectedWorkspace('');
                setVerifyStatus('idle');
              }
            }
          })
          .catch(console.error);
      });
    } else {
      setContainers([]);
    }
  }, [hasGoogleAuth, selectedAccount]);

  useEffect(() => {
    if (hasGoogleAuth && selectedContainer) {
      getToken().then(token => {
        if (!token) return;
        return fetch(`/api/gtm/workspaces?containerPath=${selectedContainer}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(async res => {
            const data = await res.json();
            if (!res.ok) {
              alert(`Error fetching workspaces: ${data.error?.message || data.error || 'Unknown error'}`);
              setWorkspaces([]);
              return;
            }
            const fetchedWorkspaces = data.workspace || [];
            setWorkspaces(fetchedWorkspaces);
            // Check if the currently selected workspace is still valid
            if (selectedWorkspace) {
              const isValid = fetchedWorkspaces.some((w: any) => `${selectedContainer}/workspaces/${w.workspaceId}` === selectedWorkspace);
              if (!isValid) {
                setSelectedWorkspace('');
                setVerifyStatus('idle');
              }
            }
          })
          .catch(console.error);
      });
    } else {
      setWorkspaces([]);
    }
  }, [hasGoogleAuth, selectedContainer]);

  // Audit State
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditData, setAuditData] = useState<{tags: any[], triggers: any[], variables: any[]} | null>(null);
  const [auditGtmId, setAuditGtmId] = useState('');

  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const AUDITS_PER_PAGE = 5;

  useEffect(() => {
    if (user?.id) {
      fetchRecentAudits();
    }
  }, [user?.id]);

  const fetchRecentAudits = async () => {
    try {
      const res = await fetch(`/api/gtm/audit-logs?userId=${user?.id}`);
      const data = await res.json();
      if (data.logs) {
        setRecentAudits(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch recent audits', err);
    }
  };

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    const searchParams = new URLSearchParams(location.search);
    const checkAuth = async () => {
      const res = await fetch(`/api/auth/status?clerkUserId=${user.id}`);
      const data = await res.json();
      setHasGoogleAuth(data.hasAuth);
      if (data.hasAuth) {
        fetchAccounts();
      }
      
      // Fetch user tier and limits
      try {
        const email = user.primaryEmailAddress?.emailAddress || '';
        const meRes = await fetch(`/api/user/me?clerkUserId=${user.id}&email=${encodeURIComponent(email)}`);
        const meData = await meRes.json();
        if (meData && meData.subscription_tier) {
          setUserTier(meData.subscription_tier);
          setDeploymentCount(meData.account_deployment_count || 0);
        }
      } catch (e) {
        console.error('Failed to fetch user tier', e);
      }
    };
    checkAuth();
  }, [location, isLoaded, user?.id]);

  const fetchAccounts = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/gtm/accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.status === 401 || (data.error && typeof data.error === 'string' && data.error.includes('invalid_grant'))) {
        setHasGoogleAuth(false);
        return;
      }

      if (!res.ok) {
        console.error('API Error:', data);
        if (res.status === 403) {
          const errorMessage = data?.error?.message || JSON.stringify(data);
          alert(`Google API Error (403): ${errorMessage}\n\nPlease ensure the Tag Manager API is enabled and you checked the permissions checkboxes during login.`);
        }
        return;
      }
      
      setAccounts(data.account || []);
    } catch (err) {
      console.error(err);
      setHasGoogleAuth(false);
    }
  };

  const handleAccountSelect = async (accountId: string) => {
    setSelectedAccount(accountId);
    setSelectedContainer('');
    setSelectedWorkspace('');
    setVerifyStatus('idle');
    setIsNewGtmConfig(false);
    
    const token = await getToken();
    const res = await fetch(`/api/gtm/containers?accountId=${accountId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    
    if (!res.ok) {
      alert(`Error fetching containers: ${data.error?.message || data.error || 'Unknown error'}`);
      setContainers([]);
      return;
    }
    
    setContainers(data.container || []);
  };

  const handleContainerSelect = async (containerPath: string) => {
    setSelectedContainer(containerPath);
    setSelectedWorkspace('');

    const token = await getToken();
    const res = await fetch(`/api/gtm/workspaces?containerPath=${containerPath}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    
    if (!res.ok) {
      alert(`Error fetching workspaces: ${data.error?.message || data.error || 'Unknown error'}`);
      setWorkspaces([]);
      return;
    }
    
    setWorkspaces(data.workspace || []);
    setVerifyStatus('idle');
    setIsNewGtmConfig(false);
  };

  const handleGoogleOAuth = () => {
    window.location.href = `/api/auth/google/login?clerkUserId=${user?.id}`;
  };

  const handleRunAudit = async () => {
    if (!selectedWorkspace) return;

    if (userTier === 'free' && recentAudits.length >= 5) {
      alert("Free tier users can only run 5 GTM Workspace Audits. Please upgrade to Pro or Custom.");
      return;
    }

    setIsAuditOpen(true);
    setAuditLoading(true);
    
    const activeContainerObj = containers.find(c => `accounts/${selectedAccount}/containers/${c.containerId}` === selectedContainer);
    setAuditGtmId(activeContainerObj ? activeContainerObj.publicId : 'GTM-XXXXX');

    try {
      const token = await getToken();
      const res = await fetch(`/api/gtm/audit?containerPath=${selectedWorkspace}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAuditData({ 
        tags: data.tags || [], 
        triggers: data.triggers || [],
        variables: data.variables || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleViewHistoricalAudit = (audit: any) => {
    setAuditGtmId(audit.gtmId);
    setAuditData(audit.rawData);
    setAuditLoading(false);
    setIsAuditOpen(true);
  };

  const toggleModule = (id: string) => {
    const next = new Set(selectedModules);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedModules(next);
  };

  const handleVerifyConfig = async () => {
    if (!measurementId.startsWith('G-')) {
      alert("Please enter a valid GA4 Measurement ID starting with G-");
      return;
    }
    if (!selectedWorkspace) {
      alert("Please select a workspace first.");
      return;
    }

    setVerifyStatus('loading');
    try {
      const token = await getToken();
      const res = await fetch('/api/gtm/verify-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ containerPath: selectedWorkspace, measurementId })
      });
      const data = await res.json();
      if (res.ok && data.isConfigured) {
        setVerifyStatus('configured');
        setIsNewGtmConfig(false);
        setDebugGtmData(null);
      } else {
        setVerifyStatus('not_configured');
        setIsNewGtmConfig(true); // Default to true so they don't have to click it
        if (data.debugTags) {
          setDebugGtmData(data); // Capture debug data
        }
      }
    } catch (e) {
      console.error(e);
      setVerifyStatus('idle');
      alert("Verification failed.");
    }
  };

  const handleBulkDeploy = async () => {
    if (!measurementId.startsWith('G-')) {
      alert("Please enter a valid GA4 Measurement ID starting with G-");
      return;
    }
    
    const customEventsList = customFormEventsText
      .split(',')
      .map(s => {
        let formatted = s.trim().toLowerCase().replace(/\s+/g, '_');
        if (!formatted) return '';
        if (formatted.endsWith('_submit')) {
          formatted = formatted.replace(/_submit$/, '_submission');
        } else if (!formatted.endsWith('_submission')) {
          formatted += '_submission';
        }
        return formatted;
      })
      .filter(Boolean);
    
    if (selectedModules.size === 0 && customEventsList.length === 0 && (!isNewGtmConfig || verifyStatus !== 'not_configured')) {
      alert("Please select at least one tracking module or enter custom form events to deploy.");
      return;
    }

    // Tier validations
    const hasPremiumModules = Array.from(selectedModules).some(id => id !== 'basic_phone' && id !== 'basic_email');
    if (userTier === 'free' && hasPremiumModules) {
      alert("Free tier users can only deploy Base GA4, Phone Click, and Email Click modules. Please upgrade to Pro.");
      window.location.href = '/pricing';
      return;
    }

    if (userTier === 'pro' && deploymentCount >= 10) {
      // Need to check if this is a new account or existing
      // We will assume if they reached 10, we warn them. For a better UX, we'd check if this specific account is already deployed to.
      alert("Pro tier limit reached: You can only deploy to 10 distinct GTM accounts. Please contact sales to upgrade.");
      window.location.href = '/pricing';
      return;
    }

    setDeploying(true);
    setDeployStatus('idle');
    setProgress(0);
    setDeploymentLogs([{ status: 'info', message: 'Initializing deployment...' }]);

    try {
      const token = await getToken();
      
      const genRes = await fetch('/api/gtm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          moduleIds: Array.from(selectedModules),
          moduleConfigs: Array.from(selectedModules).map(id => ({ 
            id, 
            pagePath: moduleConfigs[id]?.pagePath || '', 
            injectDataLayer: moduleConfigs[id]?.injectDataLayer || false,
            enableFb: moduleConfigs[id]?.enableFb || false,
            enableAds: moduleConfigs[id]?.enableAds || false,
            adsLabel: moduleConfigs[id]?.adsLabel || ''
          })),
          customFormEvents: customEventsList,
          containerPath: selectedWorkspace,
          measurementId: measurementId,
          fbPixelId: fbPixelId,
          googleAdsId: googleAdsId,
          isNewGTM: isNewGtmConfig
        })
      });

      if (!genRes.ok) {
        const err = await genRes.json();
        throw new Error(err.error || "Failed to generate templates");
      }

      const { templates } = await genRes.json();

      let totalReqs = 0;
      templates.forEach((tpl: any) => {
        totalReqs += (tpl.variables?.length || 0) + (tpl.triggers?.length || 0) + (tpl.tags?.length || 0);
      });
      let completedReqs = 0;
      let hasErrors = false;

      const isDuplicateError = (data: any) => {
        const str = JSON.stringify(data).toLowerCase();
        return str.includes('already exists') || str.includes('duplicate name');
      };

      for (const tpl of templates) {
        // Variables
        for (const variable of tpl.variables || []) {
          if (variable._skipDeploy) {
             completedReqs++;
             setProgress(Math.round((completedReqs / totalReqs) * 100));
             continue;
          }
          const payload = { ...variable };
          delete payload._skipDeploy;

          setDeploymentLogs(prev => [...prev, { status: 'info', message: `Deploying variable: ${variable.name}` }]);
          const vRes = await fetch('/api/gtm/deploy-item', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ type: 'variable', containerPath: selectedWorkspace, payload })
          });
          const vData = await vRes.json();
          if (!vRes.ok && !isDuplicateError(vData)) {
             setDeploymentLogs(prev => [...prev, { status: 'error', message: `Failed variable ${variable.name}: ${vData.error?.message || vData.error || 'Unknown error'}` }]);
             hasErrors = true;
             continue;
          }
          if (isDuplicateError(vData)) {
             setDeploymentLogs(prev => [...prev, { status: 'error', message: `Skipped variable (Already Exists): ${variable.name}` }]);
          } else {
             setDeploymentLogs(prev => [...prev, { status: 'success', message: `Successfully deployed variable: ${variable.name}` }]);
          }
          completedReqs++;
          setProgress(Math.round((completedReqs / totalReqs) * 100));
          await sleep(2000); // Wait 2s to bypass GTM Quota Limits (60 req / 100s)
        }

        // Triggers
        for (const trigger of tpl.triggers || []) {
          if (trigger._skipDeploy) {
             completedReqs++;
             setProgress(Math.round((completedReqs / totalReqs) * 100));
             continue;
          }
          const payload = { ...trigger };
          delete payload.triggerId;
          delete payload._skipDeploy;
          setDeploymentLogs(prev => [...prev, { status: 'info', message: `Deploying trigger: ${trigger.name}` }]);
          const tRes = await fetch('/api/gtm/deploy-item', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ type: 'trigger', containerPath: selectedWorkspace, payload })
          });
          const tData = await tRes.json();
          if (!tRes.ok && !isDuplicateError(tData)) {
             setDeploymentLogs(prev => [...prev, { status: 'error', message: `Failed trigger ${trigger.name}: ${tData.error?.message || tData.error || 'Unknown error'}` }]);
             hasErrors = true;
             continue;
          }
          if (isDuplicateError(tData)) {
             setDeploymentLogs(prev => [...prev, { status: 'error', message: `Skipped trigger (Already Exists): ${trigger.name}` }]);
          } else {
             setDeploymentLogs(prev => [...prev, { status: 'success', message: `Successfully deployed trigger: ${trigger.name}` }]);
          }
          completedReqs++;
          setProgress(Math.round((completedReqs / totalReqs) * 100));
          await sleep(2000); // Rate Limit Protection
        }

        // Tags
        if ((tpl.tags?.length || 0) > 0) {
          // Fetch existing triggers from GTM to correctly map names to their real Google-assigned IDs
          const auditRes = await fetch(`/api/gtm/audit?containerPath=${selectedWorkspace}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const auditData = await auditRes.json();
          
          const oldIdToNameMap: Record<string, string> = {};
          (tpl.triggers || []).forEach((t: any) => { oldIdToNameMap[t.triggerId] = t.name; });
          
          const existingTriggersMap: Record<string, string> = {};
          (auditData.triggers || []).forEach((existing: any) => {
              const dummyId = Object.keys(oldIdToNameMap).find(id => oldIdToNameMap[id] === existing.name);
              if (dummyId) {
                  existingTriggersMap[dummyId] = existing.triggerId;
              }
          });

          for (const tag of tpl.tags || []) {
            if (tag._skipDeploy) {
               completedReqs++;
               setProgress(Math.round((completedReqs / totalReqs) * 100));
               continue;
            }
            const payload = { ...tag };
            delete payload._skipDeploy;
            // Map the old template dummy ID to the real Google ID from the workspace
            payload.firingTriggerId = (payload.firingTriggerId || []).map((oldId: string) => existingTriggersMap[oldId] || oldId).filter(Boolean);
            
            setDeploymentLogs(prev => [...prev, { status: 'info', message: `Deploying tag: ${tag.name}` }]);
            const tgRes = await fetch('/api/gtm/deploy-item', {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ type: 'tag', containerPath: selectedWorkspace, payload })
            });
            const tgData = await tgRes.json();
            if (!tgRes.ok && !isDuplicateError(tgData)) {
               setDeploymentLogs(prev => [...prev, { status: 'error', message: `Failed tag ${tag.name}: ${tgData.error?.message || tgData.error || 'Unknown error'}` }]);
               hasErrors = true;
               continue;
            }
            if (isDuplicateError(tgData)) {
               setDeploymentLogs(prev => [...prev, { status: 'error', message: `Skipped tag (Already Exists): ${tag.name}` }]);
            } else {
               setDeploymentLogs(prev => [...prev, { status: 'success', message: `Successfully deployed tag: ${tag.name}` }]);
            }
            completedReqs++;
            setProgress(Math.round((completedReqs / totalReqs) * 100));
            await sleep(2000); // Rate Limit Protection
          }
        }
      }

      if (hasErrors) {
        setDeployStatus('error');
        setDeployErrorMsg('Deployment finished, but some items failed. Please check the logs.');
      } else {
        setDeployStatus('success');
        setDeployedModules(prev => new Set([...Array.from(prev), ...Array.from(selectedModules)]));
        setDeploymentLogs(prev => [...prev, { status: 'success', message: 'All modules deployed successfully and verified!' }]);
        setSelectedModules(new Set());
        setDeployErrorMsg('');
        
        try {
          await fetch('/api/user/track-deployment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ accountId: selectedAccount })
          });
          // Refresh user limits
          const email = user?.primaryEmailAddress?.emailAddress || '';
          const meRes = await fetch(`/api/user/me?clerkUserId=${user?.id}&email=${encodeURIComponent(email)}`);
          const meData = await meRes.json();
          if (meData && meData.subscription_tier) {
            setUserTier(meData.subscription_tier);
            setDeploymentCount(meData.account_deployment_count || 0);
          }
        } catch (e) {
          console.error("Failed to track deployment", e);
        }
      }

      setDeploying(false);

      // Re-verify the GA4 configuration to update the UI dynamically if the user just created it
      if (isNewGtmConfig) {
        handleVerifyConfig();
      }
    } catch (e: any) {
      console.error(e);
      setDeployStatus('error');
      setDeployErrorMsg(e.message || 'Network error');
      setDeploymentLogs(prev => [...prev, { status: 'error', message: `Deployment failed: ${e.message || 'Network error'}` }]);
    } finally {
      setDeploying(false);
    }
  };

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  const groupedModules = TRACKING_MODULES.reduce((acc, mod) => {
    if (!acc[mod.category]) acc[mod.category] = [];
    acc[mod.category].push(mod);
    return acc;
  }, {} as Record<string, typeof TRACKING_MODULES>);

  return (
    <PageTransition locationKey="dashboard">
      <BackgroundMesh />
      <AuditModal 
        isOpen={isAuditOpen} 
        onClose={() => setIsAuditOpen(false)} 
        auditData={auditData} 
        loading={auditLoading} 
        gtmId={auditGtmId}
        userId={user?.id}
        onAuditSaved={fetchRecentAudits}
      />
      

      <div className="dashboard-container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}
        >
          <div>
            <h1 className="dashboard-title" style={{ marginTop: 0 }}>Analytics Dashboard</h1>
            <p className="dashboard-subtitle">Welcome back, {user?.firstName}! Manage your deployed GTM modules.</p>
          </div>
          <div className="topbar-actions">
            <Link to="/" className="btn-home-link">
              <Home size={14} /> Home
            </Link>
            <button onClick={() => signOut()} className="btn-home-link" style={{ cursor: 'pointer' }}>
              <LogOut size={14} /> Log out
            </button>
          </div>
        </motion.div>

        {!hasGoogleAuth ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="oauth-card"
          >
            <ShieldAlert className="oauth-icon text-yellow-400" />
            <h2>Connect Google Tag Manager</h2>
            <p>To deploy automated recipes, you must grant us Editor access to your Tag Manager containers.</p>
            <button onClick={handleGoogleOAuth} className="btn-oauth">
              Authorize GTM Access
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="dashboard-content"
          >
            <div className="status-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <CheckCircle2 className="status-icon" style={{ margin: 0 }} />
                <div>
                  <h3 className="status-title" style={{ margin: 0, marginBottom: '0.25rem' }}>Google Account Connected</h3>
                  <p className="status-description" style={{ margin: 0 }}>We have securely saved your OAuth refresh token to the Cloudflare D1 Edge.</p>
                </div>
              </div>
              <button 
                onClick={() => setHasGoogleAuth(false)}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
              >
                Disconnect
              </button>
            </div>

            {/* Selection Flow */}
            <div className="selection-card">
              <div className="selection-header">
                <h3 className="section-title" style={{ margin: 0 }}>Select Target Workspace</h3>
                <button 
                  className="btn-audit" 
                  onClick={handleRunAudit}
                  disabled={!selectedWorkspace}
                >
                  <Activity className="w-4 h-4 mr-2 inline" /> Run Audit
                </button>
              </div>
              
              <div className="dropdowns-row">
                <select 
                  className="gtm-dropdown" 
                  value={selectedAccount} 
                  onChange={(e) => handleAccountSelect(e.target.value)}
                >
                  <option value="" disabled>Select Account</option>
                  {accounts.map(acc => (
                    <option key={acc.accountId} value={acc.accountId}>{acc.name}</option>
                  ))}
                </select>

                <ChevronRight className="dropdown-arrow" />

                <select 
                  className="gtm-dropdown" 
                  value={selectedContainer} 
                  onChange={(e) => handleContainerSelect(e.target.value)}
                  disabled={!selectedAccount}
                >
                  <option value="" disabled>Select Container</option>
                  {containers.map(c => (
                    <option key={c.containerId} value={`accounts/${selectedAccount}/containers/${c.containerId}`}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <ChevronRight className="dropdown-arrow" />

                <select 
                  className="gtm-dropdown" 
                  value={selectedWorkspace} 
                  onChange={(e) => {
                    setSelectedWorkspace(e.target.value);
                    setVerifyStatus('idle');
                    setDebugGtmData(null);
                    setIsNewGtmConfig(false);
                  }}
                  disabled={!selectedContainer}
                >
                  <option value="" disabled>Select Workspace</option>
                  {workspaces.map(w => (
                    <option key={w.workspaceId} value={`${selectedContainer}/workspaces/${w.workspaceId}`}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Global Settings & Modules List */}
            <div className="bulk-deploy-card">
              <h3 className="section-title">Bulk Deploy Modules</h3>
              
              <div className="global-config">
                <label className="module-label" style={{ display: 'block', marginBottom: '1rem' }}>
                  Target GA4 Measurement ID
                  <div className="input-wrapper" style={{ maxWidth: '400px', marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flexGrow: 1 }}>
                      <Code2 className="input-icon" />
                      <input 
                        type="text" 
                        placeholder="G-XXXXXXXXXX" 
                        value={measurementId}
                        onChange={(e) => {
                          setMeasurementId(e.target.value);
                          setVerifyStatus('idle');
                        }}
                        disabled={verifyStatus === 'configured'}
                        className="module-input"
                        style={{ borderRadius: '9999px', paddingLeft: '2.5rem', opacity: verifyStatus === 'configured' ? 0.6 : 1 }}
                      />
                    </div>
                    <button 
                      onClick={handleVerifyConfig} 
                      disabled={verifyStatus === 'loading' || verifyStatus === 'configured' || !selectedWorkspace}
                      className="btn-oauth" 
                      style={{ 
                        padding: '0.5rem 1rem', 
                        flexShrink: 0, 
                        marginTop: 0,
                        backgroundColor: verifyStatus === 'configured' ? '#10B981' : 'white',
                        color: verifyStatus === 'configured' ? 'white' : 'black',
                        cursor: verifyStatus === 'configured' ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {verifyStatus === 'loading' ? 'Checking...' : verifyStatus === 'configured' ? 'Verified' : 'Verify'}
                    </button>
                  </div>
                  
                  {verifyStatus === 'configured' && (
                    <div style={{ marginTop: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', padding: '1rem' }}>
                      <div style={{ color: '#10B981', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                        <CheckCircle2 className="w-4 h-4" style={{ marginRight: '0.5rem' }} /> GA4 Base Configuration is successfully installed and active!
                      </div>
                    </div>
                  )}
                  {verifyStatus === 'not_configured' && (
                    <div style={{ marginTop: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '1rem' }}>
                      <div style={{ color: '#EF4444', fontSize: '0.875rem', display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <ShieldAlert className="w-4 h-4 mr-1" /> No configuration found for this ID
                      </div>
                      <div 
                        className={`module-card ${isNewGtmConfig ? 'selected' : ''}`}
                        onClick={() => setIsNewGtmConfig(!isNewGtmConfig)}
                        style={{ margin: 0, marginTop: '1rem', cursor: 'pointer' }}
                      >
                        <div className="module-header">
                          <div className="module-title-group">
                            <div className="module-checkbox">
                              {isNewGtmConfig && <CheckCircle2 size={16} />}
                            </div>
                            <h4 style={{ margin: 0 }}>Deploy Base GA4 Configuration Tag</h4>
                          </div>
                        </div>
                        <p className="module-desc" style={{ marginTop: '0.5rem' }}>Automatically creates the base pageview tag.</p>
                      </div>
                    </div>
                  )}
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <label className="module-label" style={{ display: 'block' }}>
                    Facebook Pixel ID <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 'normal' }}>(Optional)</span>
                    <div className="input-wrapper" style={{ marginTop: '0.5rem' }}>
                      <Code2 className="input-icon" />
                      <input 
                        type="text" 
                        placeholder="e.g. 123456789012345" 
                        value={fbPixelId}
                        onChange={(e) => setFbPixelId(e.target.value)}
                        className="module-input"
                        style={{ borderRadius: '6px', paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </label>

                  <label className="module-label" style={{ display: 'block' }}>
                    Google Ads ID <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 'normal' }}>(Optional)</span>
                    <div className="input-wrapper" style={{ marginTop: '0.5rem' }}>
                      <Code2 className="input-icon" />
                      <input 
                        type="text" 
                        placeholder="AW-XXXXXXXXXX" 
                        value={googleAdsId}
                        onChange={(e) => setGoogleAdsId(e.target.value)}
                        className="module-input"
                        style={{ borderRadius: '6px', paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className="modules-list">
                {(() => {
                  const formCategories = ['WordPress Ecosystem', 'Marketing Automation', 'Hospitality & Niche', 'Website Builders & General'];
                  let activeFormCategory: string | null = null;
                  let activeBookingEngine: string | null = null;

                  for (const id of selectedModules) {
                    const mod = TRACKING_MODULES.find(m => m.id === id);
                    if (mod) {
                      if (formCategories.includes(mod.category)) {
                        activeFormCategory = mod.category;
                      }
                      if (mod.category === 'Hotel Booking Engines') {
                        activeBookingEngine = mod.id.replace('_entrance', '');
                      }
                    }
                  }

                  const isModuleDisabled = (modId: string, modCategory: string) => {
                    if (formCategories.includes(modCategory) && activeFormCategory && activeFormCategory !== modCategory) {
                      return true;
                    }
                    if (modCategory === 'Hotel Booking Engines' && activeBookingEngine) {
                      const baseName = modId.replace('_entrance', '');
                      if (baseName !== activeBookingEngine) {
                        return true;
                      }
                    }
                    return false;
                  };

                  const CATEGORY_ORDER = [
                    'Basic & Outbound Clicks',
                    'E-Commerce',
                    'Hotel Booking Engines',
                    'WordPress Ecosystem',
                    'Marketing Automation',
                    'Hospitality & Niche',
                    'Website Builders & General',
                    'General'
                  ];

                  return (
                    <div className="dashboard-content-layout">
                      <div className="dashboard-sidebar">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', marginBottom: '1rem', paddingLeft: '1rem' }}>Categories</h3>
                        <div className="sidebar-menu">
                          {CATEGORY_ORDER.map(cat => (
                            <a key={cat} href={`#cat-${cat.replace(/[^a-zA-Z0-9]/g, '-')}`} className="sidebar-link">
                              {cat}
                            </a>
                          ))}
                        </div>
                      </div>
                      <div className="modules-list modules-main-content">
                        {CATEGORY_ORDER.map(category => {
                          const modules = groupedModules[category];
                          if (!modules) return null;
                          
                          return (
                            <div key={category} id={`cat-${category.replace(/[^a-zA-Z0-9]/g, '-')}`} className="module-category" style={{ scrollMarginTop: '6rem' }}>
                              <h4 className="category-title">{category}</h4>
                              <div className="checkbox-grid">
                                {modules.map(m => {
                                  const renderModule = (m: any, isSubModule = false) => {
                                    const isSelected = selectedModules.has(m.id);
                                    const isDeployed = deployedModules.has(m.id);
                                    const isFreeTierAllowed = m.id === 'basic_phone' || m.id === 'basic_email';
                                  const isLocked = userTier === 'free' && !isFreeTierAllowed;
                                  const isGroup = !!m.subModules;
                                  const isExpanded = isGroup && expandedGroups.has(m.id);
                                  const hasSelectedSub = isGroup && m.subModules.some((sub: any) => selectedModules.has(sub.id));

                                  return (
                                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                                      <motion.div
                                        whileHover={!isLocked ? { scale: 1.01 } : {}}
                                        whileTap={!isLocked ? { scale: 0.99 } : {}}
                                        onClick={() => {
                                          if (isLocked) {
                                             window.location.href = '/pricing';
                                             return;
                                          }
                                          if (isGroup) {
                                             setExpandedGroups(prev => {
                                               const next = new Set(prev);
                                               if (next.has(m.id)) next.delete(m.id);
                                               else next.add(m.id);
                                               return next;
                                             });
                                             return;
                                          }
                                          if (!isDeployed && !isModuleDisabled(m.id, m.category)) {
                                            toggleModule(m.id);
                                          }
                                        }}
                                        className={`module-card ${isSelected || hasSelectedSub ? 'selected' : ''} ${isLocked ? 'locked' : ''} ${isDeployed ? 'deployed' : ''}`}
                                        style={{ 
                                          opacity: isDeployed ? 0.6 : (isLocked ? 0.4 : 1), 
                                          cursor: (isDeployed || isLocked) ? 'not-allowed' : 'pointer',
                                          padding: isSubModule ? '0.75rem 1rem' : undefined,
                                          border: isSubModule ? '1px solid rgba(255,255,255,0.05)' : undefined,
                                          background: isSubModule ? 'rgba(0,0,0,0.15)' : undefined,
                                          width: '100%'
                                        }}
                                      >
                                        <div className="module-header">
                                          <div className="module-title-group">
                                            <div className="module-checkbox" style={{ border: isGroup ? 'none' : undefined }}>
                                              {isGroup ? (
                                                <ChevronRight size={18} style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none', color: '#9CA3AF' }} />
                                              ) : (
                                                isSelected && <CheckCircle2 size={16} />
                                              )}
                                              {isLocked && !isSelected && !isGroup && <Lock size={12} />}
                                              {isDeployed && !isGroup && <CheckCircle2 size={16} style={{ color: '#34D399' }} />}
                                            </div>
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: isSubModule ? '0.85rem' : '0.9rem' }}>
                                              {m.title}
                                              {isLocked && <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, background: 'rgba(0, 240, 255, 0.1)', color: '#00F0FF', padding: '2px 6px', borderRadius: '4px' }}>Pro</span>}
                                            </h4>
                                          </div>
                                          <p className="module-desc" style={{ fontSize: isSubModule ? '0.75rem' : '0.8rem' }}>{m.description}</p>
                                        </div>
                                        
                                        {isSelected && !isLocked && !isGroup && m.id !== 'ecom_woocommerce' && m.category !== 'Hotel Booking Engines' && (
                                          <div className="module-settings" onClick={(e) => e.stopPropagation()} style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                                              Trigger on specific Page URL (Optional)
                                            </label>
                                            <input
                                              type="text"
                                              className="input-field"
                                              placeholder={`e.g. https://example.com/wedding or /wedding`}
                                              value={moduleConfigs[m.id]?.pagePath || ''}
                                              onChange={(e) => setModuleConfigs({
                                                ...moduleConfigs,
                                                [m.id]: { ...moduleConfigs[m.id], pagePath: e.target.value }
                                              })}
                                              style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                                            />
                                            <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.35rem', margin: '0.35rem 0 0 0' }}>
                                              Leave blank to trigger {m.title} on all pages.
                                            </p>
                                          </div>
                                        )}
                                        {isSelected && !isLocked && !isGroup && m.id === 'ecom_woocommerce' && (
                                          <div className="module-settings" onClick={(e) => e.stopPropagation()} style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#E5E7EB', cursor: 'pointer' }}>
                                              <input 
                                                type="checkbox" 
                                                checked={moduleConfigs[m.id]?.injectDataLayer || false}
                                                onChange={(e) => setModuleConfigs({
                                                  ...moduleConfigs,
                                                  [m.id]: { ...moduleConfigs[m.id], injectDataLayer: e.target.checked }
                                                })}
                                                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#00F0FF' }}
                                              />
                                              Inject Data Layer via GTM (No Plugin Required)
                                            </label>
                                            <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.35rem', marginLeft: '24px' }}>
                                              Automatically deploys a dynamic script to push standard e-commerce events (like GTM4WP).
                                            </p>
                                          </div>
                                        )}
                                        {isSelected && !isLocked && !isGroup && m.id !== 'ecom_woocommerce' && m.category !== 'Hotel Booking Engines' && (fbPixelId || googleAdsId) && (
                                          <div className="module-settings" onClick={(e) => e.stopPropagation()} style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {fbPixelId && (
                                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#E5E7EB', cursor: 'pointer' }}>
                                                <input 
                                                  type="checkbox" 
                                                  checked={moduleConfigs[m.id]?.enableFb || false}
                                                  onChange={(e) => setModuleConfigs({
                                                    ...moduleConfigs,
                                                    [m.id]: { ...moduleConfigs[m.id], enableFb: e.target.checked }
                                                  })}
                                                  style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#00F0FF' }}
                                                />
                                                Deploy Facebook Event
                                              </label>
                                            )}
                                            {googleAdsId && (
                                              <>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#E5E7EB', cursor: 'pointer' }}>
                                                  <input 
                                                    type="checkbox" 
                                                    checked={moduleConfigs[m.id]?.enableAds || false}
                                                    onChange={(e) => setModuleConfigs({
                                                      ...moduleConfigs,
                                                      [m.id]: { ...moduleConfigs[m.id], enableAds: e.target.checked }
                                                    })}
                                                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#00F0FF' }}
                                                  />
                                                  Deploy Google Ads Event
                                                </label>
                                                {moduleConfigs[m.id]?.enableAds && (
                                                  <div style={{ marginLeft: '24px', marginTop: '0.25rem' }}>
                                                    <input
                                                      type="text"
                                                      className="input-field"
                                                      placeholder="Conversion Label (e.g. aBcDeFgHiJkL)"
                                                      value={moduleConfigs[m.id]?.adsLabel || ''}
                                                      onChange={(e) => setModuleConfigs({
                                                        ...moduleConfigs,
                                                        [m.id]: { ...moduleConfigs[m.id], adsLabel: e.target.value }
                                                      })}
                                                      style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                                                    />
                                                  </div>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </motion.div>
                                      {isExpanded && (
                                        <div style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                           {m.subModules.map((sub: any) => renderModule({...sub, category: m.category}, true))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                  };
                                  return renderModule(m);
                                })}
                      </div>
                      {category === 'Website Builders & General' && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                          <label className="module-label" style={{ display: 'block', margin: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <FileText className="w-4 h-4 mr-2 text-gray-400" />
                              <span style={{ fontWeight: 600 }}>Custom Form Event Names (Optional)</span>
                            </div>
                            <div className="input-wrapper" style={{ maxWidth: '100%', marginTop: '0.5rem' }}>
                              <input 
                                type="text" 
                                placeholder="e.g. Event rfp, Newsletter submit" 
                                value={customFormEventsText}
                                onChange={(e) => setCustomFormEventsText(e.target.value)}
                                className="module-input"
                                style={{ paddingLeft: '1rem' }}
                              />
                            </div>
                            <span className="mod-desc" style={{ display: 'block', marginTop: '0.75rem', color: '#94a3b8' }}>
                              Generates a GA4 tag and trigger. We automatically format your text and ensure it ends with "_submission" (e.g., "Event rfp" becomes "event_rfp_submission").
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="bulk-actions">
                <button 
                  onClick={handleBulkDeploy} 
                  disabled={deploying || !selectedWorkspace || (selectedModules.size === 0 && customFormEventsText.trim().length === 0 && (!isNewGtmConfig || verifyStatus !== 'not_configured'))}
                  className="btn-oauth"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Play className="w-5 h-5 inline" style={{ marginRight: '0.5rem' }} />
                  {deploying ? `Deploying... ${progress}%` : `Deploy Selected`}
                </button>

                {deployStatus === 'success' && (
                  <span className="status-msg success">
                    <CheckCircle2 className="w-5 h-5 inline" style={{ marginRight: '0.5rem' }} /> Deployed successfully
                  </span>
                )}
                {deployStatus === 'error' && (
                  <span className="status-msg error" style={{ maxWidth: '500px', fontSize: '0.875rem' }}>
                    <ShieldAlert className="w-5 h-5 inline mr-1 flex-shrink-0" style={{ minWidth: '1.25rem' }} /> Deployment failed: {deployErrorMsg}
                  </span>
                )}
              </div>

              {/* Deployment Logs Terminal */}
              {(deploymentLogs.length > 0 || deploying) && (
                <div className="deployment-terminal">
                  <div className="terminal-header">
                    <span>Deployment Logs</span>
                    <Activity className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="terminal-content">
                    {deploymentLogs.map((log, i) => (
                      <div key={i} className={`log-entry log-${log.status}`}>
                        <span className="log-time">[{new Date().toLocaleTimeString()}]</span>
                        <span className="log-msg">{log.message}</span>
                      </div>
                    ))}
                    {deploying && (
                      <div className="log-entry log-info blink">
                        <span className="log-time">[{new Date().toLocaleTimeString()}]</span>
                        <span className="log-msg">...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Audits Section */}
            <div className="recent-audits-card">
              <div className="recent-audits-header">
                <FileText className="w-5 h-5 text-blue-400 mr-2" />
                <h3 className="section-title" style={{ margin: 0 }}>Recent Audits</h3>
              </div>
              
              {recentAudits.length === 0 ? (
                <p className="no-audits-msg">No audits run yet. Run your first audit above!</p>
              ) : (
                <>
                  <div className="audits-list" style={{ minHeight: '550px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {recentAudits.slice((auditCurrentPage - 1) * AUDITS_PER_PAGE, auditCurrentPage * AUDITS_PER_PAGE).map((audit) => (
                      <div key={audit.id} className="audit-list-item">
                      <div className="audit-info">
                        <span className="audit-gtm-id">{audit.gtmId}</span>
                        <span className="audit-date">{new Date(audit.createdAt).toLocaleString()}</span>
                      </div>
                      
                      <div className="audit-score-info">
                        <div className={`health-badge badge-${audit.healthScore >= 90 ? 'excellent' : audit.healthScore >= 70 ? 'good' : 'poor'}`}>
                          Score: {audit.healthScore}%
                        </div>
                        <span className="issue-count">{audit.issueCount} Issues</span>
                      </div>

                      <button 
                        className="btn-view-audit"
                        onClick={() => handleViewHistoricalAudit(audit)}
                      >
                        View Report <ChevronRight className="w-4 h-4 ml-1 inline" />
                      </button>
                    </div>
                  ))}
                  </div>
                  {Math.ceil(recentAudits.length / AUDITS_PER_PAGE) > 1 && (
                    <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1.5rem', gap: '1rem' }}>
                      <button
                        onClick={() => setAuditCurrentPage(p => Math.max(1, p - 1))}
                        disabled={auditCurrentPage === 1}
                        style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', color: auditCurrentPage === 1 ? '#6B7280' : '#fff', cursor: auditCurrentPage === 1 ? 'not-allowed' : 'pointer', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s ease' }}
                      >
                        Previous
                      </button>
                      <span style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>
                        Page {auditCurrentPage} of {Math.ceil(recentAudits.length / AUDITS_PER_PAGE)}
                      </span>
                      <button
                        onClick={() => setAuditCurrentPage(p => Math.min(Math.ceil(recentAudits.length / AUDITS_PER_PAGE), p + 1))}
                        disabled={auditCurrentPage === Math.ceil(recentAudits.length / AUDITS_PER_PAGE)}
                        style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', color: auditCurrentPage === Math.ceil(recentAudits.length / AUDITS_PER_PAGE) ? '#6B7280' : '#fff', cursor: auditCurrentPage === Math.ceil(recentAudits.length / AUDITS_PER_PAGE) ? 'not-allowed' : 'pointer', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s ease' }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};
