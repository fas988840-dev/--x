import { Connection } from '@solana/web3.js';
import WebSocket from 'ws';
import { writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';

const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com';
const BASELINE_WALLET = '11111111111111111111111111111111';
const TIMEOUT_MS = Number(process.env.RPC_BENCHMARK_TIMEOUT_MS || 20_000);
const REPORT_PATH = process.env.RPC_BENCHMARK_REPORT || 'docs/verification/solana-rpc-ws-benchmark.json';

function toWsUrl(rpcUrl) {
  const url = new URL(rpcUrl);
  if (url.protocol === 'https:') url.protocol = 'wss:';
  else if (url.protocol === 'http:') url.protocol = 'ws:';
  else throw new Error(`Unsupported RPC protocol: ${url.protocol}`);
  return url.toString().replace(/\/$/, '');
}

function sanitizeRpcUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const sensitiveParams = [
      'api-key',
      'apikey',
      'api_key',
      'key',
      'token',
      'access_token',
      'auth',
      'authorization',
    ];

    for (const param of sensitiveParams) {
      if (url.searchParams.has(param)) url.searchParams.set(param, 'REDACTED');
    }

    const parts = url.pathname.split('/').map((part) => {
      if (part.length >= 24 && /^[A-Za-z0-9._~-]+$/.test(part)) return 'REDACTED';
      return part;
    });
    url.pathname = parts.join('/');

    if (url.username) url.username = 'REDACTED';
    if (url.password) url.password = 'REDACTED';

    return url.toString();
  } catch {
    return '[INVALID_OR_REDACTED_URL]';
  }
}

function providerNameFromEnv(key) {
  return key.replace(/_RPC_URL$/, '').toLowerCase();
}

function discoverProviders() {
  const entries = [];
  const seenUrls = new Set();

  const add = (name, rpcUrl, source) => {
    if (!rpcUrl || typeof rpcUrl !== 'string') return;
    const trimmed = rpcUrl.trim();
    if (!trimmed || seenUrls.has(trimmed)) return;
    seenUrls.add(trimmed);
    entries.push({ name, rpcUrl: trimmed, source });
  };

  add('default', process.env.SOLANA_RPC_URL || DEFAULT_RPC, process.env.SOLANA_RPC_URL ? 'SOLANA_RPC_URL' : 'public-fallback');

  for (const [key, value] of Object.entries(process.env)) {
    if (!key.endsWith('_RPC_URL')) continue;
    if (key === 'SOLANA_RPC_URL') continue;
    add(providerNameFromEnv(key), value, key);
  }

  return entries;
}

function getTestWallets() {
  const wallets = [{ name: 'system-program', address: BASELINE_WALLET }];
  const cliWallet = process.argv[2]?.trim();
  const envWallet = process.env.MY_SOLANA_WALLET?.trim();
  const extra = cliWallet || envWallet;

  if (extra && extra !== BASELINE_WALLET) {
    wallets.push({ name: cliWallet ? 'cli-wallet' : 'my-solana-wallet', address: extra });
  }

  return wallets;
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function testRpc(rpcUrl) {
  const connection = new Connection(rpcUrl, { commitment: 'confirmed' });
  const started = performance.now();
  const slot = await withTimeout(connection.getSlot('confirmed'), TIMEOUT_MS, 'getSlot');
  return { slot, latencyMs: Math.round(performance.now() - started) };
}

function connectWebSocket(wsUrl) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const ws = new WebSocket(wsUrl);
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      ws.terminate();
      reject(new Error('WebSocket connection timeout'));
    }, TIMEOUT_MS);

    ws.once('open', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({ ws, connectMs: Math.round(performance.now() - started) });
    });

    ws.once('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function waitForFirstLog(ws) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const requestId = Math.floor(Math.random() * 1_000_000) + 1;
    let subscriptionId = null;

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('No logsNotification received before timeout'));
    }, TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timer);
      ws.off('message', handler);
    };

    const handler = (buffer) => {
      try {
        const message = JSON.parse(buffer.toString());

        if (message.id === requestId && typeof message.result === 'number') {
          subscriptionId = message.result;
          return;
        }

        if (message.method === 'logsNotification') {
          cleanup();
          resolve({
            firstEventMs: Math.round(performance.now() - started),
            slot: message.params?.result?.context?.slot ?? null,
            subscriptionId,
          });
        }
      } catch {
        // Ignore unrelated or non-JSON frames.
      }
    };

    ws.on('message', handler);
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: requestId,
      method: 'logsSubscribe',
      params: ['all', { commitment: 'confirmed' }],
    }));
  });
}

async function testReconnect(wsUrl) {
  const first = await connectWebSocket(wsUrl);
  first.ws.close();
  await withTimeout(new Promise((resolve) => first.ws.once('close', resolve)), TIMEOUT_MS, 'first websocket close');

  const started = performance.now();
  const second = await connectWebSocket(wsUrl);
  const latencyMs = Math.round(performance.now() - started);
  second.ws.close();

  return { success: true, latencyMs };
}

