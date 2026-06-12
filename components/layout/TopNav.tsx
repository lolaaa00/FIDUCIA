'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet } from 'lucide-react';
import { shortAddress } from '@/lib/format';
import { useWallet } from '@/components/wallet/WalletProvider';

const marketingLinks = [
  { href: '/#product',    label: 'Product' },
  { href: '/#how',        label: 'How It Works' },
  { href: '/#use-cases',  label: 'Use Cases' },
  { href: '/#about',      label: 'Docs' },
];

const appLinks = [
  { href: '/borrower', label: 'Borrower' },
  { href: '/lenders',  label: 'Lenders' },
  { href: '/admin',    label: 'Admin' },
];

export default function TopNav() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <nav className="site-nav">
      <div className="site-nav__inner">
        {/* Brand */}
        <Link href="/" className="site-brand group">
          <div className="grid h-8 w-8 place-items-center">
            <div className="site-brand__mark group-hover:animate-logo-spin" />
          </div>
          <span className="site-brand__label">Fiducia</span>
        </Link>

        {/* Centre links — marketing on home, app links elsewhere */}
        <div className="site-nav__links">
          {isHome
            ? marketingLinks.map((link) => (
                <a key={link.href} href={link.href} className="site-nav__link">
                  {link.label}
                </a>
              ))
            : appLinks.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`site-nav__link ${active ? 'site-nav__link--active' : ''}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
        </div>

        {/* Right actions */}
        <div className="site-nav__actions">
          {process.env.NEXT_PUBLIC_USE_MOCKS === 'true' && (
            <span className="site-badge">MOCK MODE</span>
          )}
          <WalletButton />
          {isHome && (
            <Link href="/borrower" className="nav-launch-btn">
              Launch app
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function WalletButton() {
  const { address, connect, disconnect, hasProvider, isConnected, isConnecting } = useWallet();

  const label = !hasProvider
    ? 'No wallet'
    : isConnected && address
      ? shortAddress(address)
      : 'Connect Wallet';

  return (
    <button
      type="button"
      onClick={async () => {
        if (!hasProvider || isConnecting) return;
        if (isConnected) await disconnect();
        else await connect();
      }}
      className="wallet-button disabled:cursor-not-allowed disabled:opacity-60"
      disabled={!hasProvider || isConnecting}
    >
      <Wallet className="h-4 w-4 text-[#63E6C2]" />
      {isConnecting ? 'Connecting…' : label}
    </button>
  );
}
