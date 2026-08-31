/**
 * Token security verifier - reports what the mint account actually says.
 *
 * The question an agent asks before touching a token is "can I be rugged by
 * the issuer?". Two properties on the mint account answer part of that
 * directly, and both are read from chain, not inferred:
 *
 *   mintAuthority   present -> whoever holds it can mint unlimited new supply
 *   freezeAuthority present -> whoever holds it can freeze any holder's account
 *
 * WHY THIS NEVER RETURNS "SAFE"
 *
 * An earlier draft of this file returned securityRating: 'SAFE' with a
 * hardcoded liquidityLockedUsd. Two separate problems with that, and the
 * second one survives even if the data is real:
 *
 *   1. It ignored its own input and answered SAFE for every mint, including
 *      known-malicious ones.
 *   2. Even computed honestly, "SAFE" is not a conclusion these fields can
 *      support. A token can have both authorities renounced and still be a
 *      rug: the deployer may hold most of the supply, the liquidity may be
 *      unlocked, a Token-2022 transfer hook may block selling. Absence of
 *      evidence of one danger is not evidence of safety.
 *
 * So the result reports findings and names what was not checked. The nearest
 * thing to a clean bill is NO_FINDINGS_IN_CHECKED_SET, which says exactly
 * what it means: nothing was found among the checks listed in `checked`, and
 * everything in `notChecked` remains unknown. A caller that wants to treat
 * that as "safe" has to make that leap in its own code, in the open.
 *
 * This mirrors the confirmed/candidate/unknown rule the DEX adapters follow
 * (see dex-registry.ts): never collapse a distinction to make output look
 * more complete than it is.
 */

import { SolanaRpcClient } from './solana-rpc-client';
import { TokenMint } from '../types/domain';

/** The classic SPL Token program. */
export const SPL_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJsyFbPVwwQQfuM32jneSYOAxU';
/** Token-2022, which supports extensions the mint fields below do not describe. */
export const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

export type TokenSecurityFinding =
  /** Someone can still mint new supply, diluting holders at will. */
  | 'MINT_AUTHORITY_ACTIVE'
  /** Someone can freeze holder accounts, making the token unsellable for them. */
  | 'FREEZE_AUTHORITY_ACTIVE'
  /** The mint account exists but was never initialised. */
  | 'MINT_UNINITIALISED'
  /** Owned by Token-2022: extensions may add transfer fees or hooks not read here. */
  | 'NON_CLASSIC_TOKEN_PROGRAM';

export type TokenSecurityAssessment =
  /** At least one finding above applies. */
  | 'FINDINGS_PRESENT'
  /** Nothing found among `checked`. NOT a statement that the token is safe. */
  | 'NO_FINDINGS_IN_CHECKED_SET'
  /** The mint could not be read, so nothing was checked. */
  | 'UNKNOWN';

export interface TokenSecurityReport {
  mintAddress: string;
  assessment: TokenSecurityAssessment;
  findings: TokenSecurityFinding[];
  /** Verified facts, or null when the mint could not be read. */
  mintAuthority: string | null;
  freezeAuthority: string | null;
  supply: string | null;
  decimals: number | null;
  owningProgramId: string | null;
  /** Checks this report actually performed. */
  checked: string[];
  /** Risks a caller must not assume were ruled out. Never empty. */
  notChecked: string[];
  reasoning: string[];
  disclaimer: string;
}

const DISCLAIMER =
  'Reports only what the mint account states on-chain. Not a safety rating, ' +
  'not financial advice. See notChecked for risks this does not cover.';

/**
 * Risks that are real and are deliberately outside what a mint account can
 * answer. Listed on every response, including successful ones, so a caller
 * cannot read a short findings array as an all-clear.
 */
const NOT_CHECKED = [
  'liquidity_pool_depth_or_lock_status',
  'holder_concentration_and_deployer_balance',
  'token_2022_extensions_transfer_fees_and_hooks',
  'trading_restrictions_enforced_outside_the_mint',
  'contract_upgrade_authority_of_related_programs',
];

export class TokenSecurityVerifier {
  constructor(private rpcClient: SolanaRpcClient) {}

  async inspectToken(mint: TokenMint): Promise<TokenSecurityReport> {
    const info = await this.rpcClient.getMintInfo(mint);

    if (info === null) {
      return {
        mintAddress: mint,
        assessment: 'UNKNOWN',
        findings: [],
        mintAuthority: null,
        freezeAuthority: null,
        supply: null,
        decimals: null,
        owningProgramId: null,
        checked: [],
        notChecked: [...NOT_CHECKED, 'everything_above_the_mint_was_unreadable'],
        reasoning: [
          'No parseable mint account exists at this address. It may be a wallet, ' +
            'a token account rather than a mint, or an address with no account at all. ' +
            'Reporting UNKNOWN rather than assuming anything about the token.',
        ],
        disclaimer: DISCLAIMER,
      };
    }

    const findings: TokenSecurityFinding[] = [];
    const reasoning: string[] = [];

    if (info.mintAuthority !== null) {
      findings.push('MINT_AUTHORITY_ACTIVE');
      reasoning.push(
        `Mint authority is still held by ${info.mintAuthority}. That account can mint ` +
          'unlimited new supply at any time, diluting every existing holder.'
      );
    } else {
      reasoning.push('Mint authority is renounced, so total supply cannot be increased.');
    }

    if (info.freezeAuthority !== null) {
      findings.push('FREEZE_AUTHORITY_ACTIVE');
      reasoning.push(
        `Freeze authority is still held by ${info.freezeAuthority}. That account can freeze ` +
          'any holder\'s token account, making their balance unsellable.'
      );
    } else {
      reasoning.push('Freeze authority is renounced, so holder accounts cannot be frozen.');
    }

    if (!info.isInitialized) {
      findings.push('MINT_UNINITIALISED');
      reasoning.push('The mint account exists but reports itself as uninitialised.');
    }

    if (info.owningProgramId !== SPL_TOKEN_PROGRAM_ID) {
      findings.push('NON_CLASSIC_TOKEN_PROGRAM');
      reasoning.push(
        info.owningProgramId === TOKEN_2022_PROGRAM_ID
          ? 'Owned by Token-2022, which supports extensions such as transfer fees and ' +
            'transfer hooks. Those are not read here, so this report does not describe ' +
            'how the token behaves on transfer.'
          : `Owned by an unexpected program (${info.owningProgramId}) rather than the SPL ` +
            'Token program. Treat every field below as describing an unfamiliar program.'
      );
    }

    if (findings.length === 0) {
      reasoning.push(
        'No finding among the checks performed. This is not a statement that the token is ' +
          'safe — see notChecked for what remains unexamined.'
      );
    }

    return {
      mintAddress: mint,
      assessment: findings.length > 0 ? 'FINDINGS_PRESENT' : 'NO_FINDINGS_IN_CHECKED_SET',
      findings,
      mintAuthority: info.mintAuthority,
      freezeAuthority: info.freezeAuthority,
      supply: info.supply,
      decimals: info.decimals,
      owningProgramId: info.owningProgramId,
      checked: [
        'mint_authority_renounced',
        'freeze_authority_renounced',
        'mint_initialised',
        'owning_token_program',
      ],
      notChecked: NOT_CHECKED,
      reasoning,
      disclaimer: DISCLAIMER,
    };
  }
}
