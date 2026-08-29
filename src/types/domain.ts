/**
 * Core domain types for Solana wallet intelligence platform.
 * Represents immutable blockchain facts and deterministic analysis.
 */

/**
 * Wallet address - validated base58
 */
export type WalletAddress = string & { readonly __brand: 'WalletAddress' };

export function validateWalletAddress(addr: string): WalletAddress {
  // Base58 validation for Solana addresses (44-44 chars typically)
  if (!/^[1-9A-HJ-NP-Z]{43,44}$/.test(addr)) {
    throw new Error(`Invalid wallet address: ${addr}`);
  }
  return addr as WalletAddress;
}

/**
 * Transaction signature - validated base58
 */
export type TransactionSignature = string & { readonly __brand: 'TransactionSignature' };

export function validateTransactionSignature(sig: string): TransactionSignature {
  // Solana signatures are 88 characters base58
  if (!/^[1-9A-HJ-NP-Z]{88}$/.test(sig)) {
    throw new Error(`Invalid transaction signature: ${sig}`);
  }
  return sig as TransactionSignature;
}

/**
 * Token mint address
 */
export type TokenMint = string & { readonly __brand: 'TokenMint' };

export function validateTokenMint(mint: string): TokenMint {
  if (!/^[1-9A-HJ-NP-Z]{43,44}$/.test(mint)) {
    throw new Error(`Invalid token mint: ${mint}`);
  }
  return mint as TokenMint;
}

/**
 * Program ID (smart contract address)
 */
export type ProgramId = string & { readonly __brand: 'ProgramId' };

export function validateProgramId(id: string): ProgramId {
  if (!/^[1-9A-HJ-NP-Z]{43,44}$/.test(id)) {
    throw new Error(`Invalid program ID: ${id}`);
  }
  return id as ProgramId;
}

/**
 * Transaction meta - immutable blockchain facts
 */
export interface TransactionMeta {
  signature: TransactionSignature;
  slot: number;
  blockTime: number; // Unix timestamp
  status: 'success' | 'failed' | 'unknown';
  fee: number; // Lamports
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
 * Token with optional metadata
 */
export interface Token {
  mint: TokenMint;
  symbol: string | null; // "SOL", "USDC", null if unknown
  decimals: number; // 6 for most tokens, 8 for SOL
  name: string | null;
}

/**
 * Token balance change with confidence
 */
export interface TokenBalanceDelta {
  token: Token;
  amount: string; // Use string to avoid floating-point errors
  amountDecimals: number; // Decimal places
  amountNormalized: number; // Human-readable decimal (amount / 10^decimals)
  direction: 'in' | 'out' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Swap detection - candidate or confirmed
 */
export type SwapStatus = 'confirmed' | 'candidate' | 'unknown';

export interface SwapEvent {
  signature: TransactionSignature;
  blockTime: number;
  status: SwapStatus;
  programId: ProgramId;
  programName: string;
  inputToken: TokenBalanceDelta;
  outputToken: TokenBalanceDelta;
  inputUSD: number | null; // null if price unavailable
  outputUSD: number | null; // null if price unavailable
  priceImpact: number | null; // Percentage, null if price unavailable
  fee: number; // Lamports
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
