# Fiducia

**Decentralized AI credit underwriting on GenLayer.**

Fiducia is a blockchain-native credit assessment protocol that uses GenLayer's AI-powered intelligent contracts to evaluate small business loan applications on-chain. There are no centralised decision-makers — a network of validators independently runs an LLM underwriter and reaches consensus through GenLayer's Optimistic Democracy (Equivalence Principle) before any verdict is recorded.

Live: **[fiduciaa.vercel.app](https://fiduciaa.vercel.app)**
Explorer: **[explorer-studio.genlayer.com](https://explorer-studio.genlayer.com)**

---

## How it works

1. **Borrower creates a case** — submits business details (name, type, age, loan amount, duration, purpose)
2. **Evidence commit** — borrower hashes their financial evidence off-chain (SHA-256 of `evidence_json + salt`) and commits the hash on-chain
3. **Evidence reveal** — borrower reveals the raw evidence JSON + salt; the contract verifies the hash matches
4. **Trigger review** — anyone pays the review fee to trigger the AI underwriting. GenLayer validators independently call the LLM and reach consensus on the verdict
5. **Verdict issued** — credit score (0–100), risk level, decision (approve / conditional / reject), recommended loan terms, reasoning, and risk flags are all stored on-chain
6. **Appeal** — borrower can commit and reveal new evidence to challenge the verdict. A second AI review is triggered with the original verdict as context
7. **Reputation** — every reviewed case updates the borrower's on-chain reputation score, tracking their approval history and average credit score across all cases

---

## Contract

**Language:** Python (GenLayer intelligent contract)
**File:** `contract/fiducia.py`
**Deployed on:** GenLayer Studio (Studionet) — Chain ID 61999
**Contract address:** set via `NEXT_PUBLIC_CONTRACT_ADDRESS`

### Storage

| Store | Description |
|---|---|
| `cases` | All credit cases keyed by case ID |
| `case_evidence` | Revealed evidence JSON per case |
| `verdicts` | AI-issued credit verdicts per case |
| `appeal_evidence` | Committed and revealed appeal evidence |
| `appeal_verdicts` | AI-issued appeal verdicts per case |
| `reputation` | Borrower on-chain credit history (keyed by address) |
| `borrower_case_ids` | List of case IDs per borrower address |
| `reviewed_case_ids` | Global list of all reviewed case IDs |

### Write functions (borrower)

| Function | Description |
|---|---|
| `create_case(...)` | Opens a new credit case and registers it to the sender's address |
| `commit_evidence(case_id, commitment)` | Submits the SHA-256 hash of `evidence_json + salt` |
| `reveal_evidence(case_id, evidence_json, salt)` | Reveals evidence; contract verifies hash before storing |
| `trigger_review(case_id)` | Payable — triggers AI underwriting; validators reach consensus via Equivalence Principle |
| `cancel_case(case_id)` | Cancels a case (before it is finalised) |
| `commit_appeal(case_id, appeal_commitment)` | Commits a hash of new appeal evidence |
| `reveal_appeal(case_id, appeal_evidence_json, salt)` | Reveals appeal evidence |
| `trigger_appeal_review(case_id)` | Payable — triggers a second AI review with the original verdict as context |

### Write functions (admin)

| Function | Description |
|---|---|
| `set_review_fee(new_fee)` | Sets the minimum fee (in wei) required to trigger a review |
| `pause()` | Pauses all borrower write operations |
| `unpause()` | Resumes the protocol |
| `flag_case(case_id, reason)` | Flags a case for manual review |

### Read views

| Function | Returns |
|---|---|
| `get_case(case_id)` | Full case record as JSON |
| `get_case_evidence(case_id)` | Revealed evidence JSON |
| `get_case_verdict(case_id)` | Full verdict including score, decision, reasoning, recommended terms |
| `get_appeal(case_id)` | Appeal record and status |
| `get_appeal_verdict(case_id)` | Revised verdict from appeal review |
| `get_borrower_cases(address)` | All cases belonging to an address |
| `get_borrower_reputation(address)` | On-chain reputation: approval history, average score, last decision |
| `get_reviewed_cases()` | All reviewed cases with verdicts and appeal verdicts |
| `get_protocol_stats()` | Total cases, reviews, appeals, current fee, admin, paused state |

### AI underwriting

The LLM prompt instructs the underwriter to assess:
- Business age and stage risk
- Loan-to-revenue ratio
- Existing debt and leverage
- Repayment history signals
- Sector and market context
- Alignment between loan purpose and business type

Validators reach consensus using the **Equivalence Principle**:
- `decision` must be identical across validators
- `risk_level` must be identical
- `credit_score` must be within 20 points
- `repayment_probability` must be within 20 points
- Minor differences in reasoning and conditions are acceptable

---

## Frontend

**Framework:** Next.js 16.2.9 (webpack mode — Turbopack disabled)
**Chain SDK:** `genlayer-js` 1.1.8
**Wallet:** MetaMask / any EIP-1193 injected wallet — auto-switches to GenLayer Studio on connect
**Styling:** Tailwind CSS v4

### Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/borrower` | Borrower dashboard — active cases, status overview |
| `/borrower/create-case` | Multi-step case creation form |
| `/borrower/cases` | Full case list with status and verdict links |
| `/borrower/appeals` | Appeal management — commit, reveal, trigger |
| `/lenders` | Lender dashboard — reviewed cases and verdicts |
| `/lenders/reports` | Credit reports per case |
| `/reputation` | Protocol-wide reputation leaderboard |
| `/reputation/[address]` | Individual borrower on-chain reputation profile |
| `/admin` | Admin controls — fee management, pause, flag cases (deployer only) |

### Wallet connect

On clicking Connect, the app:
1. Calls `eth_requestAccounts` (triggers MetaMask popup)
2. Calls `wallet_switchEthereumChain` to GenLayer Studio (`0xF22F`)
3. If chain is not in MetaMask, calls `wallet_addEthereumChain` with full Studionet params first, then switches

All write transactions go through `genlayer-js` using `window.ethereum` directly — no custom provider wrapper.

---

## Running locally

```bash
cd frontend
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x8BaF2c2d8D34E68186847c9b0652B360B2F34F9D
NEXT_PUBLIC_USE_MOCKS=false
NEXT_PUBLIC_GENLAYER_ENDPOINT=https://studio.genlayer.com/api
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To run against mock data with no wallet required, set `NEXT_PUBLIC_USE_MOCKS=true`.

---

## Vercel deployment

Set these environment variables in your Vercel project:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | `0x8BaF2c2d8D34E68186847c9b0652B360B2F34F9D` |
| `NEXT_PUBLIC_USE_MOCKS` | `false` |
| `NEXT_PUBLIC_GENLAYER_ENDPOINT` | `https://studio.genlayer.com/api` |

---

## Network

| Property | Value |
|---|---|
| Network name | GenLayer Studio |
| Chain ID | 61999 (`0xF22F`) |
| RPC URL | `https://studio.genlayer.com/api` |
| Currency | GEN |
| Explorer | `https://explorer-studio.genlayer.com` |
