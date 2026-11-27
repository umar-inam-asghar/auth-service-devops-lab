# 🚀 Star Dust: Space Explorer dApp

A decentralized application themed around **space exploration**. Explorers claim **Star Dust (STAR)**, an ERC-20 token, every day, send it to other explorers, and burn it to upgrade their **Explorer Rank** from Cadet to Galactic Commander.

> **Author:** Umar Inam Asghar
> **Network:** Ethereum Sepolia Testnet
> **Deployed with:** Remix IDE + MetaMask
> **Contract Address:** `0xYOUR_DEPLOYED_CONTRACT_ADDRESS`
> **Etherscan:** `https://sepolia.etherscan.io/address/0xYOUR_DEPLOYED_CONTRACT_ADDRESS`

---

## 📑 Table of Contents

1. [Theme](#-theme)
2. [Token Design](#-token-design)
3. [Features](#-features)
4. [Smart Contract Functions](#-smart-contract-functions)
5. [Tools Used](#-tools-used)
6. [Project Structure](#-project-structure)
7. [Step 1: MetaMask and Sepolia Setup](#-step-1-metamask-and-sepolia-setup)
8. [Step 2: Deploy with Remix](#-step-2-deploy-with-remix)
9. [Step 3: Connect the Frontend](#-step-3-connect-the-frontend)
10. [Step 4: Run the Frontend](#-step-4-run-the-frontend)
11. [How to Use the dApp](#-how-to-use-the-dapp)
12. [Deployment Details](#-deployment-details)
13. [Demo Script (2-3 minutes)](#-demo-script-23-minutes)
14. [Security Notes](#-security-notes)
15. [Troubleshooting](#-troubleshooting)
16. [Future Improvements](#-future-improvements)
17. [License](#-license)

---

## 🌌 Theme

**Space Explorer.** You are a cadet on a mission across the galaxy. Star Dust is the currency of the cosmos. You collect it daily, trade it with fellow explorers, and spend (burn) it to earn higher ranks. The interface uses a dark starfield background, glowing neon accents, floating planets, a flying rocket, and twinkling stars to match the theme.

---

## 🪙 Token Design

| Property | Value |
|---|---|
| Name | Star Dust |
| Symbol | STAR |
| Standard | ERC-20 (OpenZeppelin) |
| Decimals | 18 |
| Initial Supply | 1,000,000 STAR minted to the deployer |
| Daily Claim | 100 STAR per address every 24 hours |
| Burn Mechanic | Burn STAR to upgrade rank |

### Rank Levels

| Level | Rank | Total Burn Required |
|---|---|---|
| 0 | 🧑‍🚀 Cadet | 0 STAR |
| 1 | 🛰️ Pilot | 100 STAR |
| 2 | 🌠 Navigator | 500 STAR |
| 3 | 🪐 Captain | 1,000 STAR |
| 4 | 👑 Galactic Commander | 5,000 STAR |

---

## ✨ Features

- 🔌 **Connect Wallet** with MetaMask, including automatic Sepolia network check
- 💰 **Live Balance** of your STAR tokens
- 🎁 **Daily Claim** of free Star Dust, with a live countdown to the next claim
- 📤 **Token Transfer** to any wallet address
- 🔥 **Burn to Upgrade** to rank up your explorer
- 🏅 **Rank Display** with a progress bar to the next rank
- 🌟 **Animated UI** with twinkling stars, floating planets, and glowing buttons
- 📱 **Responsive Design** for desktop, tablet, and mobile
- ⚠️ **Status Messages** for pending, confirmed, and failed transactions, with Etherscan links

---

## 📜 Smart Contract Functions

Contract: `contracts/StarDust.sol`

| # | Function | Description |
|---|---|---|
| 1 | `claimDaily()` | Mints 100 STAR to the caller once every 24 hours |
| 2 | `burnToUpgrade(uint256 amount)` | Burns STAR from the caller and adds it to their total burned |
| 3 | `getLevel(address user)` | Returns the explorer's rank level (0-4) based on total burned |
| 4 | `timeUntilNextClaim(address user)` | Returns seconds remaining until the next claim is available |
| 5 | `totalBurnedBy(address user)` | Returns the total STAR the user has burned |
| 6 | `transfer(address, uint256)` | Standard ERC-20 transfer (inherited from OpenZeppelin) |

**Events:** `DailyClaimed(address user, uint256 amount)`, `RankUpgraded(address user, uint8 newLevel)`

---

## 🛠 Tools Used

| Purpose | Tool |
|---|---|
| Smart contract language | Solidity ^0.8.20 |
| Token library | OpenZeppelin Contracts (ERC-20) |
| Write, compile, and deploy | **Remix IDE** (remix.ethereum.org) |
| Wallet | **MetaMask** browser extension |
| Blockchain | Ethereum **Sepolia** testnet |
| Test ETH | Sepolia faucet (Google Cloud Web3, Alchemy, or Infura) |
| Frontend | HTML5, CSS3, JavaScript (ES6) |
| Web3 library | ethers.js v6 (loaded from CDN) |
| Block explorer | Sepolia Etherscan |

---

## 📁 Project Structure

```
star-dust-dapp/
├── contracts/
│   └── StarDust.sol
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── remix-deploy-notes.md
└── README.md
```

`remix-deploy-notes.md` is the Remix deployment record (the "remix files" item in the submission structure).

---

## 🦊 Step 1: MetaMask and Sepolia Setup

1. Install the **MetaMask** extension from [metamask.io](https://metamask.io/) and create a wallet. Write down the recovery phrase and keep it private.
2. Open MetaMask and click the network selector at the top. Turn on **Show test networks** if Sepolia is not visible, then select **Sepolia**.
3. Copy your wallet address from MetaMask.
4. Get free Sepolia test ETH from a faucet, for example:
   - Google Cloud Web3 faucet
   - Alchemy Sepolia faucet
   - Infura Sepolia faucet
5. Wait until the test ETH shows in MetaMask. You need a small amount to pay gas for deploying and for transactions.

> ⚠️ Use a wallet for testing only. Never share your recovery phrase or private key, and never use a wallet that holds real funds.

---

## 🧪 Step 2: Deploy with Remix

1. Open **[remix.ethereum.org](https://remix.ethereum.org)** in your browser.
2. In the **File Explorer**, create a new file `StarDust.sol` inside the `contracts` folder and paste the code from `contracts/StarDust.sol`.
3. Open the **Solidity Compiler** tab:
   - Select compiler version **0.8.20** or newer (0.8.2x works).
   - Click **Compile StarDust.sol**. A green check means success. The OpenZeppelin import downloads automatically.
4. Open the **Deploy & Run Transactions** tab:
   - Set **Environment** to **Injected Provider - MetaMask**.
   - MetaMask will ask to connect. Approve it, and confirm the network shows **Sepolia (11155111)**.
   - Under **Contract**, choose **StarDust**.
5. Click **Deploy** and confirm the transaction in the MetaMask popup.
6. When it confirms, the contract appears under **Deployed Contracts**. Click the **copy** icon to copy the **contract address**.
7. In the Solidity Compiler tab, scroll down and click **ABI** to copy the ABI (optional; the frontend already includes the needed functions).
8. (Optional) Test inside Remix by expanding the deployed contract and calling `claimDaily`, `balanceOf`, and `getLevel`.

---

## 🔗 Step 3: Connect the Frontend

1. Open `frontend/script.js`.
2. Replace the placeholder at the top with your deployed address:

   ```js
   const CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS";
   ```

3. Save the file.

---

## 🖥 Step 4: Run the Frontend

From the project folder, start a simple local server:

```bash
cd frontend
python3 -m http.server 8000
```

(or `npx serve .` if you have Node.js)

Open `http://localhost:8000` in a browser that has MetaMask installed. Alternatively, open the folder in VS Code and use the **Live Server** extension.

---

## 🎮 How to Use the dApp

1. **Connect Wallet:** click **Connect Wallet** and approve in MetaMask. If you are on the wrong network, the app asks MetaMask to switch to Sepolia.
2. **Claim Daily Star Dust:** click **Claim 100 STAR** and confirm the transaction. A countdown shows when you can claim again.
3. **Transfer:** enter a recipient address and an amount, then click **Send**.
4. **Burn to Upgrade:** enter an amount of STAR to burn and click **Burn**. Your rank and progress bar update when you cross a threshold.
5. **Check Status:** your balance, rank, and total burned appear on the dashboard. Each transaction links to Etherscan.

---

## 📋 Deployment Details

| Item | Value |
|---|---|
| Network | Sepolia (Chain ID 11155111) |
| Tool | Remix IDE with Injected Provider (MetaMask) |
| Compiler | Solidity 0.8.20+ |
| Contract Address | `0xYOUR_DEPLOYED_CONTRACT_ADDRESS` |
| Deployment Tx Hash | `0xYOUR_TX_HASH` |
| Deployer Address | `0xYOUR_WALLET_ADDRESS` |
| Deployed On | `YYYY-MM-DD` |

---

## 🎤 Demo Script (2-3 minutes)

| Time | What to show |
|---|---|
| 0:00-0:20 | Introduce the theme (Space Explorer) and the Star Dust token |
| 0:20-0:45 | Show `StarDust.sol` and the deployed contract in Remix or Etherscan |
| 0:45-1:10 | Click **Connect Wallet** and show the address and balance |
| 1:10-1:35 | Claim daily STAR and show the balance update |
| 1:35-2:00 | Transfer STAR to a second wallet address |
| 2:00-2:30 | Burn STAR and show the rank upgrade |
| 2:30-3:00 | Show the transactions on Sepolia Etherscan and wrap up |

**Tips:** have a second wallet address ready, keep some spare Sepolia ETH for gas, and do a full practice run before the demo.

---

## 🔒 Security Notes

- Built on audited **OpenZeppelin** ERC-20 contracts.
- Daily claim is rate-limited per address using block timestamps.
- Solidity 0.8+ has built-in overflow and underflow checks.
- This is an educational project on a **testnet only**. It has not been professionally audited and must not be used with real funds.
- No private keys or secrets are stored in this project. All signing happens inside MetaMask.

---

## 🧯 Troubleshooting

| Problem | Fix |
|---|---|
| MetaMask popup does not appear | Refresh the page and make sure the extension is enabled |
| "Wrong network" | Switch MetaMask to **Sepolia** |
| Deploy fails with insufficient funds | Get more Sepolia ETH from a faucet |
| Remix cannot find OpenZeppelin | Check your internet connection and recompile |
| "Claim not ready yet" | Wait for the 24-hour countdown to finish |
| Frontend shows "Contract address not set" | Paste your address into `CONTRACT_ADDRESS` in `script.js` |
| Balance shows 0 after claiming | Wait for confirmation, then refresh |
| Buttons do nothing | Open the browser console (F12) and check for errors; make sure you use a local server, not a plain file |

---

## 🔮 Future Improvements

- Convert ranks into ERC-721 NFT badges
- Add a leaderboard of top explorers
- Add missions or quests that reward Star Dust
- Add staking for passive Star Dust rewards

---

## 📄 License

MIT License. Created for academic purposes.

---

<p align="center">Made with ⭐ for the galaxy. Happy exploring! 🚀</p>
