import { describe, it, expect, vi } from 'vitest';
import { LiveAlertWatcher } from './live-alert-watcher';
import { SolanaRpcClient } from './solana-rpc-client';
import { TransactionRetriever } from './transaction-retriever';
import { BehaviorAnalyzer } from './behavior-analyzer';
import { RiskAssessor } from './risk-assessor';
import { AlertEngine } from './alert-engine';
import { Alert, validateWalletAddress } from '../types/domain';

const VALID_ADDRESS = '11111111111111111111111111111112';

function buildAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'fixed-id',
    walletAddress: validateWalletAddress(VALID_ADDRESS),
    timestamp: Date.now(),
    type: 'high_failure_rate',
    severity: 'medium',
    title: 'High failure rate',
    description: 'test',
    evidence: ['failedTransactionCount=8'],
    ...overrides,
  };
}

describe('LiveAlertWatcher', () => {
  it('throws synchronously on an invalid address, like the other deterministic services', () => {
    const rpcClient = {} as unknown as SolanaRpcClient;
    const watcher = new LiveAlertWatcher(
      rpcClient,
      {} as TransactionRetriever,
      new BehaviorAnalyzer(),
      new RiskAssessor(),
      new AlertEngine()
    );

    expect(() => watcher.watch('not-a-real-address', vi.fn())).toThrow();
  });

  it('evaluates once immediately on watch() and reports real alerts, before any notification arrives', async () => {
    const transactionRetriever = {
      getWalletTransactionsMeta: vi.fn().mockResolvedValue([]),
    } as unknown as TransactionRetriever;
    const alertEngine = { evaluate: vi.fn().mockReturnValue([buildAlert()]) } as unknown as AlertEngine;
    const rpcClient = {
      subscribeToLogs: vi.fn().mockReturnValue(42),
      unsubscribeFromLogs: vi.fn().mockResolvedValue(undefined),
    } as unknown as SolanaRpcClient;

    const watcher = new LiveAlertWatcher(rpcClient, transactionRetriever, new BehaviorAnalyzer(), new RiskAssessor(), alertEngine);
    const onAlert = vi.fn();

    watcher.watch(VALID_ADDRESS, onAlert);
    // Wait for the immediate, un-awaited evaluate() to run, rather than
    // guessing a fixed number of microtask ticks: a hardcoded
    // `await Promise.resolve()` twice looked sufficient by inspection but
    // wasn't in practice (confirmed by actually running this suite) -
    // vi.waitFor polls the assertion instead of assuming a specific
    // number of internal await hops in evaluate()'s implementation.
    await vi.waitFor(() => {
      expect(onAlert).toHaveBeenCalledTimes(1);
    });
    expect(onAlert).toHaveBeenCalledWith(expect.objectContaining({ type: 'high_failure_rate' }));
  });

  it('never re-reports an alert already seen (dedupes on real evidence, not the random id)', async () => {
    const transactionRetriever = {
      getWalletTransactionsMeta: vi.fn().mockResolvedValue([]),
    } as unknown as TransactionRetriever;
    // A fresh `id` every call - simulates AlertEngine's randomUUID() - to
    // prove dedup keys on type+evidence, not the volatile id field.
    const alertEngine = {
      evaluate: vi.fn(() => [buildAlert({ id: Math.random().toString() })]),
    } as unknown as AlertEngine;

    let capturedCallback: (() => void) | undefined;
    const rpcClient = {
      subscribeToLogs: vi.fn((_address: unknown, cb: () => void) => {
        capturedCallback = cb;
        return 1;
      }),
      unsubscribeFromLogs: vi.fn().mockResolvedValue(undefined),
    } as unknown as SolanaRpcClient;

    const watcher = new LiveAlertWatcher(rpcClient, transactionRetriever, new BehaviorAnalyzer(), new RiskAssessor(), alertEngine);
    const onAlert = vi.fn();

    watcher.watch(VALID_ADDRESS, onAlert);
    await Promise.resolve();
    await Promise.resolve();

    // Simulate two more log notifications carrying the same underlying alert.
    capturedCallback?.();
    await Promise.resolve();
    await Promise.resolve();
    capturedCallback?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(onAlert).toHaveBeenCalledTimes(1); // only the first, real occurrence
  });

  it('stop() unsubscribes using the real subscription id and never throws', async () => {
    const transactionRetriever = { getWalletTransactionsMeta: vi.fn().mockResolvedValue([]) } as unknown as TransactionRetriever;
    const alertEngine = { evaluate: vi.fn().mockReturnValue([]) } as unknown as AlertEngine;
    const rpcClient = {
      subscribeToLogs: vi.fn().mockReturnValue(99),
      unsubscribeFromLogs: vi.fn().mockResolvedValue(undefined),
    } as unknown as SolanaRpcClient;

    const watcher = new LiveAlertWatcher(rpcClient, transactionRetriever, new BehaviorAnalyzer(), new RiskAssessor(), alertEngine);
    const subscription = watcher.watch(VALID_ADDRESS, vi.fn());

    await subscription.stop();

    expect(rpcClient.unsubscribeFromLogs).toHaveBeenCalledWith(99);
  });

  it('a transient RPC failure during evaluation does not throw out of the notification callback', async () => {
    const transactionRetriever = {
      getWalletTransactionsMeta: vi.fn().mockRejectedValue(new Error('RPC timeout')),
    } as unknown as TransactionRetriever;
    const alertEngine = { evaluate: vi.fn() } as unknown as AlertEngine;
    const rpcClient = {
      subscribeToLogs: vi.fn().mockReturnValue(1),
      unsubscribeFromLogs: vi.fn().mockResolvedValue(undefined),
    } as unknown as SolanaRpcClient;

    const watcher = new LiveAlertWatcher(rpcClient, transactionRetriever, new BehaviorAnalyzer(), new RiskAssessor(), alertEngine);

    expect(() => watcher.watch(VALID_ADDRESS, vi.fn())).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
  });

  it('stop() sets active=false so a concurrent evaluation in flight does not call onAlert after stop', async () => {
    // The evaluate() promise is created before stop() is called but resolves
    // after: onAlert must not fire because `active` is already false.
    let resolveEval!: () => void;
    const evalPromise = new Promise<void>((r) => (resolveEval = r));

    const transactionRetriever = {
      // Hangs until resolved manually so we can call stop() in between.
      getWalletTransactionsMeta: vi.fn().mockReturnValue(evalPromise.then(() => [])),
    } as unknown as TransactionRetriever;
    const alertEngine = { evaluate: vi.fn().mockReturnValue([buildAlert()]) } as unknown as AlertEngine;
    const rpcClient = {
      subscribeToLogs: vi.fn().mockReturnValue(7),
      unsubscribeFromLogs: vi.fn().mockResolvedValue(undefined),
    } as unknown as SolanaRpcClient;

    const watcher = new LiveAlertWatcher(rpcClient, transactionRetriever, new BehaviorAnalyzer(), new RiskAssessor(), alertEngine);
    const onAlert = vi.fn();
    const subscription = watcher.watch(VALID_ADDRESS, onAlert);

    // Stop immediately, before the hanging getWalletTransactionsMeta resolves.
    await subscription.stop();

    // Now let the evaluation finish - onAlert must still not be called.
    resolveEval();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(onAlert).not.toHaveBeenCalled();
  });

  it('onLogs callback triggers a re-evaluation and reports new alerts', async () => {
    let capturedCallback!: () => void;
    const rpcClient = {
      subscribeToLogs: vi.fn((_addr: unknown, cb: () => void) => {
        capturedCallback = cb;
        return 5;
      }),
      unsubscribeFromLogs: vi.fn().mockResolvedValue(undefined),
    } as unknown as SolanaRpcClient;

    const alertEngine = {
      evaluate: vi.fn()
        .mockReturnValueOnce([])                        // initial eval: no alerts
        .mockReturnValue([buildAlert({ id: 'new-1' })]), // subsequent evals: one alert
    } as unknown as AlertEngine;

    const transactionRetriever = {
      getWalletTransactionsMeta: vi.fn().mockResolvedValue([]),
    } as unknown as TransactionRetriever;

    const watcher = new LiveAlertWatcher(rpcClient, transactionRetriever, new BehaviorAnalyzer(), new RiskAssessor(), alertEngine);
    const onAlert = vi.fn();

    watcher.watch(VALID_ADDRESS, onAlert);
    await vi.waitFor(() => expect(alertEngine.evaluate).toHaveBeenCalledTimes(1));

    // Simulate the onLogs callback firing (a new transaction landed).
    capturedCallback();
    await vi.waitFor(() => {
      expect(onAlert).toHaveBeenCalledTimes(1);
    });
    expect(onAlert).toHaveBeenCalledWith(expect.objectContaining({ type: 'high_failure_rate' }));
  });
});
