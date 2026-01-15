# 🏀 BOUNCCCER

> **"Bouncccer: bounty for builder and influencers"**

---

### 💀 The Problem:
You ship code. You make content. **You wait to get paid.**
Invoices get lost. Clients ghost. "Net-30" becomes "Net-Never".

### ⚡️ The Fix:
**Bouncccer** is the **JobFi** layer for the gig economy.
Funds are locked **before** you start. You deliver. You get paid. **Instantly.**

---

## � How It Works (The Flow)

We kept it simple. No complex proposals. Just proof of work.

1.  **Browse & Hunt** 🎯
    Find a bounty that matches your skills (coding, design, or marketing).

2.  **Hack & Prove** 🛠
    Do the work. Submit a **proof** (screenshot, demo, or encrypted preview) to show you're capable.

3.  **Get Chosen** 🏆
    The Bounty Creator reviews submissions and selects **you** as the winner.

4.  **Deliver & Earn** 💸
    You hand over the full code or service. The smart contract automatically releases the funds to your wallet.

---

## �💎 Why You're Here

### 🏗 For Builders
*   **Code -> Cash**: Solve issues, submit PRs, get tokens.
*   **Proof of Work**: Your commits are minted as **Soulbound NFTs**. Your GitHub profile, but on-chain and immutable.
*   **No Rugs**: If the money isn't in the contract, you don't write a line of code.

### 📣 For Influencers
*   **Viral = Value**: Bounties for tweets, threads, and videos.
*   **Verify Impact**: Prove your reach on-chain.
*   **Instant Settlement**: No more chasing marketing managers for your fee.

---

Built on **Arbitrum Sepolia** for speed and low fees.

---

## 💻 Run Locally

1. **Clone & Install**
   ```bash
   git clone https://github.com/bouncccer/fe-bouncccer.git
   cd fe-bouncccer
   pnpm install
   ```

2. **Env Setup**
   ```bash
   cp .env.example .env.local
   # Fill in your NEXT_PUBLIC_PINATA_JWT and NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
   ```

3. **Start Hacking**
   ```bash
   pnpm run dev
   ```

## 🚀 Deploy to Netlify

**Option A: Netlify Dashboard (Recommended)**
1. Push your code to GitHub.
2. Log in to [Netlify](https://app.netlify.com).
3. Click **"Add new site"** > **"Import an existing project"**.
4. Select your repo.
5. Add your Environment Variables (`NEXT_PUBLIC_PINATA_JWT`, etc.) in "Site settings".
6. Click **Deploy**.

**Option B: Netlify CLI**
```bash
npm install netlify-cli -g
netlify login
netlify init
netlify deploy --prod
```

---

## 📜 Contract Zone (Arbitrum Sepolia)

Verified. Check them yourself.

*   **Quinty (Main Logic)**: [`0xd2AC...E4af`](https://sepolia.arbiscan.io/address/0xd2AC810cFDCC68B6297a34b9754E4FF0335FE4af)
*   **Reputation (SBT)**: [`0x4D3A...0fb`](https://sepolia.arbiscan.io/address/0x4D3ACbAFCd1fc9BaCF1aaFEbb903B85552a2a0fb)
*   **Badges (NFTs)**: [`0xBe17...53a`](https://sepolia.arbiscan.io/address/0xBe17D9c0221b51E02ba0a131CB417D301724853a)

---

### 🤝 Join the Movement
This isn't just a platform. It's a **meritocracy**.
If you build, you belong.

**[ Start Bouncing ]**
