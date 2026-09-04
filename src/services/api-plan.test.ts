import { describe, expect, it } from 'vitest';
import {
  API_PLANS,
  InMemoryUsageStore,
  isWithinPlanLimit,
  parseApiKeyPlans,
  resolveApiKeyEntitlement,
  usagePeriod,
} from './api-plan.js';

describe('API plans', () => {
  it('parses only known plan names', () => {
    const map = parseApiKeyPlans(JSON.stringify({ a: 'pro', b: 'bogus', c: 'enterprise' }));
    expect(map.get('a')).toBe('pro');
    expect(map.has('b')).toBe(false);
    expect(map.get('c')).toBe('enterprise');
  });

  it('defaults a configured key to free when no paid entitlement is present', () => {
    expect(resolveApiKeyEntitlement('key-1', ['key-1'], new Map())).toEqual({ apiKey: 'key-1', plan: 'free' });
    expect(resolveApiKeyEntitlement('missing', ['key-1'], new Map())).toBeNull();
  });

  it('tracks usage by key and UTC month', () => {
    const store = new InMemoryUsageStore();
    const period = usagePeriod(new Date('2026-09-04T09:00:00Z'));
    expect(period).toBe('2026-09');
    expect(store.increment('key', period)).toBe(1);
    expect(store.increment('key', period)).toBe(2);
    expect(store.get('key', period)).toBe(2);
  });

  it('enforces finite plan limits and permits enterprise unlimited usage', () => {
    expect(isWithinPlanLimit(API_PLANS.free, 1_000)).toBe(true);
    expect(isWithinPlanLimit(API_PLANS.free, 1_001)).toBe(false);
    expect(isWithinPlanLimit(API_PLANS.enterprise, Number.MAX_SAFE_INTEGER)).toBe(true);
  });
});
