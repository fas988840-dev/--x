/**
 * Core domain types for Solana wallet intelligence platform.
 * Represents immutable blockchain facts and deterministic analysis.
 *
 * CRITICAL: All blockchain amounts kept as strings/bigint to avoid precision loss.
 * NEVER use JavaScript number for blockchain data except normalized human-readable display.
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Base58 alphabet for validation
 */
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Validate base58 string using proper base58 character check
 */
function isValidBase58(str: string): boolean {
  if (str.length === 0) return false;
  return /^[1-9A-HJ-NP-Z]+$/.test(str);
}

/**
 * Wallet address - validated using Solana's PublicKey
 */
export type WalletAddress = string & { readonly __brand: 'WalletAddress' };

export function validateWalletAddress(addr: string): WalletAddress {
  try {
    // Use Solana's official PublicKey validation
    new PublicKey(addr);
    return addr as WalletAddress;
  } catch (_error) {
    throw new Error(`Invalid wallet address: ${addr}`);
  }
}

/**
 * Transaction signature - validated as valid base58 Solana signature
 * Solana signatures are typically 88 chars but we validate base58 format instead of fixed length
 */
export type TransactionSignature = string & { readonly __brand: 'TransactionSignature' };

export function validateTransactionSignature(sig: string): TransactionSignature {
  try {
    if (!isValidBase58(sig)) {
      throw new Error('Invalid base58 format');
    }
    // Solana signatures should decode to 64 bytes
    if (sig.length < 40 || sig.length > 90) {
      throw new Error('Signature length out of expected range');
    }
    return sig as TransactionSignature;
  } catch (error) {
    throw new Error(`Invalid transaction signature: ${sig}. ${error instanceof Error ? error.message : ''}`);
  }
}

/**
 * Token mint address - validated using Solana's PublicKey
 */
export type TokenMint = string & { readonly __brand: 'TokenMint' };

export function validateTokenMint(mint: string): TokenMint {
  try {
    new PublicKey(mint);
    return mint as TokenMint;
  } catch (_error) {
    throw new Error(`Invalid token mint: ${mint}`);
  }
}

/**
 * Program ID (smart contract address) - validated using Solana's PublicKey
 */
export type ProgramId = string & { readonly __brand: 'ProgramId' };

export function validateProgramId(id: string): ProgramId {
  try {
    new PublicKey(id);
    return id as ProgramId;
  } catch (_error) {
    throw new Error(`Invalid program ID: ${id}`);
  }
}

/**
 * Transaction meta - immutable blockchain facts
 * blockTime can be null per Solana RPC spec
 * fee stored as string to avoid precision loss
 */
export interface TransactionMeta {
  signature: TransactionSignature;
  slot: number;
  blockTime: number | null; // Unix timestamp, null if unavailable
  status: 'success' | 'failed' | 'unknown';
  fee: string; // Lamports as string to avoid precision loss, 'unknown' if unavailable
  logMessages: string[];
}

/**
 * Instruction - decoded from transaction
 */
export interface Instruction {
  programId: ProgramId;
  data: Buffer;
  accounts: Array<{
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }>;
}

/**
 * Parsed instruction with identified program type
 */
export type ParsedInstructionStatus = 'success' | 'failed' | 'unknown' | 'candidate';

export interface ParsedInstruction {
  programId: ProgramId;
  programName: string; // e.g., "Raydium", "Jupiter", "Marinade", "Unknown"
  instructionType: string; // e.g., "Swap", "AddLiquidity", "Initialize"
  status: ParsedInstructionStatus;
  decoded: Record<string, unknown> | null; // Decoded instruction data or null if unknown
  raw: Instruction;
}

/**
 * Token with metadata
 */
export interface Token {
  mint: TokenMint;
  symbol: string | null; // "SOL", "USDC", null if unknown
  decimals: number; // 6 for most tokens, 9 for SOL (lamports)
  name: string | null;
}

