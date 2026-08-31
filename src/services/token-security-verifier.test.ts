import { describe, it, expect, vi } from 'vitest';
import {
  TokenSecurityVerifier,
  SPL_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from './token-security-verifier';
import { SolanaRpcClient } from './solana-rpc-client';
import { TokenMint } from '../types/domain';

// USDC's mint - a real, valid base58 address, used only so validateTokenMint
// accepts it. Every RPC response below is mocked; nothing here hits a network.
const MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as TokenMint;

type MintInfo = Awaited<ReturnType<SolanaRpcClient['getMintInfo']>>;

function verifierReturning(info: MintInfo): TokenSecurityVerifier {
  const rpc = { getMintInfo: vi.fn().mockResolvedValue(info) } as unknown as SolanaRpcClient;
  return new TokenSecurityVerifier(rpc);
}

const CLEAN: NonNullable<MintInfo> = {
  mintAuthority: null,
  freezeAuthority: null,
  supply: '1000000',
  decimals: 6,
  isInitialized: true,
  owningProgramId: SPL_TOKEN_PROGRAM_ID,
};

describe('TokenSecurityVerifier', () => {
  it('flags an active mint authority and names the account holding it', async () => {
    const holder = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
    const report = await verifierReturning({ ...CLEAN, mintAuthority: holder }).inspectToken(MINT);

    expect(report.assessment).toBe('FINDINGS_PRESENT');
    expect(report.findings).toContain('MINT_AUTHORITY_ACTIVE');
    expect(report.mintAuthority).toBe(holder);
    expect(report.reasoning.join(' ')).toContain(holder);
  });

  it('flags an active freeze authority', async () => {
    const holder = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
    const report = await verifierReturning({ ...CLEAN, freezeAuthority: holder }).inspectToken(MINT);

    expect(report.assessment).toBe('FINDINGS_PRESENT');
    expect(report.findings).toContain('FREEZE_AUTHORITY_ACTIVE');
  });

  it('flags Token-2022 separately, since its extensions are not read here', async () => {
    const report = await verifierReturning({
      ...CLEAN,
      owningProgramId: TOKEN_2022_PROGRAM_ID,
    }).inspectToken(MINT);

    expect(report.findings).toContain('NON_CLASSIC_TOKEN_PROGRAM');
    expect(report.reasoning.join(' ')).toMatch(/transfer (fees|hooks)/);
  });

  it('flags an uninitialised mint', async () => {
    const report = await verifierReturning({ ...CLEAN, isInitialized: false }).inspectToken(MINT);
    expect(report.findings).toContain('MINT_UNINITIALISED');
  });

  // The point of the whole file: a clean mint must not be reported as safe.
  it('never reports a clean mint as safe, only as having no findings in the checked set', async () => {
    const report = await verifierReturning(CLEAN).inspectToken(MINT);

    expect(report.findings).toEqual([]);
    expect(report.assessment).toBe('NO_FINDINGS_IN_CHECKED_SET');
    expect(JSON.stringify(report)).not.toMatch(/\bSAFE\b/);
    expect(report.reasoning.join(' ')).toContain('not a statement that the token is safe');
  });

  it('always names unchecked risks, including on a clean report', async () => {
    const report = await verifierReturning(CLEAN).inspectToken(MINT);

    expect(report.notChecked.length).toBeGreaterThan(0);
    expect(report.notChecked).toContain('liquidity_pool_depth_or_lock_status');
    expect(report.notChecked).toContain('holder_concentration_and_deployer_balance');
  });

  it('returns UNKNOWN with null fields when no mint account can be read', async () => {
    const report = await verifierReturning(null).inspectToken(MINT);

    expect(report.assessment).toBe('UNKNOWN');
    expect(report.mintAuthority).toBeNull();
    expect(report.supply).toBeNull();
    expect(report.decimals).toBeNull();
    expect(report.checked).toEqual([]);
    expect(report.findings).toEqual([]);
  });

  it('never invents a liquidity figure', async () => {
    const report = await verifierReturning(CLEAN).inspectToken(MINT);
    expect(JSON.stringify(report)).not.toMatch(/liquidityLocked/i);
  });

  it('is deterministic for identical input', async () => {
    const a = await verifierReturning(CLEAN).inspectToken(MINT);
    const b = await verifierReturning(CLEAN).inspectToken(MINT);
    expect(a).toEqual(b);
  });

  it('reports both authority findings when both are active', async () => {
    const holder = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
    const report = await verifierReturning({
      ...CLEAN,
      mintAuthority: holder,
      freezeAuthority: holder,
    }).inspectToken(MINT);

    expect(report.findings).toEqual(
      expect.arrayContaining(['MINT_AUTHORITY_ACTIVE', 'FREEZE_AUTHORITY_ACTIVE'])
    );
  });
});
