# Wallet setup: MetaMask + Base Sepolia

A checklist you do yourself in the browser before Day 5 (deploying ReelToken).
At the end you'll have a throwaway wallet on Base Sepolia testnet with a little free test ETH to pay for transactions.

Allow 20–30 minutes. The faucet step is the one most likely to need a retry.

## The one rule

**Never paste your recovery phrase or private key anywhere:** not into chat (including Claude), not into a website, not into a file in this repo.

- **Recovery phrase:** 12 words that control the whole wallet. Paper only.
- **Private key:** controls one account. It will eventually go in a gitignored `.env` file on your machine (Day 5), which you type in yourself.
- **Public address:** `0x…`, 42 characters. Safe to share with anyone, including faucets and Claude.

Anyone who asks for the first two (a website, a "support agent", a popup, a DM) is trying to steal the wallet. Real services never ask.

---

## 1. Make a separate browser profile

So the testnet wallet never shares a browser with anything that holds real money or real logins.

- [ ] In Chrome, click your profile picture (top right) → **Add** → **Continue without an account**.
- [ ] Name it something obvious like `ReelRep testnet` and pick a distinct colour.
- [ ] Do everything below in that profile's window.

Why: browser extensions can see pages in the profile they're installed in. Keeping MetaMask in its own profile means a malicious site in your normal browsing can't interact with it, and you can't accidentally confuse it with a real wallet.

## 2. Install MetaMask

- [ ] In the new profile, go to **metamask.io** by typing it into the address bar. Don't search for it or click an ad; fake MetaMask ads and copycat extensions are a common scam.
- [ ] Click **Download** and follow the link to the Chrome Web Store.
- [ ] On the store page, check the publisher shows **metamask.io** and the extension has millions of users. If either looks off, stop.
- [ ] Click **Add to Chrome** → **Add extension**.
- [ ] Pin it: click the puzzle-piece icon in the toolbar, then the pin next to MetaMask.

## 3. Create a new throwaway wallet

- [ ] Open MetaMask and choose **Create a new wallet**. Do not import an existing one, even if you have one.
- [ ] Decline the analytics opt-in if offered.
- [ ] Set a password. This only unlocks MetaMask in this browser; it isn't the recovery phrase.
- [ ] When shown the **Secret Recovery Phrase** (12 words):
  - [ ] write them on paper, in order, numbered 1–12
  - [ ] don't screenshot them, don't copy them to the clipboard, and don't store them in notes or a password manager that syncs
  - [ ] complete MetaMask's confirmation step, where it asks you to re-enter some of the words
- [ ] Mentally label this wallet **testnet only**. It should never receive real ETH or real tokens.

If you lose the paper, nothing is lost but test ETH. You can make a fresh wallet and fill it from the faucet again.

## 4. Add Base Sepolia

Base Sepolia is a test copy of the Base network. Its ETH is free and worthless, which is the point.

**Try the easy way first:**

- [ ] Click the network selector (top-left of MetaMask; it probably says "Ethereum Mainnet").
- [ ] Turn on **Show test networks** (a toggle in that menu, or under Settings → Advanced).
- [ ] If **Base Sepolia** appears in the list, select it and skip to step 5.

**If it isn't listed, add it manually:**

- [ ] Network selector → **Add a custom network** (or Add network → Add a network manually).
- [ ] Enter:

  | Field | Value |
  |---|---|
  | Network name | Base Sepolia |
  | Default RPC URL | `https://sepolia.base.org` |
  | Chain ID | `84532` |
  | Currency symbol | `ETH` |
  | Block explorer URL | `https://sepolia.basescan.org` |

- [ ] Before saving, cross-check these against **docs.base.org** (search "Base Sepolia network information"). The chain ID matters most: `84532`. Base **mainnet** is `8453`, one digit shorter, and is the network to stay away from.
- [ ] Save, then select Base Sepolia.

**Check:** MetaMask's header shows "Base Sepolia" and your balance shows `0 ETH`.

## 5. Copy your public address

- [ ] Click the account name at the top of MetaMask; the address appears with a copy button.
- [ ] Copy it. It starts with `0x` and is 42 characters long.
- [ ] Paste it somewhere you'll find again, like a note on this machine. This is the **treasury address** we'll pass to the ReelToken constructor on Day 5.

## 6. Get test ETH from a faucet

A faucet is a website that gives out small amounts of testnet ETH for free, to cover transaction fees.

- [ ] Open **docs.base.org** and find the **Network Faucets** page. It lists the faucets that currently work. Faucets come and go, so trust that list over anything bookmarked.
- [ ] Good candidates, usually listed there:
  - **Coinbase Developer Platform faucet**: needs a free Coinbase developer login; Base Sepolia is one of its networks.
  - **Superchain faucet** (from Optimism): covers Base Sepolia.
  - **Alchemy** or **QuickNode** faucets: some require a small balance of *real* ETH on mainnet to deter bots. Skip those.
- [ ] On the faucet: choose **Base Sepolia**, paste your **public address**, and complete any captcha yourself.
- [ ] Request the amount offered. **0.05 ETH is plenty**: deploying a token on Base Sepolia costs a tiny fraction of that, and Day 6 payouts cost even less.

**Red flags, close the tab if you see any:**

- it asks for your recovery phrase or private key
- it asks you to **connect** a wallet and then **sign** or **approve** something you don't understand (a faucet only needs your address)
- it asks you to send ETH first to "verify" or "unlock" a bigger amount
- it promises the test ETH or tokens are worth something

## 7. Confirm it arrived

- [ ] Go to **sepolia.basescan.org**, paste your address into the search bar, and press Enter.
- [ ] You should see an incoming transaction from the faucet and a balance above zero. It usually takes under a minute.
- [ ] MetaMask (on Base Sepolia) should show the same balance.

If nothing arrives after 10 minutes: check you selected **Base Sepolia** on the faucet (not Ethereum Sepolia, which is a different network), then try a different faucet from the list.

## Done when

- [ ] MetaMask lives in its own browser profile
- [ ] the wallet is new, with the recovery phrase on paper only
- [ ] Base Sepolia is added, chain ID `84532`
- [ ] the balance shows above 0 ETH on sepolia.basescan.org
- [ ] the public `0x…` address is saved somewhere handy

The only thing you'll share with Claude is the **public address**.

---

## Looking ahead (don't do these yet)

- **Day 5 (deploy):** Foundry needs this account's **private key** to sign the deploy transaction. You'll export it yourself (MetaMask → account menu → Account details → Show private key) and paste it into a gitignored `.env` file in the contracts project. Never into chat.
- **Day 6 (payouts):** the app sends REEL from a backend "hot wallet". That will likely be a **second** account in this same MetaMask, so the treasury key and the always-online server key are different. We'll set that up on the day.
- **Never** send real ETH to these addresses, bridge to them, or import this recovery phrase into a wallet that holds real money.
