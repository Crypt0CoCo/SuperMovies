# ReelRep contracts

Foundry project for the single on-chain piece of ReelRep: `ReelToken` (REEL), an ERC-20 on **Base Sepolia testnet only** (chain id `84532`). Everything else lives off-chain in [`../reelrep`](../reelrep). See [ROADMAP.md](../reelrep/ROADMAP.md) for the boundaries.

## Setup

```bash
curl -L https://foundry.paradigm.xyz | bash && foundryup   # installs forge, cast, anvil
git submodule update --init --recursive                    # from the repo root: forge-std + OpenZeppelin
cp .env.example .env                                       # fill in yourself, never in chat
```

Libraries are git submodules pinned to release tags: forge-std `v1.17.0`, OpenZeppelin Contracts `v5.7.0`. Import OpenZeppelin as `@openzeppelin/contracts/...` (remapping in `foundry.toml`).

## Commands

Run from `contracts/`:

```bash
forge build                         # compile (solc 0.8.30, pinned in foundry.toml)
forge test -vvv                     # run tests; -vvv prints traces for failures
forge test --match-test testBurn    # run one test
forge fmt                           # format
anvil                               # local chain on :8545, 10 funded throwaway accounts
cast chain-id --rpc-url base_sepolia   # sanity check: must print 84532
```

## Day 4 orientation: what you need to know before writing ReelToken

**The pieces.** `src/` holds contracts, `test/` holds tests (also written in Solidity, files end `.t.sol`), `script/` holds deploy scripts (`.s.sol`). `lib/` is dependencies. `forge` compiles, tests and deploys; `cast` talks to a chain from the command line; `anvil` is a disposable local chain.

**What an ERC-20 is.** A contract that keeps one mapping, `address → balance`, plus `totalSupply`, and exposes a standard set of functions (`balanceOf`, `transfer`, `approve`, `transferFrom`, `allowance`) so every wallet and explorer knows how to read it. "Holding REEL" means the contract's mapping has a number next to your address. Nothing moves anywhere else.

**Decimals.** Solidity has no fractions. ERC-20s use 18 decimals by convention, so `1 REEL` is stored as `1e18`. That's why the supply is written `100_000_000e18`: 100 million tokens. Mixing up `100` and `100e18` is the classic bug; the Day 6 payout code has to send `100e18`, not `100`.

**What OpenZeppelin gives you.** `ERC20` is an audited implementation of the whole standard. You inherit it instead of writing balances and transfers yourself. `ERC20Burnable` adds `burn(amount)` (destroy your own tokens, lowering `totalSupply`) and `burnFrom(account, amount)` (burn someone else's tokens up to an allowance they granted you). Burning is the sink in step 5 of the loop.

**What the constructor does.** It runs exactly once, at deployment. `_mint(treasury, 100_000_000e18)` creates the entire supply and assigns it to the treasury address. `_mint` is `internal`, so after the constructor finishes nothing can ever call it again. No owner, no minter role: supply is fixed forever, and nobody (including you) can mint more, pause transfers or upgrade the code. That's deliberate, and it's why the contract is so short.

**`msg.sender`.** The address calling the current function. `transfer` moves tokens from `msg.sender`; `burn` burns `msg.sender`'s tokens. Contracts can't be called "as" someone else without their signature, so the treasury's tokens only move when a transaction is signed with the treasury's private key.

**Gas and the deploy.** Every state-changing transaction costs gas, paid in ETH by the signer. On Base Sepolia that's free faucet ETH. Deploying sends the compiled bytecode in one transaction and returns the new contract's address. That address plus the ABI (in `out/ReelToken.sol/ReelToken.json` after `forge build`) are what the app needs on Day 6.

**Testing in Foundry.** A test contract inherits `forge-std/Test.sol`; any function starting with `test` is a test. Useful cheatcodes via `vm`: `vm.prank(addr)` makes the next call come from `addr`, `vm.expectRevert()` asserts the next call fails, `makeAddr("alice")` gives a labelled address. A function with parameters (`testTransfer(uint256 amount)`) is a fuzz test: Foundry calls it with hundreds of random inputs.

**Immutability.** A deployed contract can't be edited. A bug means deploying a new contract at a new address. That's fine on testnet and is why Day 5 writes the tests before deploying.

## Day 5 checklist

Before starting, you need (from [wallet-setup.md](../reelrep/docs/wallet-setup.md)):

- [ ] MetaMask testnet wallet on Base Sepolia with faucet ETH (above 0 on sepolia.basescan.org)
- [ ] the treasury's public `0x…` address
- [ ] `contracts/.env` created from `.env.example`, with `TREASURY_ADDRESS` filled in. You'll add `PRIVATE_KEY` yourself during Day 5.

Day 5 itself: `src/ReelToken.sol`, `test/ReelToken.t.sol`, `script/DeployReelToken.s.sol`, then deploy to Base Sepolia and record the address.
