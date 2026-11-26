export interface PolarNormalizedProduct {
  id: string;
  tier: 'pro' | 'custom';
  name: string;
  description: string;
  isRecurring: boolean;
  recurringInterval: string | null;
  amountType: 'fixed' | 'custom' | 'free';
  priceAmount: number | null;
  priceCurrency: string;
  minimumAmount: number | null;
  maximumAmount: number | null;
  presetAmount: number | null;
  benefits: string[];
}

export function getPolarApiBase(env: any): string {
  const server = String(env?.POLAR_SERVER || 'production').toLowerCase().trim();
  return server === 'sandbox' ? 'https://sandbox-api.polar.sh/v1' : 'https://api.polar.sh/v1';
}

export function resolveTierFromProduct(
  env: any,
  productId?: string | null,
  fallbackMetadataTier?: string | null
): 'pro' | 'custom' {
  const pid = (productId || '').trim();
  if (pid && env?.POLAR_PRODUCT_CUSTOM_ID && pid === String(env.POLAR_PRODUCT_CUSTOM_ID).trim()) {
    return 'custom';
  }
  if (pid && env?.POLAR_PRODUCT_PRO_ID && pid === String(env.POLAR_PRODUCT_PRO_ID).trim()) {
    return 'pro';
  }
  return fallbackMetadataTier === 'custom' ? 'custom' : 'pro';
}

export function resolveWorkspaceLimit(tier: 'pro' | 'custom', containersRaw?: unknown): number {
  if (tier === 'custom') {
    const parsed = parseInt(String(containersRaw || ''), 10);
    if (Number.isFinite(parsed) && parsed >= 10) {
      return Math.min(parsed, 500);
    }
    return 25;
  }
  return 10;
}

export function computeCustomPlanAmountCents(containers: number): number {
  const clamped = Math.max(10, Math.min(100, Math.round(containers)));
  const baseCustomDollars = Math.max(149, Math.ceil(clamped * 14.9));
  const finalDollars = clamped >= 15 ? Math.floor(baseCustomDollars * 0.9) : baseCustomDollars;
  return finalDollars * 100;
}

export function normalizePolarProduct(raw: any, env: any): PolarNormalizedProduct {
  const prices: any[] = Array.isArray(raw?.prices) ? raw.prices : [];
  const activePrice =
    prices.find((p) => !p?.is_archived) || prices[0] || {};

  const rawAmountType = String(activePrice?.amount_type || 'fixed').toLowerCase();
  const amountType: 'fixed' | 'custom' | 'free' =
    rawAmountType === 'custom' ? 'custom' : rawAmountType === 'free' ? 'free' : 'fixed';

  const priceAmount =
    typeof activePrice?.price_amount === 'number'
      ? activePrice.price_amount
      : typeof activePrice?.preset_amount === 'number'
      ? activePrice.preset_amount
      : typeof activePrice?.minimum_amount === 'number'
      ? activePrice.minimum_amount
      : null;

  const isCustomByEnv =
    raw?.id && env?.POLAR_PRODUCT_CUSTOM_ID && raw.id === String(env.POLAR_PRODUCT_CUSTOM_ID).trim();
  const isProByEnv =
    raw?.id && env?.POLAR_PRODUCT_PRO_ID && raw.id === String(env.POLAR_PRODUCT_PRO_ID).trim();

  let tier: 'pro' | 'custom' = 'pro';
  if (isCustomByEnv) {
    tier = 'custom';
  } else if (isProByEnv) {
    tier = 'pro';
  } else if (
    String(raw?.name || '').toLowerCase().includes('custom') ||
    String(raw?.name || '').toLowerCase().includes('enterprise') ||
    String(raw?.name || '').toLowerCase().includes('scale')
  ) {
    tier = 'custom';
  }

  const benefits: string[] = Array.isArray(raw?.benefits)
    ? raw.benefits
        .map((b: any) => (typeof b?.description === 'string' ? b.description.trim() : ''))
        .filter(Boolean)
    : [];

  return {
    id: String(raw?.id || ''),
    tier,
    name: String(raw?.name || (tier === 'custom' ? 'Custom Enterprise Scale' : 'Pro Organization')),
    description: typeof raw?.description === 'string' ? raw.description : '',
    isRecurring: Boolean(raw?.is_recurring ?? true),
    recurringInterval: raw?.recurring_interval ? String(raw.recurring_interval) : 'month',
    amountType,
    priceAmount,
    priceCurrency: String(activePrice?.price_currency || 'usd').toLowerCase(),
    minimumAmount: typeof activePrice?.minimum_amount === 'number' ? activePrice.minimum_amount : null,
    maximumAmount: typeof activePrice?.maximum_amount === 'number' ? activePrice.maximum_amount : null,
    presetAmount: typeof activePrice?.preset_amount === 'number' ? activePrice.preset_amount : null,
    benefits
  };
}
