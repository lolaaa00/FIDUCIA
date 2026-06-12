'use client';

import type { Address } from 'viem';

export interface BrowserEthereumProvider {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

interface WalletRuntimeState {
  address: Address | null;
  provider: BrowserEthereumProvider | null;
  chainId: string | null;
}

let walletRuntime: WalletRuntimeState = {
  address: null,
  provider: null,
  chainId: null,
};

export function setWalletRuntime(next: Partial<WalletRuntimeState>): void {
  walletRuntime = { ...walletRuntime, ...next };
}

export function getWalletRuntime(): WalletRuntimeState {
  return walletRuntime;
}
