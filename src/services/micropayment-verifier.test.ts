import { describe, expect, it, vi } from 'vitest';
import { InMemoryPaymentReplayStore, MicropaymentVerifier } from './micropayment-verifier.js';
import { SolanaRpcClient } from './solana-rpc-client.js';

const SIGNATURE = '5'.repeat(88);
const RECIPIENT = '11111111111111111111111111111111';

function tx(destination = RECIPIENT, lamports = 5_000, err: unknown = null) {
  return {
    meta: { err },
    transaction: {
      message: {
        instructions: [
          {
            program: 'system',
            parsed: {
              type: 'transfer',
              info: { destination, lamports },
            },
          },
        ],
      },
    },
  };
}

function fakeRpc(status: 'processed' | 'confirmed' | 'finalized' | null, transaction: unknown) {
  return {
    getTransactionConfirmationStatus: vi.fn().mockResolvedValue(status),
    getTransaction: vi.fn().mockResolvedValue(transaction),
  } as unknown as SolanaRpcClient;
}

describe('MicropaymentVerifier', () => {
  it('accepts only a finalized successful transfer to the exact recipient', async () => {
    const verifier = new MicropaymentVerifier(fakeRpc('finalized', tx()), {
      recipient: RECIPIENT,
      minimumLamports: 1_000,
      replayStore: new InMemoryPaymentReplayStore(),
    });

    await expect(verifier.verifyAndConsume(SIGNATURE)).resolves.toEqual({
      ok: true,
      signature: SIGNATURE,
      recipient: RECIPIENT,
      lamports: 5_000,
    });
  });

  it('rejects a payment before finalization', async () => {
    const verifier = new MicropaymentVerifier(fakeRpc('confirmed', tx()), {
      recipient: RECIPIENT,
      minimumLamports: 1_000,
      replayStore: new InMemoryPaymentReplayStore(),
    });

    await expect(verifier.verifyAndConsume(SIGNATURE)).resolves.toEqual({ ok: false, reason: 'not_finalized' });
  });

  it('rejects the wrong recipient or insufficient amount', async () => {
    const wrongRecipient = new MicropaymentVerifier(fakeRpc('finalized', tx('22222222222222222222222222222222')), {
      recipient: RECIPIENT,
      minimumLamports: 1_000,
      replayStore: new InMemoryPaymentReplayStore(),
    });
    const tooSmall = new MicropaymentVerifier(fakeRpc('finalized', tx(RECIPIENT, 999)), {
      recipient: RECIPIENT,
      minimumLamports: 1_000,
      replayStore: new InMemoryPaymentReplayStore(),
    });

    await expect(wrongRecipient.verifyAndConsume(SIGNATURE)).resolves.toEqual({ ok: false, reason: 'matching_transfer_not_found' });
    await expect(tooSmall.verifyAndConsume(SIGNATURE)).resolves.toEqual({ ok: false, reason: 'matching_transfer_not_found' });
  });

  it('rejects failed transactions', async () => {
    const verifier = new MicropaymentVerifier(fakeRpc('finalized', tx(RECIPIENT, 5_000, { InstructionError: [0, 'Custom'] })), {
      recipient: RECIPIENT,
      minimumLamports: 1_000,
      replayStore: new InMemoryPaymentReplayStore(),
    });

    await expect(verifier.verifyAndConsume(SIGNATURE)).resolves.toEqual({ ok: false, reason: 'transaction_failed' });
  });

  it('prevents replay after successful consumption', async () => {
    const store = new InMemoryPaymentReplayStore();
    const verifier = new MicropaymentVerifier(fakeRpc('finalized', tx()), {
      recipient: RECIPIENT,
      minimumLamports: 1_000,
      replayStore: store,
    });

    expect((await verifier.verifyAndConsume(SIGNATURE)).ok).toBe(true);
    await expect(verifier.verifyAndConsume(SIGNATURE)).resolves.toEqual({ ok: false, reason: 'already_used' });
  });
});
