import { getWalletAnalysis, getWalletEvidence, getWalletResearch, getWalletExplanation } from '@/lib/factledger-api';

function statusBadge(status: string) {
  const cls = status.toLowerCase();
  return <span className={`badge badge-${cls}`}>{status}</span>;
}

export default async function WalletPage({ params }: { params: { address: string } }) {
  const address = decodeURIComponent(params.address);

  // Fetched independently and in parallel - one endpoint failing (e.g. an
  // invalid address, or the RPC being unreachable) does not block the
  // others from rendering their own real result.
  const [analysis, evidence, research, explanation] = await Promise.all([
    getWalletAnalysis(address),
    getWalletEvidence(address),
    getWalletResearch(address),
    getWalletExplanation(address),
  ]);

  return (
    <>
      <h1>
        <code>{address}</code>
      </h1>

      {analysis.ok ? (
        <>
          <div className="card">
            <h2>Observable Data</h2>
            <div className="stat-row">
              <div className="stat">
                <div className="value">{analysis.data.observableData.transactionCount}</div>
                <div className="label">Transactions</div>
              </div>
              <div className="stat">
                <div className="value">{analysis.data.observableData.successfulTransactions}</div>
                <div className="label">Successful</div>
              </div>
              <div className="stat">
                <div className="value">{analysis.data.observableData.failedTransactions}</div>
                <div className="label">Failed</div>
              </div>
              <div className="stat">
                <div className="value">{analysis.data.observableData.uniqueTokens}</div>
                <div className="label">Unique tokens</div>
              </div>
              <div className="stat">
                <div className="value">{analysis.data.observableData.uniquePrograms}</div>
                <div className="label">Unique programs</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Intelligence Score</h2>
            <div className="stat-row">
              <div className="stat">
                <div className="value">{analysis.data.intelligence.score}</div>
                <div className="label">Overall / 100</div>
              </div>
              <div className="stat">
                <div className="value">{analysis.data.intelligence.components.activity}</div>
                <div className="label">Activity</div>
              </div>
              <div className="stat">
                <div className="value">{analysis.data.intelligence.components.sophistication}</div>
                <div className="label">Sophistication</div>
              </div>
              <div className="stat">
                <div className="value">{analysis.data.intelligence.components.consistency}</div>
                <div className="label">Consistency</div>
              </div>
              <div className="stat">
                <div className="value">{analysis.data.intelligence.components.efficiency}</div>
                <div className="label">Efficiency</div>
              </div>
            </div>
            {analysis.data.intelligence.factors.length > 0 && (
              <ul>
                {analysis.data.intelligence.factors.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2>Risk</h2>
            <p>
              <span className={`badge badge-${analysis.data.risk.level}`}>{analysis.data.risk.level}</span>{' '}
              <strong>{analysis.data.risk.score}</strong> / 100
            </p>
            {analysis.data.risk.reasoning.length > 0 ? (
              <ul>
                {analysis.data.risk.reasoning.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">No specific risk factors triggered.</p>
            )}
            <div className="disclaimer">{analysis.data.disclaimer}</div>
          </div>
        </>
      ) : (
        <div className="card">
          <h2>Observable Data / Intelligence / Risk</h2>
          <div className="error-box">Could not load: {analysis.error}</div>
        </div>
      )}

      <div className="card">
        <h2>Evidence {evidence.ok && statusBadge(evidence.data.evidenceStatus)}</h2>
        {evidence.ok && evidence.data.data ? (
          <>
            <p className="muted">
              Examined {evidence.data.data.transactionsExamined} transaction(s)
              {evidence.data.data.transactionsSkipped > 0 && `, ${evidence.data.data.transactionsSkipped} skipped (could not be parsed)`}.
            </p>
            {evidence.data.data.evidence.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Program</th>
                    <th>Status</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.data.data.evidence.map((e, i) => (
                    <tr key={`${e.transactionSignature}-${i}`}>
                      <td>
                        <code>
                          {e.transactionSignature.slice(0, 8)}...{e.transactionSignature.slice(-6)}
                        </code>
                      </td>
                      <td>{e.programName}</td>
                      <td>{statusBadge(e.status)}</td>
                      <td>{e.confidencePercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted">No instruction-level evidence extracted for the examined transactions.</p>
            )}
          </>
        ) : (
          <p className="muted">{evidence.ok ? evidence.data.justification : `Could not load: ${evidence.error}`}</p>
        )}
      </div>

      <div className="card">
        <h2>Research Summary {research.ok && statusBadge(research.data.evidenceStatus)}</h2>
        {research.ok && research.data.data ? (
          <>
            <p>{research.data.data.summary}</p>
            <p className="muted">Audit trail: {research.data.data.auditTrail.join(', ')}</p>
          </>
        ) : (
          <p className="muted">{research.ok ? research.data.justification : `Could not load: ${research.error}`}</p>
        )}
      </div>

      <div className="card">
        <h2>
          AI Explanation {explanation.ok && statusBadge(explanation.data.evidenceStatus)}
          {explanation.ok && explanation.data.data && (
            <span className="badge" title="Whether the sentence below came from ChainGPT or a deterministic fallback">
              {explanation.data.data.summarySource === 'chaingpt' ? 'ChainGPT' : 'deterministic'}
            </span>
          )}
        </h2>
        {explanation.ok && explanation.data.data ? (
          <>
            <p>{explanation.data.data.summary}</p>
            {explanation.data.data.patterns.length > 0 && (
              <ul>
                {explanation.data.data.patterns.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
            <div className="disclaimer">{explanation.data.data.disclaimer}</div>
          </>
        ) : (
          <p className="muted">{explanation.ok ? explanation.data.justification : `Could not load: ${explanation.error}`}</p>
        )}
      </div>
    </>
  );
}
