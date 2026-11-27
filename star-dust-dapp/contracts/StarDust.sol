// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Star Dust (STAR)
 * @notice ERC-20 currency for the Space Explorer dApp.
 *         Explorers claim Star Dust daily, transfer it, and burn it to rank up.
 * @dev Educational project for testnet use only. Not audited.
 */
contract StarDust is ERC20 {
    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------
    uint256 private constant UNIT = 10 ** 18;

    uint256 public constant INITIAL_SUPPLY = 1_000_000 * UNIT;
    uint256 public constant CLAIM_AMOUNT = 100 * UNIT;
    uint256 public constant CLAIM_COOLDOWN = 1 days;

    // Total STAR an explorer must have burned to reach each rank
    uint256 public constant PILOT_BURN = 100 * UNIT;
    uint256 public constant NAVIGATOR_BURN = 500 * UNIT;
    uint256 public constant CAPTAIN_BURN = 1_000 * UNIT;
    uint256 public constant COMMANDER_BURN = 5_000 * UNIT;

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------
    mapping(address => uint256) private _lastClaim;
    mapping(address => uint256) private _totalBurned;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------
    event DailyClaimed(address indexed user, uint256 amount);
    event RankUpgraded(address indexed user, uint8 newLevel);

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    constructor() ERC20("Star Dust", "STAR") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // ---------------------------------------------------------------------
    // Core functions
    // ---------------------------------------------------------------------

    /// @notice Mint 100 STAR to the caller, once every 24 hours.
    function claimDaily() external {
        require(timeUntilNextClaim(msg.sender) == 0, "Claim not ready yet");

        _lastClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, CLAIM_AMOUNT);

        emit DailyClaimed(msg.sender, CLAIM_AMOUNT);
    }

    /// @notice Burn STAR from the caller's balance to progress toward higher ranks.
    /// @param amount Amount of STAR to burn (in wei units, 18 decimals).
    function burnToUpgrade(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        uint8 oldLevel = getLevel(msg.sender);

        _burn(msg.sender, amount); // reverts if balance is too low
        _totalBurned[msg.sender] += amount;

        uint8 newLevel = getLevel(msg.sender);
        if (newLevel > oldLevel) {
            emit RankUpgraded(msg.sender, newLevel);
        }
    }

    /// @notice Rank level of an explorer: 0 Cadet, 1 Pilot, 2 Navigator, 3 Captain, 4 Galactic Commander.
    function getLevel(address user) public view returns (uint8) {
        uint256 burned = _totalBurned[user];

        if (burned >= COMMANDER_BURN) return 4;
        if (burned >= CAPTAIN_BURN) return 3;
        if (burned >= NAVIGATOR_BURN) return 2;
        if (burned >= PILOT_BURN) return 1;
        return 0;
    }

    /// @notice Seconds until the user can claim again (0 means ready now).
    function timeUntilNextClaim(address user) public view returns (uint256) {
        uint256 last = _lastClaim[user];
        if (last == 0) return 0;

        uint256 nextClaim = last + CLAIM_COOLDOWN;
        if (block.timestamp >= nextClaim) return 0;
        return nextClaim - block.timestamp;
    }

    /// @notice Total STAR the user has burned so far.
    function totalBurnedBy(address user) external view returns (uint256) {
        return _totalBurned[user];
    }

    // transfer(address,uint256) and balanceOf(address) are inherited from OpenZeppelin's ERC20.
}
