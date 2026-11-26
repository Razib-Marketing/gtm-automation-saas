import { verifyClerkAuth } from '../_security';
import { getPolarApiBase, normalizePolarProduct, PolarNormalizedProduct } from './_shared';

export async function onRequestGet(context: any) {
  const { request, env } = context;

  const auth = await verifyClerkAuth(request, env);
  if (!auth || !auth.userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const polarToken = env.POLAR_ACCESS_TOKEN;
  if (!polarToken) {
    return new Response(
      JSON.stringify({
        configured: false,
        organizationId: Boolean(env.POLAR_ORGANIZATION_ID),
        proProduct: null,
        customProduct: null,
        products: []
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const polarApiBase = getPolarApiBase(env);
  const headers = {
    Authorization: `Bearer ${polarToken}`,
    Accept: 'application/json'
  };

  try {
    const query = new URLSearchParams({ is_archived: 'false', limit: '50' });
    if (env.POLAR_ORGANIZATION_ID) {
      query.set('organization_id', String(env.POLAR_ORGANIZATION_ID).trim());
    }

    const rawProducts: any[] = [];
    const seenIds = new Set<string>();

    const listRes = await fetch(`${polarApiBase}/products/?${query.toString()}`, { headers });
    if (listRes.ok) {
      const listData: any = await listRes.json().catch(() => ({}));
      const items: any[] = Array.isArray(listData?.items)
        ? listData.items
        : Array.isArray(listData)
        ? listData
        : [];
      for (const item of items) {
        if (item?.id && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          rawProducts.push(item);
        }
      }
    }

    // Ensure configured explicit product IDs are also fetched directly if omitted from list
    const explicitIds = [env.POLAR_PRODUCT_PRO_ID, env.POLAR_PRODUCT_CUSTOM_ID]
      .map((id) => (id ? String(id).trim() : ''))
      .filter((id) => Boolean(id) && !seenIds.has(id));

    await Promise.all(
      explicitIds.map(async (pid) => {
        try {
          const pRes = await fetch(`${polarApiBase}/products/${encodeURIComponent(pid)}`, { headers });
          if (pRes.ok) {
            const pData: any = await pRes.json().catch(() => null);
            if (pData?.id && !seenIds.has(pData.id)) {
              seenIds.add(pData.id);
              rawProducts.push(pData);
            }
          }
        } catch (_) {}
      })
    );

    const normalized: PolarNormalizedProduct[] = rawProducts.map((p) => normalizePolarProduct(p, env));
    const proProduct =
      normalized.find((p) => env.POLAR_PRODUCT_PRO_ID && p.id === String(env.POLAR_PRODUCT_PRO_ID).trim()) ||
      normalized.find((p) => p.tier === 'pro') ||
      null;
    const customProduct =
      normalized.find((p) => env.POLAR_PRODUCT_CUSTOM_ID && p.id === String(env.POLAR_PRODUCT_CUSTOM_ID).trim()) ||
      normalized.find((p) => p.tier === 'custom') ||
      null;

    return new Response(
      JSON.stringify({
        configured: true,
        organizationId: Boolean(env.POLAR_ORGANIZATION_ID),
        proProduct,
        customProduct,
        products: normalized
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('GET /api/polar/products error:', err);
    return new Response(
      JSON.stringify({
        configured: true,
        organizationId: Boolean(env.POLAR_ORGANIZATION_ID),
        proProduct: null,
        customProduct: null,
        products: [],
        error: 'Unable to load live Polar catalog'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
