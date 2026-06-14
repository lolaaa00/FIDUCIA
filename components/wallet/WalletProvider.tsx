'use client';

// WalletProvider — UI state only.
// Actual transaction signing is handled by genlayer-js via window.ethereum.
// This context just tracks connection state for displaying the address in the nav
// and gating UI buttons. It does NOT store the provider or pass it to any client.

import React, { createContext, useContext, useEffect, useState } from 'react';

type Address = `0x${string}`;

interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
}

interface WalletContextValue {
  address: Address | null;
  chainId: string | null;
  hasProvider: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

function getEthereum(): EthereumProvider | null {
  if (typeof window === 'undefined') return null;
  return (window as Window & { ethereum?: EthereumProvider }).ethereum ?? null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync on mount — pick up any already-connected accounts
  useEffect(() => {
    const ethereum = getEthereum();
    setHasProvider(Boolean(ethereum));
    if (!ethereum) return;

    let cancelled = false;

    async function ensureStudionet(eth: EthereumProvider) {
      const CHAIN_ID_HEX = '0xF29F';
      try {
        await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
      } catch (switchErr) {
        if ((switchErr as { code?: number }).code === 4902) {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: CHAIN_ID_HEX,
              chainName: 'GenLayer Studio',
              nativeCurrency: { name: 'GEN Token', symbol: 'GEN', decimals: 18 },
              rpcUrls: ['https://studio.genlayer.com/api'],
              blockExplorerUrls: ['https://explorer-studio.genlayer.com'],
            }],
          });
          await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
        }
      }
    }

    async function syncAccounts() {
      try {
        const accts = (await ethereum!.request({ method: 'eth_accounts' })) as string[];
        if (cancelled) return;
        const addr = (accts?.[0] as Address | undefined) ?? null;
        setAddress(addr);
        // If already connected, silently switch to Studionet
        if (addr) await ensureStudionet(ethereum!);
        const chain = (await ethereum!.request({ method: 'eth_chainId' })) as string;
        if (!cancelled) setChainId(chain);
      } catch {
        // not connected yet — fine
      }
    }

    const onAccountsChanged = (...args: unknown[]) => {
      const accts = args[0] as string[];
      setAddress((accts?.[0] as Address | undefined) ?? null);
    };

    const onChainChanged = (...args: unknown[]) => {
      setChainId(args[0] as string);
    };

    void syncAccounts();
    ethereum.on?.('accountsChanged', onAccountsChanged);
    ethereum.on?.('chainChanged', onChainChanged);

    return () => {
      cancelled = true;
      ethereum.removeListener?.('accountsChanged', onAccountsChanged);
      ethereum.removeListener?.('chainChanged', onChainChanged);
    };
  }, []);

  async function connect() {
    const ethereum = getEthereum();
    if (!ethereum) { setError('No injected wallet found. Install MetaMask or a Web3 wallet.'); return; }

    setIsConnecting(true);
    setError(null);
    try {
      const accts = (await ethereum.request({ method: 'eth_requestAccounts' })) as string[];

      const CHAIN_ID_HEX = '0xF29F'; // 61999
      try {
        await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
      } catch (switchErr) {
        if ((switchErr as { code?: number }).code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: CHAIN_ID_HEX,
              chainName: 'GenLayer Studio',
              nativeCurrency: { name: 'GEN Token', symbol: 'GEN', decimals: 18 },
              rpcUrls: ['https://studio.genlayer.com/api'],
              blockExplorerUrls: ['https://explorer-studio.genlayer.com'],
            }],
          });
          await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
        } else {
          throw switchErr;
        }
      }

      const chain = (await ethereum.request({ method: 'eth_chainId' })) as string;
      setAddress((accts?.[0] as Address | undefined) ?? null);
      setChainId(chain);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed.');
    } finally {
      setIsConnecting(false);
    }
  }

  function disconnect() {
    setAddress(null);
    setError(null);
  }

  return (
    <WalletContext.Provider value={{
      address,
      chainId,
      hasProvider,
      isConnected: Boolean(address),
      isConnecting,
      error,
      connect,
      disconnect,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
