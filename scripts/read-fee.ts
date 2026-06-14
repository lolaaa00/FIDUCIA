import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

const envLines = readFileSync(join(process.cwd(), '.env.local'), 'utf-8').split('\n');
for (const line of envLines) {
  const [k, ...rest] = line.split('=');
  if (k && !k.startsWith('#')) process.env[k.trim()] = rest.join('=').trim();
}

async function main() {
  const account = createAccount(process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`);
  const client = createClient({ chain: studionet, account } as Parameters<typeof createClient>[0]);
  const result = await client.readContract({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    functionName: 'get_protocol_stats',
    args: [],
  } as Parameters<typeof client.readContract>[0]);
  const stats = JSON.parse(result as string);
  console.log('review_fee (wei):', stats.review_fee);
  console.log('review_fee (GEN):', stats.review_fee / 1e18);
}

main().catch(console.error);
