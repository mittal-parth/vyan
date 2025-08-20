// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SwapToken
 * @dev ERC20 token for battery swap rewards with staking functionality
 */
contract SwapToken is ERC20, Ownable, ReentrancyGuard {
    
    // Events
    event BatterySwapCompleted(
        address indexed user,
        uint256 indexed stationId,
        uint256 tokensRewarded,
        uint256 timestamp
    );
    
    event PriorityLaneStaked(
        address indexed user,
        uint256 amount,
        uint256 lockDuration,
        uint256 timestamp
    );
    
    event PriorityLaneUnstaked(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event StationRegistered(
        uint256 indexed stationId,
        address indexed stationAddress,
        string location,
        uint256 timestamp
    );
    
    // Structs
    struct PriorityStake {
        uint256 amount;
        uint256 lockStartTime;
        uint256 lockDuration;
        bool isActive;
    }
    
    struct Station {
        address stationAddress;
        string location;
        bool isActive;
        uint256 totalSwaps;
        uint256 totalTokensDistributed;
    }
    
    // State variables
    uint256 public constant MINIMUM_STAKE_AMOUNT = 100 * 10**18; // 100 tokens
    uint256 public constant MINIMUM_STAKE_DURATION = 7 days;
    uint256 public constant SWAP_REWARD_AMOUNT = 10 * 10**18; // 10 tokens per swap
    
    mapping(address => PriorityStake) public priorityStakes;
    mapping(uint256 => Station) public stations;
    mapping(address => uint256) public userTotalSwaps;
    mapping(address => uint256) public userTotalRewards;
    
    uint256 public totalStaked;
    uint256 public totalStations;
    uint256 public totalSwapsCompleted;
    
    // Modifiers
    modifier onlyStation() {
        bool isStation = false;
        for (uint256 i = 1; i <= totalStations; i++) {
            if (stations[i].stationAddress == msg.sender && stations[i].isActive) {
                isStation = true;
                break;
            }
        }
        require(isStation, "Only registered stations can call this function");
        _;
    }
    
    modifier onlyStakedUser() {
        require(priorityStakes[msg.sender].isActive, "User must have active priority stake");
        require(
            block.timestamp >= priorityStakes[msg.sender].lockStartTime + priorityStakes[msg.sender].lockDuration,
            "Stake is still locked"
        );
        _;
    }
    
    constructor() ERC20("SwapToken", "SWAP") {
        _mint(msg.sender, 1000000 * 10**18); // Initial supply of 1M tokens
    }
    
    /**
     * @dev Register a new battery swap station
     * @param stationAddress The address of the station contract/interface
     * @param location The physical location of the station
     */
    function registerStation(address stationAddress, string memory location) external onlyOwner {
        totalStations++;
        stations[totalStations] = Station({
            stationAddress: stationAddress,
            location: location,
            isActive: true,
            totalSwaps: 0,
            totalTokensDistributed: 0
        });
        
        emit StationRegistered(totalStations, stationAddress, location, block.timestamp);
    }
    
    /**
     * @dev Complete a battery swap and reward tokens to user
     * @param user The address of the user who completed the swap
     * @param stationId The ID of the station where swap occurred
     */
    function completeBatterySwap(address user, uint256 stationId) external onlyStation {
        require(stations[stationId].isActive, "Station is not active");
        require(user != address(0), "Invalid user address");
        
        // Mint tokens to user
        _mint(user, SWAP_REWARD_AMOUNT);
        
        // Update statistics
        userTotalSwaps[user]++;
        userTotalRewards[user] += SWAP_REWARD_AMOUNT;
        stations[stationId].totalSwaps++;
        stations[stationId].totalTokensDistributed += SWAP_REWARD_AMOUNT;
        totalSwapsCompleted++;
        
        emit BatterySwapCompleted(user, stationId, SWAP_REWARD_AMOUNT, block.timestamp);
    }
    
    /**
     * @dev Stake tokens for priority lane access
     * @param amount Amount of tokens to stake
     * @param lockDuration Duration to lock the stake (minimum 7 days)
     */
    function stakeForPriorityLane(uint256 amount, uint256 lockDuration) external nonReentrant {
        require(amount >= MINIMUM_STAKE_AMOUNT, "Amount below minimum stake requirement");
        require(lockDuration >= MINIMUM_STAKE_DURATION, "Lock duration below minimum");
        require(balanceOf(msg.sender) >= amount, "Insufficient token balance");
        require(!priorityStakes[msg.sender].isActive, "User already has active stake");
        
        // Transfer tokens from user to contract
        _transfer(msg.sender, address(this), amount);
        
        // Create priority stake
        priorityStakes[msg.sender] = PriorityStake({
            amount: amount,
            lockStartTime: block.timestamp,
            lockDuration: lockDuration,
            isActive: true
        });
        
        totalStaked += amount;
        
        emit PriorityLaneStaked(msg.sender, amount, lockDuration, block.timestamp);
    }
    
    /**
     * @dev Unstake tokens after lock period
     */
    function unstakeFromPriorityLane() external nonReentrant onlyStakedUser {
        PriorityStake storage stake = priorityStakes[msg.sender];
        uint256 amount = stake.amount;
        
        // Reset stake
        delete priorityStakes[msg.sender];
        totalStaked -= amount;
        
        // Return tokens to user
        _transfer(address(this), msg.sender, amount);
        
        emit PriorityLaneUnstaked(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Check if user has priority lane access
     * @param user Address to check
     * @return bool True if user has priority access
     */
    function hasPriorityAccess(address user) external view returns (bool) {
        PriorityStake storage stake = priorityStakes[user];
        return stake.isActive && 
               block.timestamp >= stake.lockStartTime + stake.lockDuration;
    }
    
    /**
     * @dev Get user's priority stake information
     * @param user Address to check
     * @return amount Staked amount
     * @return lockStartTime When stake was created
     * @return lockDuration How long stake is locked
     * @return isActive Whether stake is active
     * @return canUnstake Whether user can unstake now
     */
    function getPriorityStake(address user) external view returns (
        uint256 amount,
        uint256 lockStartTime,
        uint256 lockDuration,
        bool isActive,
        bool canUnstake
    ) {
        PriorityStake storage stake = priorityStakes[user];
        amount = stake.amount;
        lockStartTime = stake.lockStartTime;
        lockDuration = stake.lockDuration;
        isActive = stake.isActive;
        canUnstake = stake.isActive && 
                    block.timestamp >= stake.lockStartTime + stake.lockDuration;
    }
    
    /**
     * @dev Get station information
     * @param stationId ID of the station
     * @return stationAddress Address of the station
     * @return location Physical location
     * @return isActive Whether station is active
     * @return totalSwaps Total swaps completed at this station
     * @return totalTokensDistributed Total tokens distributed by this station
     */
    function getStation(uint256 stationId) external view returns (
        address stationAddress,
        string memory location,
        bool isActive,
        uint256 totalSwaps,
        uint256 totalTokensDistributed
    ) {
        Station storage station = stations[stationId];
        stationAddress = station.stationAddress;
        location = station.location;
        isActive = station.isActive;
        totalSwaps = station.totalSwaps;
        totalTokensDistributed = station.totalTokensDistributed;
    }
    
    /**
     * @dev Get user statistics
     * @param user Address to check
     * @return totalSwaps Total swaps completed by user
     * @return totalRewards Total tokens earned by user
     * @return currentBalance Current token balance
     */
    function getUserStats(address user) external view returns (
        uint256 totalSwaps,
        uint256 totalRewards,
        uint256 currentBalance
    ) {
        totalSwaps = userTotalSwaps[user];
        totalRewards = userTotalRewards[user];
        currentBalance = balanceOf(user);
    }
    
    /**
     * @dev Emergency function to deactivate a station (only owner)
     * @param stationId ID of the station to deactivate
     */
    function deactivateStation(uint256 stationId) external onlyOwner {
        require(stations[stationId].isActive, "Station already inactive");
        stations[stationId].isActive = false;
    }
    
    /**
     * @dev Override transfer function to prevent transfers during active staking
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        require(!priorityStakes[msg.sender].isActive, "Cannot transfer while staked");
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Override transferFrom function to prevent transfers during active staking
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        require(!priorityStakes[from].isActive, "Cannot transfer from staked address");
        return super.transferFrom(from, to, amount);
    }
}
