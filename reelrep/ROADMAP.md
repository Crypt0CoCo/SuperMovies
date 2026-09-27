# ReelRep Roadmap

A film review platform POC where writing a good review earns REEL (an ERC-20 token on Base Sepolia testnet), and holding REEL unlocks benefits. Audience: roughly 10 friends. The goal is to demonstrate the full loop end to end, not to launch a product.

## The loop

1. User signs in and writes a review of a film.
2. Review lands in a moderation queue with status `pending`.
3. Admin approves it manually and assigns a quality grade of 1, 2 or 3.
4. Approval writes a reputation event and pays REEL to the user's wallet.
5. User burns REEL to unlock a benefit.

Step 5 is required. Without a sink, the token is just points with extra steps.

## On-chain / off-chain boundary

About 95% of this is an ordinary web app. Only one contract lives on-chain.

| Off-chain (Supabase + Next.js) | On-chain (Base Sepolia) |
| --- | --- |
| Users, films, reviews | Token balances |
| Moderation | Transfers |
| Reputation, tiers | Burns |
| Payout records, redemption records | |

Reputation, moderation and review content must never move on-chain. Flag any proposal that does this.

The single contract:

```solidity
contract ReelToken is ERC20, ERC20Burnable {
    constructor(address treasury) ERC20("Reel", "REEL") {
        _mint(treasury, 100_000_000e18);
    }
}
```

Fixed supply, minted once. No owner, no minter role, no pausable, no upgradeability.

## Build order

One session per day. Do not work ahead.

- [ ] **Day 0**: Verify the database: six tables, three enums, RLS on, signup trigger firing.
- [ ] **Day 1**: Auth (magic link), TMDB search, film pages, review submission.
- [ ] **Day 2**: Public read pages: film reviews, profiles, home feed.
- [ ] **Day 3**: Moderation queue, approve/reject, reputation engine, tiers.
- [ ] **Day 4**: Foundry setup and Solidity orientation (explain, don't just build).
- [ ] **Day 5**: `ReelToken.sol`, tests, deploy to Base Sepolia.
- [ ] **Day 6**: Wallet connect, hot-wallet payout on approval.
- [ ] **Day 7**: Burn-for-benefit redemption flow.
- [ ] **Day 8**: Seed data, health dashboard, demo script, deploy.

## Hard boundaries

- Base Sepolia testnet only. Never mainnet, never real ETH.
- Never a liquidity pool, DEX listing, swap or price oracle.
- Never suggest testnet tokens will convert to something valuable. Once they have perceived value, this becomes a regulated financial promotion to UK consumers.
- Never ask for a private key or seed phrase in chat. Keys live in gitignored `.env` files.
- No DAO, no governance, no staking, no NFTs, no proxies.
- No "burn tokens to boost your review's ranking". That sells influence over the ratings, the one thing that must not be debased.

## Deliberate POC compromises

These choices are known to be wrong for production. They are documented so they don't quietly become the foundation. Do not fix them in the POC.

- **Hot-wallet payouts.** A centralised backend wallet sends payouts instead of a Merkle distributor. Fine for 10 users, wrong for 10,000.
- **Flat 100 REEL per approved review.** Production needs a fixed token budget per weekly epoch, split by reputation weight, so supply is predictable rather than scaling with volume.
- **All moderation is manual.** No duplicate detection, no automated triage.
- **No anti-farming.** No weekly caps, no reputation decay, no delayed vote counting.
- **No emissions curve.**

## What the POC proves, and what it does not

**Proves:** the mechanism works end to end.

**Does not prove:** that anyone wants to write reviews, that the token has value, that the economics survive contact with farmers, or that any of it could legally be offered to UK consumers.
