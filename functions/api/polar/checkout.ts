import { isValidEmail, verifyClerkAuth } from '../_security';
import {
  computeCustomPlanAmountCents,
  getPolarApiBase,
  normalizePolarProduct
} from './_shared';

export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const auth = await verifyClerkAuth(request, env);
    if (!auth || !auth.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const clerkUserId = auth.userId;

    const body: any = await request.json().catch(() => ({}));
    const tier = (body.tier === 'custom' ? 'custom' : 'pro') as 'pro' | 'custom';
    const rawContainers = parseInt(String(body.containers ?? ''), 10);
    const containers =
      tier === 'custom'
        ? Math.max(10, Math.min(100, Number.isFinite(rawContainers) ? rawContainers : 10))
        : 10;
    const requestedProductId = typeof body.productId === 'string' ? body.productId.trim() : '';

    let userEmail = auth.email;
    try {
      const dbResult: any = await env.DB.prepare('SELECT email FROM users WHERE id = ?')
        .bind(clerkUserId)
        .first();
      if (dbResult?.email && isValidEmail(dbResult.email)) {
        userEmail = dbResult.email;
      }
    } catch (_) {}

    const reqUrl = new URL(request.url);
    const isLocal = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1';
    const originBase = isLocal ? reqUrl.origin : 'https://app.gtmobserver.com';
    const successUrl = `${originBase}/onboarding?checkout=success&checkout_id={CHECKOUT_ID}`;
    const returnUrl = `${originBase}/billing?checkout=cancelled`;

    const polarToken = env.POLAR_ACCESS_TOKEN;
    if (!polarToken) {
      return new Response(
        JSON.stringify({
          error: 'Polar payment processing is not configured.',
          requiresConfig: true
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const polarApiBase = getPolarApiBase(env);
    const polarHeaders = {
      Authorization: `Bearer ${polarToken}`,
      Accept: 'application/json'
    };

    const allowedProductIds = new Set<string>();
    if (env.POLAR_PRODUCT_PRO_ID) allowedProductIds.add(String(env.POLAR_PRODUCT_PRO_ID).trim());
    if (env.POLAR_PRODUCT_CUSTOM_ID) allowedProductIds.add(String(env.POLAR_PRODUCT_CUSTOM_ID).trim());

    let resolvedProductId =
      tier === 'custom'
        ? String(env.POLAR_PRODUCT_CUSTOM_ID || env.POLAR_PRODUCT_PRO_ID || '').trim()
        : String(env.POLAR_PRODUCT_PRO_ID || '').trim();

    if (requestedProductId && allowedProductIds.has(requestedProductId)) {
      resolvedProductId = requestedProductId;
    }

    let fetchedProductRaw: any = null;
    if (env.POLAR_ORGANIZATION_ID || !resolvedProductId || requestedProductId) {
      try {
        const query = new URLSearchParams({ is_archived: 'false', limit: '50' });
        if (env.POLAR_ORGANIZATION_ID) {
          query.set('organization_id', String(env.POLAR_ORGANIZATION_ID).trim());
        }
        const prodRes = await fetch(`${polarApiBase}/products/?${query.toString()}`, {
          headers: polarHeaders
        });
        if (prodRes.ok) {
          const prodData: any = await prodRes.json();
          const items: any[] = Array.isArray(prodData.items)
            ? prodData.items
            : Array.isArray(prodData)
            ? prodData
            : [];
          for (const item of items) {
            if (item?.id) allowedProductIds.add(item.id);
          }
          if (requestedProductId && allowedProductIds.has(requestedProductId)) {
            resolvedProductId = requestedProductId;
          }
          if (!resolvedProductId) {
            const match =
              tier === 'custom'
                ? items.find((p: any) => p.name?.toLowerCase().includes('custom'))
                : items.find((p: any) => p.name?.toLowerCase().includes('pro'));
            resolvedProductId = match?.id || items[0]?.id || '';
          }
          fetchedProductRaw = items.find((p: any) => p.id === resolvedProductId) || null;
        }
      } catch (err) {
        console.warn('Polar product lookup notice:', err);
      }
    }

    if (!resolvedProductId) {
      return new Response(
        JSON.stringify({
          error: 'No Polar product found for this subscription tier.',
          requiresConfig: true
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!fetchedProductRaw) {
      try {
        const singleRes = await fetch(
          `${polarApiBase}/products/${encodeURIComponent(resolvedProductId)}`,
          { headers: polarHeaders }
        );
        if (singleRes.ok) {
          fetchedProductRaw = await singleRes.json().catch(() => null);
        }
      } catch (_) {}
    }

    const checkoutBody: any = {
      products: [resolvedProductId],
      external_customer_id: clerkUserId,
      success_url: successUrl,
      return_url: returnUrl,
      metadata: {
        clerkUserId,
        tier,
        containers: String(containers),
        productId: resolvedProductId
      }
    };

    if (userEmail && isValidEmail(userEmail)) {
      checkoutBody.customer_email = userEmail;
    }

    // Only pass custom amount when the Polar product's price type is actually 'custom' (Pay What You Want)
    if (fetchedProductRaw) {
      const norm = normalizePolarProduct(fetchedProductRaw, env);
      if (norm.amountType === 'custom' && tier === 'custom') {
        let cents = computeCustomPlanAmountCents(containers);
        if (typeof norm.minimumAmount === 'number') {
          cents = Math.max(cents, norm.minimumAmount);
        }
        if (typeof norm.maximumAmount === 'number') {
          cents = Math.min(cents, norm.maximumAmount);
        }
        checkoutBody.amount = cents;
      }
    }

    const checkoutRes = await fetch(`${polarApiBase}/checkouts/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${polarToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(checkoutBody)
    });

    if (!checkoutRes.ok) {
      const errText = await checkoutRes.text();
      console.error('Polar checkout creation failed:', checkoutRes.status, errText);
      let errMsg = 'Failed to create checkout session with Polar';
      try {
        const parsedErr = JSON.parse(errText);
        errMsg = parsedErr.detail || parsedErr.message || parsedErr.error || errMsg;
      } catch (_) {}
      return new Response(JSON.stringify({ error: errMsg }), {
        status: checkoutRes.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sessionData: any = await checkoutRes.json();
    const checkoutUrl = sessionData.url || sessionData.checkout_url;

    if (!checkoutUrl) {
      return new Response(
        JSON.stringify({ error: 'Polar checkout did not return a valid checkout URL' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ url: checkoutUrl, checkoutId: sessionData.id || null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Checkout error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
