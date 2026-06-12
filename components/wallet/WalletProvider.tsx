'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Address } from 'viem';
import { getWalletRuntime, setWalletRuntime, type BrowserEthereumProvider } from '@/lib/walletRuntime';

interface WalletContextValue {
  address: Address | null;
  chainId: string | null;
  hasProvider: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);
const STORAGE_KEY = 'fiducia.connectedAddress';

function getEthereum(): BrowserEthereumProvider | null {
  if (typeof window === 'undefined') return null;
  return (window as Window & { ethereum?: BrowserEthereumProvider }).ethereum ?? null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ethereum = getEthereum();
    const syncProviderState = window.setTimeout(() => {
      setHasProvider(Boolean(ethereum));
    }, 0);

    if (!ethereum) {
      setWalletRuntime({ address: null, provider: null, chainId: null });
      return () => {
        window.clearTimeout(syncProviderState);
      };
    }

    let cancelled = false;
    const eth = ethereum; // capture non-null ref — async closures lose TS narrowing

    async function syncWallet() {
      try {
        const [accountsRaw, chainIdRaw] = await Promise.all([
          eth.request({ method: 'eth_accounts' }) as Promise<string[]>,
          eth.request({ method: 'eth_chainId' }) as Promise<string>,
        ]);

        if (cancelled) return;

        const nextAddress = (accountsRaw?.[0] as Address | undefined) ?? null;
        setAddress(nextAddress);
        setChainId(chainIdRaw);
        setWalletRuntime({ address: nextAddress, provider: ethereum, chainId: chainIdRaw });

        if (nextAddress) {
          window.localStorage.setItem(STORAGE_KEY, nextAddress);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to read wallet state.');
        setWalletRuntime({ address: null, provider: ethereum, chainId: null });
      }
    }

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as unknown[];
      const nextAddress = (accounts?.[0] as Address | undefined) ?? null;
      setAddress(nextAddress);
      setWalletRuntime({ address: nextAddress, provider: ethereum, chainId: getWalletRuntime().chainId });
      if (nextAddress) {
        window.localStorage.setItem(STORAGE_KEY, nextAddress);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const nextChainId = args[0] as string;
      setChainId(nextChainId);
      setWalletRuntime({ ...getWalletRuntime(), provider: ethereum, chainId: nextChainId });
    };

    void syncWallet();
    ethereum.on?.('accountsChanged', handleAccountsChanged);
    ethereum.on?.('chainChanged', handleChainChanged);

    return () => {
      cancelled = true;
      window.clearTimeout(syncProviderState);
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      ethereum.removeListener?.('chainChanged', handleChainChanged);
    };
  }, []);

  async function connect() {
    const ethereum = getEthereum();
    if (!ethereum) {
      setError('No browser wallet detected.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = (await ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      const chainIdRaw = (await ethereum.request({ method: 'eth_chainId' })) as string;
      const nextAddress = (accounts?.[0] as Address | undefined) ?? null;

      setAddress(nextAddress);
      setChainId(chainIdRaw);
      setWalletRuntime({ address: nextAddress, provider: ethereum, chainId: chainIdRaw });

      if (nextAddress) {
        window.localStorage.setItem(STORAGE_KEY, nextAddress);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet connection failed.');
    } finally {
      setIsConnecting(false);
    }
  }

  async function disconnect() {
    setAddress(null);
    setError(null);
    const ethereum = getEthereum();
    setWalletRuntime({ address: null, provider: ethereum, chainId: getWalletRuntime().chainId });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  const value: WalletContextValue = {
    address,
    chainId,
    hasProvider,
    isConnected: Boolean(address),
    isConnecting,
    error,
    connect,
    disconnect,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used inside WalletProvider');
  }
  return context;
}
