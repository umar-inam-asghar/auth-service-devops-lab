/* ============================================================
   Star Dust: Space Explorer dApp
   Frontend logic (ethers.js v6 + MetaMask)
   ============================================================ */

// 👉 Paste your deployed Sepolia contract address here (from Remix)
const CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS";

const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // 11155111
const ETHERSCAN = "https://sepolia.etherscan.io";

const ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function claimDaily()",
  "function burnToUpgrade(uint256 amount)",
  "function getLevel(address user) view returns (uint8)",
  "function timeUntilNextClaim(address user) view returns (uint256)",
  "function totalBurnedBy(address user) view returns (uint256)",
  "event DailyClaimed(address indexed user, uint256 amount)",
  "event RankUpgraded(address indexed user, uint8 newLevel)"
];

// Must match the thresholds in StarDust.sol (in whole STAR)
const RANKS = [
  { name: "Cadet", icon: "🧑‍🚀", need: 0 },
  { name: "Pilot", icon: "🛰️", need: 100 },
  { name: "Navigator", icon: "🌠", need: 500 },
  { name: "Captain", icon: "🪐", need: 1000 },
  { name: "Galactic Commander", icon: "👑", need: 5000 }
];

// ---------- State ----------
let provider = null;
let signer = null;
let contract = null;
let account = null;
let countdown = null;
let remainingSeconds = 0;

// ---------- DOM helpers ----------
const $ = (id) => document.getElementById(id);

const els = {
  connectBtn: $("connectBtn"),
  walletAddress: $("walletAddress"),
  networkBadge: $("networkBadge"),
  configBanner: $("configBanner"),
  balance: $("balance"),
  burned: $("burned"),
  rankName: $("rankName"),
  rankIcon: $("rankIcon"),
  progressFill: $("progressFill"),
  progressText: $("progressText"),
  ladder: $("ladder"),
  claimBtn: $("claimBtn"),
  claimTimer: $("claimTimer"),
  transferTo: $("transferTo"),
  transferAmount: $("transferAmount"),
  transferBtn: $("transferBtn"),
  burnAmount: $("burnAmount"),
  burnBtn: $("burnBtn"),
  status: $("status"),
  statusText: $("statusText"),
  statusLink: $("statusLink"),
  contractLink: $("contractLink"),
  contractNone: $("contractNone")
};

function contractConfigured() {
  return typeof ethers !== "undefined" && ethers.isAddress(CONTRACT_ADDRESS);
}

function setStatus(message, type, txHash) {
  els.status.className = "status " + (type || "");
  els.statusText.textContent = message;
  if (txHash) {
    els.statusLink.href = `${ETHERSCAN}/tx/${txHash}`;
    els.statusLink.classList.remove("hidden");
  } else {
    els.statusLink.classList.add("hidden");
  }
}

function shortAddress(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function fmt(value) {
  const n = Number(ethers.formatUnits(value, 18));
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function friendlyError(err) {
  if (err && (err.code === "ACTION_REJECTED" || err.code === 4001)) {
    return "Transaction cancelled in MetaMask.";
  }
  const msg = (err && (err.reason || err.shortMessage || err.message)) || "Something went wrong.";
  if (/Claim not ready/i.test(msg)) return "Claim not ready yet. Wait for the countdown to finish.";
  if (/exceeds balance|insufficient balance/i.test(msg)) return "Not enough STAR in your balance.";
  if (/insufficient funds/i.test(msg)) return "Not enough Sepolia ETH to pay gas. Use a faucet.";
  return msg.length > 160 ? msg.slice(0, 160) + "..." : msg;
}

// ---------- Background stars and rank ladder ----------
function createStars(count) {
  const field = $("starfield");
  for (let i = 0; i < count; i++) {
    const s = document.createElement("div");
    s.className = "star";
    const size = Math.random() * 2.5 + 0.8;
    s.style.width = size + "px";
    s.style.height = size + "px";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.animationDelay = Math.random() * 4 + "s";
    s.style.animationDuration = 2 + Math.random() * 4 + "s";
    field.appendChild(s);
  }
}

function renderLadder(level) {
  els.ladder.innerHTML = "";
  RANKS.forEach((r, i) => {
    const div = document.createElement("div");
    div.className = "rung" + (level !== null && i <= level ? " reached" : "") + (i === level ? " current" : "");
    const icon = document.createElement("span");
    icon.className = "icon";
    icon.textContent = r.icon;
    const label = document.createElement("span");
    label.textContent = `${r.name} (${r.need})`;
    div.appendChild(icon);
    div.appendChild(label);
    els.ladder.appendChild(div);
  });
}

// ---------- Wallet ----------
async function ensureSepolia() {
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  if (chainId === SEPOLIA_CHAIN_ID_HEX) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }]
    });
  } catch (err) {
    throw new Error("Please switch MetaMask to the Sepolia test network.");
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    setStatus("MetaMask not found. Please install the MetaMask extension.", "error");
    return;
  }
  try {
    setStatus("Connecting to MetaMask...", "pending");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    await ensureSepolia();

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    account = await signer.getAddress();

    els.walletAddress.textContent = shortAddress(account);
    els.walletAddress.classList.remove("hidden");
    els.networkBadge.textContent = "Sepolia";
    els.networkBadge.className = "badge badge-ok";
    els.connectBtn.textContent = "Connected";

    if (!contractConfigured()) {
      els.configBanner.classList.remove("hidden");
      setStatus("Wallet connected, but the contract address is not set in script.js.", "error");
      return;
    }

    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    setButtons(true);
    await refresh();
    setStatus("Wallet connected. Ready for launch! 🚀", "success");
  } catch (err) {
    setStatus(friendlyError(err), "error");
  }
}