async function testWalletLookup(rpcUrl, wallet) {
  const connection = new Connection(rpcUrl, { commitment: 'confirmed' });
  const started = performance.now();
  const info = await withTimeout(connection.getAccountInfo(wallet.address, 'confirmed'), TIMEOUT_MS, `getAccountInfo:${wallet.name}`);
  return {
    name: wallet.name,
    address: wallet.address,
    exists: Boolean(info),
    owner: info?.owner?.toBase58?.() ?? null,
    executable: info?.executable ?? null,
    lamports: info?.lamports ?? null,
    latencyMs: Math.round(performance.now() - started),
  };
}

async function benchmarkProvider(provider, wallets) {
  const wsUrl = toWsUrl(provider.rpcUrl);
  const result = {
    provider: provider.name,
    source: provider.source,
    rpcUrlSanitized: sanitizeRpcUrl(provider.rpcUrl),
    wsUrlSanitized: sanitizeRpcUrl(wsUrl),
    rpc: null,
    websocket: null,
    reconnect: null,
    walletChecks: [],
    errors: [],
  };

  console.log(`\n=== ${provider.name.toUpperCase()} ===`);
  console.log(`RPC: ${result.rpcUrlSanitized}`);
  console.log(`WS : ${result.wsUrlSanitized}`);

  try {
    result.rpc = await testRpc(provider.rpcUrl);
    console.log(`RPC OK — slot=${result.rpc.slot}, latency=${result.rpc.latencyMs}ms`);
  } catch (error) {
    result.errors.push(`RPC: ${error.message}`);
    console.error(`RPC FAILED — ${error.message}`);
  }

  try {
    const connected = await connectWebSocket(wsUrl);
    result.websocket = { connectMs: connected.connectMs, firstEventMs: null, eventSlot: null };
    console.log(`WebSocket connected in ${connected.connectMs}ms`);

    const event = await waitForFirstLog(connected.ws);
    result.websocket.firstEventMs = event.firstEventMs;
    result.websocket.eventSlot = event.slot;
    console.log(`First live event in ${event.firstEventMs}ms — slot=${event.slot}`);
    connected.ws.close();
  } catch (error) {
    result.errors.push(`WebSocket: ${error.message}`);
    console.error(`WebSocket FAILED — ${error.message}`);
  }

  try {
    result.reconnect = await testReconnect(wsUrl);
    console.log(`Reconnect OK — latency=${result.reconnect.latencyMs}ms`);
  } catch (error) {
    result.reconnect = { success: false, latencyMs: null };
    result.errors.push(`Reconnect: ${error.message}`);
    console.error(`Reconnect FAILED — ${error.message}`);
  }

  for (const wallet of wallets) {
    try {
      const walletResult = await testWalletLookup(provider.rpcUrl, wallet);
      result.walletChecks.push(walletResult);
      console.log(`Wallet ${wallet.name} OK — exists=${walletResult.exists}, latency=${walletResult.latencyMs}ms`);
    } catch (error) {
      result.walletChecks.push({ name: wallet.name, address: wallet.address, error: error.message });
      result.errors.push(`Wallet ${wallet.name}: ${error.message}`);
      console.error(`Wallet ${wallet.name} FAILED — ${error.message}`);
    }
  }

  return result;
}

async function writeReport(report) {
  const directory = REPORT_PATH.includes('/') ? REPORT_PATH.slice(0, REPORT_PATH.lastIndexOf('/')) : '.';
  await mkdir(directory, { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

async function main() {
  const providers = discoverProviders();
  const wallets = getTestWallets();
  const startedAt = new Date().toISOString();

  console.log('FactLedger Solana RPC/WebSocket Verification');
  console.log(`Started: ${startedAt}`);
  console.log(`Providers discovered: ${providers.map((p) => p.name).join(', ')}`);
  console.log(`Wallet checks: ${wallets.map((w) => w.name).join(', ')}`);

  const results = [];
  for (const provider of providers) {
    results.push(await benchmarkProvider(provider, wallets));
  }

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    baselineWallet: BASELINE_WALLET,
    timeoutMs: TIMEOUT_MS,
    providers: results,
  };

  await writeReport(report);
  console.log(`\nJSON report written to: ${REPORT_PATH}`);
  console.log(JSON.stringify(report, null, 2));

  const failed = results.some((result) =>
    !result.rpc ||
    !result.websocket ||
    !result.reconnect?.success ||
    result.errors.length > 0
  );

  process.exitCode = failed ? 1 : 0;
}

main().catch((error) => {
  console.error(`Benchmark fatal error: ${error.message}`);
  process.exitCode = 1;
});
