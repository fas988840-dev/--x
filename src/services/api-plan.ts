export type ApiPlanName = 'free' | 'pro' | 'business' | 'enterprise';

export interface ApiPlan {
  name: ApiPlanName;
  monthlyRequestLimit: number | null;
  maxConcurrentStreams: number;
  support: 'community' | 'standard' | 'priority' | 'custom';
}

export const API_PLANS: Record<ApiPlanName, ApiPlan> = {
  free: { name: 'free', monthlyRequestLimit: 1_000, maxConcurrentStreams: 1, support: 'community' },
  pro: { name: 'pro', monthlyRequestLimit: 25_000, maxConcurrentStreams: 3, support: 'standard' },
  business: { name: 'business', monthlyRequestLimit: 250_000, maxConcurrentStreams: 10, support: 'priority' },
  enterprise: { name: 'enterprise', monthlyRequestLimit: null, maxConcurrentStreams: 50, support: 'custom' },
};

export interface ApiKeyEntitlement {
  apiKey: string;
  plan: ApiPlanName;
}

export function parseApiKeyPlans(raw: string | undefined): Map<string, ApiPlanName> {
  const result = new Map<string, ApiPlanName>();
  if (!raw) return result;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return result;

    for (const [apiKey, plan] of Object.entries(parsed)) {
      if (!apiKey.trim()) continue;
      if (plan === 'free' || plan === 'pro' || plan === 'business' || plan === 'enterprise') {
        result.set(apiKey, plan);
      }
    }
  } catch {
    return result;
  }

  return result;
}

/**
 * Resolves a configured API key to a commercial entitlement. Existing keys
 * remain backwards-compatible: a key present in API_KEYS but absent from the
 * plan map receives the free entitlement rather than an invented paid plan.
 */
export function resolveApiKeyEntitlement(
  providedKey: string | undefined,
  configuredKeys: string[],
  planMap: Map<string, ApiPlanName>
): ApiKeyEntitlement | null {
  if (!providedKey || !configuredKeys.includes(providedKey)) return null;
  return { apiKey: providedKey, plan: planMap.get(providedKey) ?? 'free' };
}

export interface UsageSnapshot {
  apiKey: string;
  period: string;
  requests: number;
}

export interface UsageStore {
  increment(apiKey: string, period: string): number;
  get(apiKey: string, period: string): number;
}

/**
 * Development/test meter only. Production billing must use a durable store so
 * service restarts cannot reset usage or create an entitlement bypass.
 */
export class InMemoryUsageStore implements UsageStore {
  private readonly counts = new Map<string, number>();

  increment(apiKey: string, period: string): number {
    const key = `${period}:${apiKey}`;
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return next;
  }

  get(apiKey: string, period: string): number {
    return this.counts.get(`${period}:${apiKey}`) ?? 0;
  }
}

export function usagePeriod(timestamp = new Date()): string {
  return `${timestamp.getUTCFullYear()}-${String(timestamp.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function isWithinPlanLimit(plan: ApiPlan, requestCount: number): boolean {
  return plan.monthlyRequestLimit === null || requestCount <= plan.monthlyRequestLimit;
}
