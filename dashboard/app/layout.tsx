import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FactLedger Dashboard',
  description: 'Read-only Solana wallet intelligence, backed by real on-chain evidence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a href="/" className="brand">
            FactLedger
          </a>
          <span className="tagline">Evidence-backed, not guessed</span>
        </header>
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
