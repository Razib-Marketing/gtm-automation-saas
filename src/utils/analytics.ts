// @ts-nocheck
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Safely pushes an event and arbitrary payload to window.dataLayer for Google Tag Manager
 * @param eventName Name of the event to fire in GTM (e.g. 'contact_form_submission', 'newsletter_submission')
 * @param params Additional metadata parameters to pass to GTM variables
 */
export const pushDataLayer = (eventName: string, params: Record<string, any> = {}) => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  
  // Clear previous ecommerce data per GA4 specifications
  if (params.ecommerce) {
    window.dataLayer.push({ ecommerce: null });
  }

  const payload = {
    event: eventName,
    ...params,
    event_timestamp: new Date().toISOString()
  };

  window.dataLayer.push(payload);

  // Debug log in dev mode or when URL contains ?gtm_debug=true
  if (import.meta.env.DEV || window.location.search.includes('gtm_debug')) {
    console.log('%c[GTM dataLayer.push]', 'background: #00F0FF; color: #000; font-weight: bold; padding: 2px 6px; border-radius: 4px;', payload);
  }
};
