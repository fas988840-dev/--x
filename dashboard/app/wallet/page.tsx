import { redirect } from 'next/navigation';

/**
 * Handles the search form's GET submission (?address=...) and redirects
 * to the actual wallet detail route.
 */
export default async function WalletSearchRedirect(
  props: { searchParams: Promise<{ address?: string }> }
): Promise<never> {
  const searchParams = await props.searchParams;
  const address = searchParams.address?.trim();

  if (address) {
    redirect(`/wallet/${encodeURIComponent(address)}`);
  }

  redirect('/');
}
