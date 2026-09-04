/**
 * Phase A.1 holding page.
 *
 * There is no real dashboard yet. Rendering an invented dashboard now
 * would violate the same guardrail the backend enforces (no fabricated
 * numbers). This page states what JONARAI is, and links to the source
 * of truth in `docs/`.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 sm:p-10 bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="max-w-2xl w-full space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Phase A.1 · Scaffold
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            JONARAI
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            SPX / SPXW 0DTE options trading intelligence. Selectivity-first.
            TIME as P0. Confidence score — <em>not</em> probability of profit.
          </p>
        </header>

        <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-5 space-y-3">
          <h2 className="text-sm font-medium">What&rsquo;s live right now</h2>
          <ul className="text-sm text-neutral-700 dark:text-neutral-300 space-y-1 list-disc list-inside">
            <li>
              Backend health endpoint (<code>/health</code>) — engines report
              as not-ready by design.
            </li>
            <li>
              Repository scaffold + spec index + roadmap under <code>docs/</code>.
            </li>
            <li>
              This page (a placeholder that refuses to fabricate a dashboard).
            </li>
          </ul>
        </section>

        <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-5 space-y-3">
          <h2 className="text-sm font-medium">Non-negotiables</h2>
          <ul className="text-sm text-neutral-700 dark:text-neutral-300 space-y-1 list-disc list-inside">
            <li>The score is a selectivity signal, not a win probability.</li>
            <li>
              <code>NO&nbsp;TRADE</code> is a first-class output. The default
              answer is silence.
            </li>
            <li>
              No live broker execution before paper-trading calibration.
            </li>
          </ul>
        </section>

        <footer className="pt-2 text-xs text-neutral-500 dark:text-neutral-500 border-t border-neutral-200 dark:border-neutral-800">
          JONARAI outputs are trading intelligence, <strong>not</strong>{" "}
          financial advice. Options trading carries substantial risk of loss.
        </footer>
      </div>
    </main>
  );
}
