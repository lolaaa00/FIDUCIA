/**
 * Fiducia deploy script — targets GenLayer Studionet (chain 61999).
 *
 * Usage:
 *   npx tsx scripts/deploy.ts
 *
 * Required env vars:
 *   DEPLOYER_PRIVATE_KEY   — 0x-prefixed private key of the deployer account
 *   REVIEW_FEE_WEI         — review fee in wei (default: 1000000000000000 = 0.001 GEN)
 *
 * Output:
 *   Prints the deployed contract address. Copy it into NEXT_PUBLIC_CONTRACT_ADDRESS.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionStatus } from 'genlayer-js/types';

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}` | undefined;
  if (!privateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY env var is required');
  }

  const reviewFeeWei = process.env.REVIEW_FEE_WEI ?? '1000000000000000'; // 0.001 GEN default
  const account = createAccount(privateKey);

  // Override the explorer URL to the Studio one
  const chain = {
    ...studionet,
    blockExplorers: {
      default: {
        name: 'GenLayer Studio Explorer',
        url: 'https://explorer-studio.genlayer.com',
      },
    },
  };

  const client = createClient({ chain, account } as Parameters<typeof createClient>[0]);

  const contractCode = readFileSync(
    join(process.cwd(), 'contract', 'fiducia.py'),
    'utf-8',
  );

  console.log('Deploying FiduciaProtocol to Studionet…');
  console.log(`  Deployer : ${account.address}`);

  const deployHash = await client.deployContract({
    code: contractCode,
    args: [],
    leaderOnly: false,
  } as Parameters<typeof client.deployContract>[0]);

  console.log(`  Deploy tx : ${deployHash}`);
  console.log('  Waiting for ACCEPTED status…');

  const receipt = await client.waitForTransactionReceipt({
    hash: deployHash,
    status: TransactionStatus.ACCEPTED,
    retries: 60,
    interval: 5000,
  } as Parameters<typeof client.waitForTransactionReceipt>[0]);

  const contractAddress =
    (receipt as unknown as { contractAddress?: string }).contractAddress ??
    (receipt as unknown as { data?: { contract_address?: string } }).data?.contract_address;

  if (!contractAddress) {
    console.error('Receipt:', JSON.stringify(receipt, null, 2));
    throw new Error('Could not extract contract address from receipt');
  }

  console.log('\n✓ FiduciaProtocol deployed!');
  console.log(`  Contract address : ${contractAddress}`);
  console.log(`  Explorer         : https://explorer-studio.genlayer.com/address/${contractAddress}`);
  console.log('\nAdd this to your .env.local:');
  console.log(`  NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log('  NEXT_PUBLIC_USE_MOCKS=false');

  // Output just the address to stdout last line — easy to capture in CI
  process.stdout.write(`\n${contractAddress}\n`);
}

main().catch((err) => {
  console.error('Deploy failed:', err);
  process.exit(1);
});
