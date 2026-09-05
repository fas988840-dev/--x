import { PriceProvider, StubPriceProvider } from './price-provider.js';
import { CoinGeckoPriceProvider } from './coingecko-price-provider.js';
import { PythHermesPriceProvider, parsePythFeedMap } from './pyth-hermes-price-provider.js';

export function createPriceProvider(env: NodeJS.ProcessEnv = process.env): PriceProvider {
  switch (env.PRICE_PROVIDER) {
    case 'stub': return new StubPriceProvider();
    case 'pyth': return new PythHermesPriceProvider({
      apiKey: env.PYTH_API_KEY,
      feedMap: parsePythFeedMap(env.PYTH_FEED_MAP_JSON),
      maxAgeSeconds: env.PYTH_MAX_AGE_SECONDS === undefined ? 60 : Number(env.PYTH_MAX_AGE_SECONDS),
      timeoutMs: env.PYTH_TIMEOUT_MS === undefined ? 5000 : Number(env.PYTH_TIMEOUT_MS),
    });
    default: return new CoinGeckoPriceProvider();
  }
}
