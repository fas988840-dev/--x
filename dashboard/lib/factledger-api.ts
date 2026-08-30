/**
 * Thin server-side client for the FactLedger REST API.
 *
 * Runs only in Next.js Server Components / route handlers - never in the
 * browser - so FACTLEDGER_API_KEY (if the API requires one) stays on the
 * server and is never shipped to client JS. Do not import this file from
 * a "use client" component.
 *
 * Every function returns a `{ ok: true, data }` or `{ ok: false, error }`
 * result instead of throwing across the board - callers render the error
 * state honestly rather than crash the whole page for one failed call.
 */

const API_BASE_URL = process.env.FACTLEDGER_API_URL || 'http://localhost:3000';
const API_KEY = process.env.FACTLEDGER_API_KEY; // optional - only needed if the API has API_KEYS set

export type EvidenceStatus = 'VERIFIED' | 'CANDIDATE' | 'UNKNOWN';

export interface AgentEnvelope<T> {
  agentId: string;
  timestamp: number;
  evidenceStatus: EvidenceStatus;
  confidenceScore: number;
  data: T | null;
  justification: string;
  disclaimer?: string;
}

export interface RiskScore {
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: {
    failureRateScore: number;
    frequencyScore: number;
    concentrationScore: number;
    volatilityScore: number;
    suspiciousPatternScore: number;
  };
  reasoning: string[];
}

export interface WalletAnalysisResponse {
  wallet: string;
  observableData: {
    transactionCount: number;
    successfulTransactions: number;
    failedTransactions: number;
    uniqueTokens: number;
    uniquePrograms: number;
  };
  behavior: {
    failureRate: number;
    swapCount: number;
    averageTransactionInterval: number;
    peakActivityHour: number;
    totalVolumeUSD: number | null;
  };
  intelligence: {
    score: number;
    components: { activity: number; sophistication: number; consistency: number; efficiency: number };
    factors: string[];
  };
  risk: RiskScore;
  disclaimer: string;
}

export interface EvidenceEntry {
  transactionSignature: string;
  slot: number;
  programId: string;
  programName: string;
  status: 'confirmed' | 'candidate' | 'unknown';
  confidencePercent: number;
}

export interface WalletEvidenceReport {
  wallet: string;
  transactionsExamined: number;
  transactionsSkipped: number;
  evidence: EvidenceEntry[];
}

export interface ResearchReportData {
  summary: string;
  auditTrail: string[];
}

export interface TokenBalance {
  mint: string;
  amount: string;
  decimals: number;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };

async function fetchJson<T>(path: string): Promise<ApiResult<T>> {
  try {
    const headers: Record<string, string> = {};
    if (API_KEY) headers['X-API-Key'] = API_KEY;

    const res = await fetch(`${API_BASE_URL}${path}`, { headers, cache: 'no-store' });
    const body = await res.json();

    if (!res.ok) {
      return { ok: false, error: body?.error?.message || `Request failed with status ${res.status}`, status: res.status };
    }

    return { ok: true, data: body as T };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown network error - is the API running and reachable?' };
  }
}

export function getWalletAnalysis(address: string, limit = 100): Promise<ApiResult<WalletAnalysisResponse>> {
  return fetchJson(`/api/v1/wallet/${encodeURIComponent(address)}/analysis?limit=${limit}`);
}

export function getWalletRisk(address: string, limit = 100): Promise<ApiResult<{ wallet: string; risk: RiskScore; disclaimer: string }>> {
  return fetchJson(`/api/v1/wallet/${encodeURIComponent(address)}/risk?limit=${limit}`);
}

export function getWalletEvidence(address: string, limit = 10): Promise<ApiResult<AgentEnvelope<WalletEvidenceReport> & { wallet: string }>> {
  return fetchJson(`/api/v1/wallet/${encodeURIComponent(address)}/evidence?limit=${limit}`);
}

export function getWalletResearch(address: string, limit = 100): Promise<ApiResult<AgentEnvelope<ResearchReportData> & { wallet: string }>> {
  return fetchJson(`/api/v1/wallet/${encodeURIComponent(address)}/research?limit=${limit}`);
}

export function getWalletTokens(
  address: string
): Promise<ApiResult<{ wallet: string; tokens: TokenBalance[]; evidenceStatus: EvidenceStatus; disclaimer: string }>> {
  return fetchJson(`/api/v1/wallet/${encodeURIComponent(address)}/tokens`);
}

export function getHealth(): Promise<ApiResult<{ status: string; service: string; version: string }>> {
  return fetchJson('/api/v1/health');
}
