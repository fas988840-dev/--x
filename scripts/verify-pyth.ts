import 'dotenv/config';
import { createPriceProvider } from '../src/services/create-price-provider.js';
import { parsePythFeedMap } from '../src/services/pyth-hermes-price-provider.js';

const mints = Object.keys(parsePythFeedMap(process.env.PYTH_FEED_MAP_JSON));
if (process.env.PRICE_PROVIDER !== 'pyth' || !process.env.PYTH_API_KEY || mints.length === 0) {
  console.error('Configure PRICE_PROVIDER=pyth, a private PYTH_API_KEY and verified PYTH_FEED_MAP_JSON first.');
  process.exitCode = 1;
} else {
  const prices = await createPriceProvider().getPrices(mints);
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), prices,
    verification: 'Provider response; no local signature or on-chain verification.' }, null, 2));
  if (prices.some(price => price.priceUSD === null)) process.exitCode = 1;
}
