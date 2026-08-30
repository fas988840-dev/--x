/**
 * Core domain types for Solana wallet intelligence platform.
 * Represents immutable blockchain facts and deterministic analysis.
 *
 * CRITICAL: All blockchain amounts kept as strings/bigint to avoid precision loss.
 * NEVER use JavaScript number for blockchain data except normalized human-readable display.
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Base58 alphabet for decoding validation
 */
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Decode Base58 string to bytes
 */
function decodeBase58(str: string): Buffer {
  if (str.length === 0) {
    throw new Error('Cannot decode empty Base58 string');
  }

  // Validate base58 characters
  for (const char of str) {
    if (!BASE58_ALPHABET.includes(char)) {
      throw new Error(`Invalid Base58 character: ${char}`);
    }
  }

  // Decode Base58
  let num = 0n;
  let power = 1n;

  for (let i = str.length - 1; i >= 0; i--) {
    const digit = BigInt(BASE58_ALPHABET.indexOf(str[i]));
    num += digit * power;
    power *= 58n;
  }

  // Convert to bytes
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num % 256n));
    num /= 256n;
  }

  // Handle leading zeros (encoded as '1' in Base58)
  for (const char of str) {
    if (char === '1') {
      bytes.unshift(0);
    } else {
      break;
    }
  }

  return Buffer.from(bytes);
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
 * Transaction signature - validated as valid Base58 with 64-byte decoded length
 * Solana signatures decode to exactly 64 bytes
 */
export type TransactionSignature = string & { readonly __brand: 'TransactionSignature' };

export function validateTransactionSignature(sig: string): TransactionSignature {
  try {
    // Decode Base58
    const decoded = decodeBase58(sig);

    // Solana signatures must decode to exactly 64 bytes
    if (decoded.length !== 64) {
      throw new Error(`Signature decoded to ${decoded.length} bytes, expected 64`);
    }

    return sig as TransactionSignature;
  } catch (error) {
    throw new Error(
      `Invalid transaction signature: ${sig}. ${error instanceof Error ? error.message : ''}`
    );
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
export type ParsedInstructionStatus = 'confirmed' | 'candidate' | 'unknown';

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
 * AI explanation based on evidence.
 *
 * `summary` is the only field ever generated by an LLM (ChainGPT - see
 * src/services/chaingpt-client.ts and ExplanationAgent in
 * src/agents/core_agents.ts) - and even then, only ever as a rephrasing of
 * facts already computed deterministically elsewhere in the pipeline,
 * never as an independent source of new claims. `keyActivities`,
 * `riskAssessment`, and `patterns` are always built directly from real
 * WalletIntelligenceAgent/RiskAgent output, regardless of whether the
 * LLM call succeeds. `summarySource` records which path produced
 * `summary` for this response, so a caller can tell the two apart rather
 * than assuming every summary is AI-authored.
 */
export interface AIExplanation {
  summary: string; // Concise behavioral summary
  summarySource: 'chaingpt' | 'deterministic'; // Where `summary` came from - see note above
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
