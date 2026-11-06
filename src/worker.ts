
import { Hono } from 'hono';

import * as route_0 from '../functions/api/auth/google/callback.ts';
import * as route_1 from '../functions/api/auth/google/login.ts';
import * as route_2 from '../functions/api/auth/status.ts';
import * as route_4 from '../functions/api/contact.ts';
import * as route_5 from '../functions/api/ga4/cron.ts';
import * as route_6 from '../functions/api/ga4/monitors.ts';
import * as route_7 from '../functions/api/ga4/properties.ts';
import * as route_8 from '../functions/api/ga4/report.ts';
import * as route_test from '../functions/api/ga4/test.ts';
import * as route_9 from '../functions/api/gtm/accounts.ts';
import * as route_10 from '../functions/api/gtm/audit-logs.ts';
import * as route_11 from '../functions/api/gtm/audit.ts';
import * as route_12 from '../functions/api/gtm/containers.ts';
import * as route_13 from '../functions/api/gtm/deploy-item.ts';
import * as route_14 from '../functions/api/gtm/generate.ts';
import * as route_15 from '../functions/api/gtm/templates/basic.ts';
import * as route_16 from '../functions/api/gtm/templates/ihotelier.ts';
import * as route_17 from '../functions/api/gtm/templates/mews.ts';
import * as route_18 from '../functions/api/gtm/templates/safara.ts';
import * as route_19 from '../functions/api/gtm/templates/synxis.ts';
import * as route_20 from '../functions/api/gtm/templates/windsurfer.ts';
import * as route_21 from '../functions/api/gtm/templates/woocommerce.ts';
import * as route_22 from '../functions/api/gtm/verify-config.ts';
import * as route_23 from '../functions/api/gtm/workspaces.ts';
import * as route_24 from '../functions/api/newsletter.js';
import * as route_25 from '../functions/api/stripe/checkout.ts';
import * as route_26 from '../functions/api/stripe/webhook.ts';
import * as route_27 from '../functions/api/user/me.ts';
import * as route_28 from '../functions/api/user/track-deployment.ts';
import * as route_polar_checkout from '../functions/api/polar/checkout.ts';
import * as route_polar_webhook from '../functions/api/polar/webhook.ts';

const routes = {
  '/api/auth/google/callback': route_0,
  '/api/auth/google/login': route_1,
  '/api/auth/status': route_2,
  '/api/contact': route_4,
  '/api/ga4/cron': route_5,
  '/api/ga4/monitors': route_6,
  '/api/ga4/properties': route_7,
  '/api/ga4/report': route_8,
  '/api/ga4/test': route_test,
  '/api/gtm/accounts': route_9,
  '/api/gtm/audit-logs': route_10,
  '/api/gtm/audit': route_11,
  '/api/gtm/containers': route_12,
  '/api/gtm/deploy-item': route_13,
  '/api/gtm/generate': route_14,
  '/api/gtm/templates/basic': route_15,
  '/api/gtm/templates/ihotelier': route_16,
  '/api/gtm/templates/mews': route_17,
  '/api/gtm/templates/safara': route_18,
  '/api/gtm/templates/synxis': route_19,
  '/api/gtm/templates/windsurfer': route_20,
  '/api/gtm/templates/woocommerce': route_21,
  '/api/gtm/verify-config': route_22,
  '/api/gtm/workspaces': route_23,
  '/api/newsletter': route_24,
  '/api/stripe/checkout': route_25,
  '/api/stripe/webhook': route_26,
  '/api/polar/checkout': route_polar_checkout,
  '/api/polar/webhook': route_polar_webhook,
  '/api/user/me': route_27,
  '/api/user/track-deployment': route_28,
};


const app = new Hono();

for (const [route, module] of Object.entries(routes)) {
  const handler = async (c) => {
    const context = {
      request: c.req.raw,
      env: c.env,
      params: c.req.param(),
      waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx)
    };
    
    if (c.req.method === 'GET' && module.onRequestGet) {
      return module.onRequestGet(context);
    }
    if (c.req.method === 'POST' && module.onRequestPost) {
      return module.onRequestPost(context);
    }
    if (module.onRequest) {
      return module.onRequest(context);
    }
    return c.json({ error: 'Method not allowed' }, 405);
  };
  
  app.all(route, handler);
}


app.get('*', async (c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: 'API route not found' }, 404);
  }
  const url = new URL(c.req.url);

  // Canonical redirect from dashboard.gtmobserver.com -> app.gtmobserver.com
  if (url.hostname === 'dashboard.gtmobserver.com') {
    url.hostname = 'app.gtmobserver.com';
    return c.redirect(url.toString(), 301);
  }

  // If visiting an app route on the marketing domain, redirect to app.gtmobserver.com
  if (url.hostname === 'gtmobserver.com' || url.hostname === 'www.gtmobserver.com') {
    const appRoutes = ['/dashboard', '/observer', '/projects', '/analytics', '/settings', '/support'];
    if (appRoutes.some(r => url.pathname === r || url.pathname.startsWith(r + '/'))) {
      url.hostname = 'app.gtmobserver.com';
      return c.redirect(url.toString(), 302);
    }
  }

  // Try fetching direct static asset (e.g. /robots.txt, /sitemap.xml, /llms.txt, etc.)
  const assetRes = await c.env.ASSETS.fetch(c.req.raw);
  if (assetRes.status !== 404) {
    return assetRes;
  }

  url.pathname = '/';
  return c.env.ASSETS.fetch(new Request(url.toString(), c.req.raw));
});

export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    // Migrate the CRON trigger logic here
    const cronModule = routes['/api/ga4/cron'];
    if (cronModule && cronModule.onRequestGet) {
        // Mock a request just to satisfy the function signature
        const request = new Request('https://gtmobserver.com/api/ga4/cron?token=' + (env.CRON_SECRET || ''));
        const context = {
            request,
            env,
            params: {},
            waitUntil: ctx.waitUntil.bind(ctx)
        };
        await cronModule.onRequestGet(context);
    }
  }
};