function setButtons(enabled) {
  els.transferBtn.disabled = !enabled;
  els.burnBtn.disabled = !enabled;
  // claim button is controlled by the countdown
  if (!enabled) els.claimBtn.disabled = true;
}

// ---------- Data ----------
async function refresh() {
  if (!contract || !account) return;
  try {
    const [balance, burned, level, wait] = await Promise.all([
      contract.balanceOf(account),
      contract.totalBurnedBy(account),
      contract.getLevel(account),
      contract.timeUntilNextClaim(account)
    ]);

    els.balance.textContent = fmt(balance);
    els.burned.textContent = fmt(burned);

    const lvl = Number(level);
    els.rankName.textContent = RANKS[lvl].name;
    els.rankIcon.textContent = RANKS[lvl].icon;
    renderLadder(lvl);

    const burnedNum = Number(ethers.formatUnits(burned, 18));
    if (lvl >= RANKS.length - 1) {
      els.progressFill.style.width = "100%";
      els.progressText.textContent = "Max rank reached 👑";
    } else {
      const cur = RANKS[lvl].need;
      const next = RANKS[lvl + 1].need;
      const pct = Math.min(100, Math.max(0, ((burnedNum - cur) / (next - cur)) * 100));
      els.progressFill.style.width = pct + "%";
      els.progressText.textContent = `${burnedNum.toLocaleString()} / ${next} STAR burned for ${RANKS[lvl + 1].name}`;
    }

    startCountdown(Number(wait));

    els.contractLink.href = `${ETHERSCAN}/address/${CONTRACT_ADDRESS}`;
    els.contractLink.textContent = CONTRACT_ADDRESS;
    els.contractLink.classList.remove("hidden");
    els.contractNone.classList.add("hidden");
  } catch (err) {
    setStatus("Could not read contract data. Check the address and network. " + friendlyError(err), "error");
  }
}

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function startCountdown(seconds) {
  clearInterval(countdown);
  remainingSeconds = seconds;

  const tick = () => {
    if (remainingSeconds <= 0) {
      els.claimBtn.disabled = false;
      els.claimTimer.textContent = "Ready to claim! ✅";
      clearInterval(countdown);
      return;
    }
    els.claimBtn.disabled = true;
    els.claimTimer.textContent = "Next claim in " + formatTime(remainingSeconds);
    remainingSeconds -= 1;
  };

  tick();
  if (remainingSeconds > 0) countdown = setInterval(tick, 1000);
}

// ---------- Transactions ----------
async function runTx(pendingMsg, sendFn, successMsg) {
  if (!contract) {
    setStatus("Connect your wallet first.", "error");
    return;
  }
  try {
    setStatus(pendingMsg + " Confirm in MetaMask...", "pending");
    const tx = await sendFn();
    setStatus("Transaction sent. Waiting for confirmation...", "pending", tx.hash);
    await tx.wait();
    setStatus(successMsg, "success", tx.hash);
    await refresh();
  } catch (err) {
    setStatus(friendlyError(err), "error");
  }
}

function claimDaily() {
  runTx("Claiming Star Dust.", () => contract.claimDaily(), "Claimed 100 STAR! ✨");
}

function transferTokens() {
  const to = els.transferTo.value.trim();
  const amountStr = els.transferAmount.value.trim();

  if (!ethers.isAddress(to)) return setStatus("Enter a valid recipient address (0x...).", "error");
  if (!amountStr || Number(amountStr) <= 0) return setStatus("Enter an amount greater than 0.", "error");

  let amount;
  try { amount = ethers.parseUnits(amountStr, 18); }
  catch { return setStatus("Invalid amount.", "error"); }

  runTx(`Sending ${amountStr} STAR.`, () => contract.transfer(to, amount), `Sent ${amountStr} STAR to ${shortAddress(to)} 📤`)
    .then(() => { els.transferAmount.value = ""; });
}

function burnTokens() {
  const amountStr = els.burnAmount.value.trim();
  if (!amountStr || Number(amountStr) <= 0) return setStatus("Enter an amount greater than 0.", "error");

  let amount;
  try { amount = ethers.parseUnits(amountStr, 18); }
  catch { return setStatus("Invalid amount.", "error"); }

  runTx(`Burning ${amountStr} STAR.`, () => contract.burnToUpgrade(amount), `Burned ${amountStr} STAR 🔥`)
    .then(() => { els.burnAmount.value = ""; });
}

// ---------- Events ----------
els.connectBtn.addEventListener("click", connectWallet);
els.claimBtn.addEventListener("click", claimDaily);
els.transferBtn.addEventListener("click", transferTokens);
els.burnBtn.addEventListener("click", burnTokens);

if (window.ethereum) {
  window.ethereum.on("accountsChanged", (accounts) => {
    if (accounts.length === 0) window.location.reload();
    else connectWallet();
  });
  window.ethereum.on("chainChanged", () => window.location.reload());
}

// ---------- Init ----------
createStars(120);
renderLadder(null);
if (!contractConfigured()) els.configBanner.classList.remove("hidden");