/**
 * Token balance change with high precision
 * CRITICAL: amount kept as string to avoid precision loss
 * amountNormalized is null when exact conversion cannot be safely represented
 */
export interface TokenBalanceDelta {
  token: Token;
  amount: string; // Raw amount as string (e.g., "1000000000" for 1 SOL with 9 decimals)
  amountDecimals: number; // Decimal places for this token
  amountNormalized: number | null; // Human-readable decimal (amount / 10^decimals), null if exact conversion unsafe
  direction: 'in' | 'out' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Swap detection - candidate or confirmed
 */
export type SwapStatus = 'confirmed' | 'candidate' | 'unknown';

export interface SwapEvent {
  signature: TransactionSignature;
  blockTime: number | null;
  status: SwapStatus;
  programId: ProgramId;
  programName: string;
  inputToken: TokenBalanceDelta;
  outputToken: TokenBalanceDelta;
  inputUSD: number | null; // null if price unavailable
  outputUSD: number | null; // null if price unavailable
  priceImpact: number | null; // Percentage, null if price unavailable
  fee: string; // Lamports as string
}

/**
 * Behavioral metrics - deterministic from chain data
 */
export interface BehaviorMetrics {
  transactionCount: number;
  successTransactionCount: number;
  failedTransactionCount: number;
  failureRate: number; // 0-1
  swapCount: number;
  uniqueTokens: number;
  uniqueProgramsInteracted: number;
  totalVolumeUSD: number | null; // null if prices unavailable
  firstActiveSlot: number;
  lastActiveSlot: number;
  averageTransactionIntervalSeconds: number;
  peakActivityHour: number; // 0-23
}

/**
 * Risk factors - transparent, deterministic
 */
export interface RiskFactors {
  failureRateScore: number; // 0-100, higher = riskier
  frequencyScore: number; // 0-100, based on txn count
  concentrationScore: number; // 0-100, based on program concentration
  volatilityScore: number; // 0-100, based on token diversity
  suspiciousPatternScore: number; // 0-100, based on timing
}

/**
 * Intelligence score - transparent components
 */
export interface IntelligenceScore {
  score: number; // 0-100
  components: {
    activity: number; // 0-100, based on frequency and diversity
    sophistication: number; // 0-100, based on program types used
    consistency: number; // 0-100, based on pattern regularity
    efficiency: number; // 0-100, based on success rate
  };
  factors: string[]; // Human-readable factors
}

/**
 * Risk score - transparent, NOT financial advice
 */
export interface RiskScore {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high';
  factors: RiskFactors;
  reasoning: string[]; // Deterministic factors only
}

/**
 * AI explanation based on evidence
 */
export interface AIExplanation {
  summary: string; // Concise behavioral summary
  keyActivities: string[]; // Top activities observed
  riskAssessment: string; // Based on deterministic risk score
  patterns: string[]; // Identified patterns from data
  disclaimer: string; // Reminder that this is not financial advice
}

/**
 * Alert - triggered by observable events
 */
export type AlertType =
  | 'unusual_volume'
  | 'abnormal_frequency'
  | 'high_failure_rate'
  | 'high_risk_behavior'
  | 'large_swap'
  | 'new_token_interaction'
  | 'program_concentration';

export interface Alert {
  id: string; // UUID
  walletAddress: WalletAddress;
  timestamp: number; // Unix timestamp
  type: AlertType;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  evidence: string[]; // Deterministic facts supporting alert
  relevantTransaction?: TransactionSignature;
}

/**
 * Track record - historical signal + outcome
 */
export interface TrackRecord {
  id: string; // UUID
  walletAddress: WalletAddress;
  timestamp: number; // When signal was generated
  signalType: string; // e.g., "high_risk_alert"
  evidence: string[]; // Deterministic facts
  riskScore: number; // Score at time of signal
  intelligenceScore: number; // Score at time of signal
  outcomeStatus: 'pending' | 'confirmed' | 'false_positive' | 'true_negative';
  outcomeTimestamp?: number; // When outcome was determined
  notes?: string;
}
