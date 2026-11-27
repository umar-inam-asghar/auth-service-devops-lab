# Remix Deployment Notes: Star Dust (STAR)

This file records how the contract was deployed with **Remix IDE** and **MetaMask** on the **Sepolia** testnet.

## Environment

| Item | Value |
|---|---|
| IDE | Remix IDE (https://remix.ethereum.org) |
| Wallet | MetaMask (Injected Provider) |
| Network | Sepolia, Chain ID 11155111 |
| Compiler | Solidity 0.8.20 or newer |
| EVM Version | default |
| Optimization | disabled (default) |
| Contract | `StarDust` in `contracts/StarDust.sol` |
| Constructor arguments | none |

## Steps Followed

1. Opened Remix and created `contracts/StarDust.sol` with the project code.
2. Compiled with Solidity 0.8.20+ (OpenZeppelin ERC20 imported automatically).
3. Set Environment to **Injected Provider - MetaMask** with MetaMask on Sepolia.
4. Selected **StarDust** and clicked **Deploy**, then confirmed in MetaMask.
5. Copied the deployed contract address into `frontend/script.js`.

## Deployment Record (fill in after deploying)

| Item | Value |
|---|---|
| Contract Address | `0xYOUR_DEPLOYED_CONTRACT_ADDRESS` |
| Deployment Tx Hash | `0xYOUR_TX_HASH` |
| Deployer Wallet | `0xYOUR_WALLET_ADDRESS` |
| Date | `YYYY-MM-DD` |
| Etherscan Link | `https://sepolia.etherscan.io/address/0xYOUR_DEPLOYED_CONTRACT_ADDRESS` |

## Functions Tested in Remix

| Function | Result |
|---|---|
| `name()` / `symbol()` | Star Dust / STAR |
| `balanceOf(deployer)` | 1,000,000 STAR |
| `claimDaily()` | mints 100 STAR |
| `getLevel(address)` | 0 before burning |
| `burnToUpgrade(amount)` | reduces balance, raises rank at thresholds |

## Optional: Screenshots

Add screenshots of the Remix compile result, the deployed contract panel, and the Etherscan page to this folder before submitting.
