import { getHealth } from '@/lib/factledger-api';

export default async function HomePage(): Promise<React.ReactElement> {
  const health = await getHealth();

  return (
    <>
      <h1>Search a Solana wallet</h1>
      <p className="muted">
        Every result below is read directly from the FactLedger API - real on-chain data, or an
        explicit &ldquo;unknown&rdquo; when it isn&rsquo;t available. Nothing here is guessed.
      </p>

      <form action="/wallet" method="get" className="search-form">
        <input
          type="text"
          name="address"
          placeholder="Enter a Solana wallet address..."
          required
          minLength={32}
          maxLength={44}
        />
        <button type="submit">Analyze</button>
      </form>

      <div className="card">
        <h2>API status</h2>
        {health.ok ? (
          <p>
            <span className={`badge badge-verified`}>{health.data.status}</span>{' '}
            <span className="muted">
              {health.data.service} v{health.data.version}
            </span>
          </p>
        ) : (
          <div className="error-box">
            Could not reach the FactLedger API at the configured URL: {health.error}
            <br />
            <span className="muted">
              Set FACTLEDGER_API_URL to override the default API endpoint for this environment.
            </span>
          </div>
        )}
      </div>
    </>
  );
}
