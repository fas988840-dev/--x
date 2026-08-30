import { redirect } from 'next/navigation';

/**
 * Handles the search form's GET submission (?address=...) and redirects
 * to the actual wallet detail route.
 */
export default function WalletSearchRedirect({ searchParams }: { searchParams: { address?: string } }) {
  const address = searchParams.address?.trim();

  if (address) {
    redirect(`/wallet/${encodeURIComponent(address)}`);
  }

  redirect('/');
}
