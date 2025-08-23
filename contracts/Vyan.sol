// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title Vyan
 * @dev A comprehensive smart contract system for transparent EV battery swapping
 * Features:
 * - Station management with real-time inventory tracking
 * - Battery tracking with health, quality, and carbon intensity metrics
 * - Transparent fee calculation based on battery characteristics
 * - Governance and authentication mechanisms
 * - Native SEI token payments with staking and carbon credits
 */
contract Vyan is Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // =================== EVENTS ===================
    event StationRegistered(
        string indexed stationId,
        address indexed operator,
        string name,
        string location,
        uint256 totalSlots
    );
    
    event BatterySwapped(
        address indexed user,
        string indexed stationId,
        uint256 indexed oldBatteryId,
        uint256 newBatteryId,
        uint256 swapFee,
        uint256 timestamp
    );
    
    event BatteryDeposited(
        string indexed stationId,
        uint256 indexed batteryId,
        address indexed depositor
    );
    
    event BatteryWithdrawn(
        string indexed stationId,
        uint256 indexed batteryId,
        address indexed withdrawer
    );
    
    event FeeCalculated(
        uint256 indexed batteryId,
        uint256 baseFee,
        uint256 qualityMultiplier,
        uint256 healthMultiplier,
        uint256 carbonMultiplier,
        uint256 finalFee
    );
    
    event StakeDeposited(address indexed user, uint256 amount);
    event StakeWithdrawn(address indexed user, uint256 amount);
    event CarbonCreditsAwarded(address indexed user, uint256 credits, uint256 seiReward);

    // =================== ENUMS ===================
    enum StationStatus {
        OK,
        AT_RISK,
        SHORTAGE
    }

    // =================== STRUCTS ===================
    
    /**
     * @dev Represents a charging station in the network
     */
    struct Station {
        string id;              // Station identifier (e.g., "A", "B", "C")
        string name;            // Human-readable station name
        string location;        // Station location description
        string physicalAddress; // Full physical address
        int256 latitude;        // Latitude * 1e6 for precision
        int256 longitude;       // Longitude * 1e6 for precision
        address operator;       // Station operator address
        uint256 totalSlots;     // Total battery slots at station
        uint256 availableSlots; // Currently available slots
        uint256[] batteries;    // Array of battery IDs at station
        bool isActive;          // Station operational status
        uint256 createdAt;      // Station registration timestamp
        uint256 baseFee;        // Base swap fee
        uint16 rating;          // Station rating (0-5)
        StationStatus status;   // Station status
    }
    
    /**
     * @dev Represents a battery with comprehensive metrics
     */
    struct Battery {
        uint256 id;                    // Unique battery identifier
        string manufacturer;           // Battery manufacturer
        string model;                  // Battery model
        uint256 capacity;              // Battery capacity in kWh * 1000
        uint256 currentCharge;         // Current charge percentage (0-100)
        uint256 healthScore;           // Battery health (0-100, 100 = perfect)
        uint256 qualityRating;         // Quality rating (1-5, 5 = premium)
        uint256 carbonIntensity;       // Carbon intensity score (0-100, 0 = cleanest)
        uint256 cycleCount;            // Number of charge cycles
        uint256 manufactureDate;       // Manufacturing timestamp
        string currentStationId;       // Current station ID (empty if with user)
        address currentOwner;          // Current owner/holder
        bool isAvailableForSwap;       // Availability for swapping
    }
    
    /**
     * @dev User profile and activity tracking
     */
    struct UserProfile {
        address userAddress;
        uint256 totalSwaps;
        uint256 totalSeiSpent;
        uint256 reputationScore;     // User reputation (0-100)
        uint256[] ownedBatteries;    // Batteries currently owned by user
        bool isVerified;             // KYC verification status
        uint256 joinedAt;
    }
    
    /**
     * @dev Staking information for users
     */
    struct StakeInfo {
        uint256 amount;              // Staked SEI amount
        uint256 timestamp;           // Stake start time
        uint256 rewardDebt;          // Rewards already claimed
        bool isActive;               // Stake status
    }
    
    /**
     * @dev Carbon credit tracking
     */
    struct CarbonCredit {
        uint256 amount;              // Carbon credits earned
        uint256 seiValue;            // SEI value of credits
        uint256 timestamp;           // When credits were earned
        string source;               // Source of clean energy
    }

    // =================== STATE VARIABLES ===================
    
    // Core mappings
    mapping(string => Station) public stations;
    mapping(uint256 => Battery) public batteries;
    mapping(address => UserProfile) public userProfiles;
    mapping(string => bool) public stationExists;
    mapping(uint256 => bool) public batteryExists;
    
    // Station management
    string[] public stationIds;
    mapping(address => string[]) public operatorStations;
    
    // Battery tracking
    Counters.Counter private _batteryIdCounter;
    mapping(address => uint256[]) public userBatteries;
    
    // Fee calculation parameters
    uint256 public constant QUALITY_MULTIPLIER_BASE = 100; // Base 100%
    uint256 public constant HEALTH_MULTIPLIER_BASE = 100;  // Base 100%
    uint256 public constant CARBON_MULTIPLIER_BASE = 100;  // Base 100%
    
    // Staking and rewards
    mapping(address => StakeInfo) public stakes;
    mapping(address => CarbonCredit[]) public carbonCredits;
    mapping(address => uint256) public totalCarbonCredits;
    uint256 public totalStaked;
    
    // Platform configuration
    address public treasuryAddress;             // Platform treasury
    uint256 public platformFeePercentage = 5;  // 5% platform fee
    uint256 public minimumStakeAmount;          // Minimum stake for station operators
    uint256 public swapFeeDiscount = 10;        // 10% discount for stakers
    uint256 public carbonCreditRewardRate = 0.001 ether; // 0.001 SEI per carbon credit

    // =================== CONSTRUCTOR ===================
    
    constructor(
        address _treasuryAddress,
        uint256 _minimumStakeAmount
    ) {
        treasuryAddress = _treasuryAddress;
        minimumStakeAmount = _minimumStakeAmount;
        _batteryIdCounter.increment(); // Start from battery ID 1
    }

    // =================== MODIFIERS ===================
    
    modifier onlyStationOperator(string memory stationId) {
        require(
            stations[stationId].operator == msg.sender,
            "Not station operator"
        );
        _;
    }
    
    modifier stationMustExist(string memory stationId) {
        require(stationExists[stationId], "Station does not exist");
        _;
    }
    
    modifier batteryMustExist(uint256 batteryId) {
        require(batteryExists[batteryId], "Battery does not exist");
        _;
    }

    // =================== STATION MANAGEMENT ===================
    
    /**
     * @dev Register a new charging station
     */
    function registerStation(
        string memory _stationId,
        string memory _name,
        string memory _location,
        string memory _physicalAddress,
        int256 _latitude,
        int256 _longitude,
        uint256 _totalSlots,
        uint256 _baseFee
    ) external {
        require(!stationExists[_stationId], "Station already exists");
        require(_totalSlots > 0, "Total slots must be greater than 0");
        require(_baseFee > 0, "Base fee must be greater than 0");
        
        Station storage newStation = stations[_stationId];
        newStation.id = _stationId;
        newStation.name = _name;
        newStation.location = _location;
        newStation.physicalAddress = _physicalAddress;
        newStation.latitude = _latitude;
        newStation.longitude = _longitude;
        newStation.operator = msg.sender;
        newStation.totalSlots = _totalSlots;
        newStation.availableSlots = _totalSlots;
        newStation.isActive = true;
        newStation.createdAt = block.timestamp;
        newStation.baseFee = _baseFee;
        
        stationExists[_stationId] = true;
        stationIds.push(_stationId);
        operatorStations[msg.sender].push(_stationId);
        
        emit StationRegistered(_stationId, msg.sender, _name, _location, _totalSlots);
    }
    
    /**
     * @dev Update station information (operator only)
     */
    function updateStation(
        string memory stationId,
        string memory _name,
        string memory _location,
        uint256 _baseFee
    ) external onlyStationOperator(stationId) {
        Station storage station = stations[stationId];
        station.name = _name;
        station.location = _location;
        station.baseFee = _baseFee;
    }
    
    /**
     * @dev Toggle station active status
     */
    function toggleStationStatus(string memory stationId) 
        external 
        onlyStationOperator(stationId) 
    {
        stations[stationId].isActive = !stations[stationId].isActive;
    }

    // =================== BATTERY MANAGEMENT ===================
    
    /**
     * @dev Register a new battery in the system
     */
    function registerBattery(
        string memory _manufacturer,
        string memory _model,
        uint256 _capacity,
        uint256 _currentCharge,
        uint256 _healthScore,
        uint256 _qualityRating,
        uint256 _carbonIntensity,
        address _initialOwner
    ) external returns (uint256) {
        require(_healthScore <= 100, "Health score must be <= 100");
        require(_qualityRating >= 1 && _qualityRating <= 5, "Quality rating must be 1-5");
        require(_carbonIntensity <= 100, "Carbon intensity must be <= 100");
        require(_currentCharge <= 100, "Current charge must be <= 100");
        
        uint256 newBatteryId = _batteryIdCounter.current();
        _batteryIdCounter.increment();
        
        Battery storage newBattery = batteries[newBatteryId];
        newBattery.id = newBatteryId;
        newBattery.manufacturer = _manufacturer;
        newBattery.model = _model;
        newBattery.capacity = _capacity;
        newBattery.currentCharge = _currentCharge;
        newBattery.healthScore = _healthScore;
        newBattery.qualityRating = _qualityRating;
        newBattery.carbonIntensity = _carbonIntensity;
        newBattery.cycleCount = 0;
        newBattery.manufactureDate = block.timestamp;
        newBattery.currentOwner = _initialOwner;

        newBattery.isAvailableForSwap = true;
        
        batteryExists[newBatteryId] = true;
        userBatteries[_initialOwner].push(newBatteryId);
        
        // Initialize user profile if needed
        if (userProfiles[_initialOwner].userAddress == address(0)) {
            userProfiles[_initialOwner].userAddress = _initialOwner;
            userProfiles[_initialOwner].joinedAt = block.timestamp;
        }
        userProfiles[_initialOwner].ownedBatteries.push(newBatteryId);
        
        return newBatteryId;
    }
    
    /**
     * @dev Update battery health and charge status
     */
    function updateBatteryStatus(
        uint256 batteryId,
        uint256 _currentCharge,
        uint256 _healthScore,
        uint256 _cycleCount
    ) external batteryMustExist(batteryId) {
        require(_currentCharge <= 100, "Current charge must be <= 100");
        require(_healthScore <= 100, "Health score must be <= 100");
        
        Battery storage battery = batteries[batteryId];
        battery.currentCharge = _currentCharge;
        battery.healthScore = _healthScore;
        battery.cycleCount = _cycleCount;
    }

    // =================== BATTERY SWAPPING LOGIC ===================
    
    /**
     * @dev Calculate swap fee based on battery characteristics
     */
    function calculateSwapFee(
        string memory stationId,
        uint256 batteryId
    ) public view stationMustExist(stationId) batteryMustExist(batteryId) returns (uint256) {
        Station memory station = stations[stationId];
        Battery memory battery = batteries[batteryId];
        
        uint256 baseFee = station.baseFee;
        
        // Quality multiplier: Higher quality = higher fee
        // Rating 1-5 maps to 80%-120% of base fee
        uint256 qualityMultiplier = 80 + (battery.qualityRating - 1) * 10;
        
        // Health multiplier: Better health = higher fee
        // Health 0-100 maps to 70%-130% of base fee
        uint256 healthMultiplier = 70 + (battery.healthScore * 60 / 100);
        
        // Carbon intensity multiplier: Lower carbon = higher fee (premium for clean energy)
        // Carbon 0-100 maps to 130%-70% of base fee (inverted)
        uint256 carbonMultiplier = 130 - (battery.carbonIntensity * 60 / 100);
        
        // Calculate final fee
        uint256 adjustedFee = (baseFee * qualityMultiplier * healthMultiplier * carbonMultiplier) / (100 * 100 * 100);
        
        return adjustedFee;
    }
    
    /**
     * @dev Perform battery swap at a station
     */
    function swapBattery(
        string memory stationId,
        uint256 userBatteryId
    ) external nonReentrant whenNotPaused stationMustExist(stationId) batteryMustExist(userBatteryId) {
        Station storage station = stations[stationId];
        Battery storage userBattery = batteries[userBatteryId];
        
        require(station.isActive, "Station is not active");
        require(station.availableSlots > 0, "No batteries available at station");
        require(userBattery.currentOwner == msg.sender, "Not battery owner");
        
        // Find the best available battery at the station (highest charge)
        uint256 bestBatteryId = 0;
        uint256 bestCharge = 0;
        
        for (uint256 i = 0; i < station.batteries.length; i++) {
            uint256 stationBatteryId = station.batteries[i];
            Battery memory stationBattery = batteries[stationBatteryId];
            
            if (stationBattery.isAvailableForSwap && 
                stationBattery.currentCharge > bestCharge &&
                stationBattery.currentCharge > userBattery.currentCharge) {
                bestBatteryId = stationBatteryId;
                bestCharge = stationBattery.currentCharge;
            }
        }
        
        require(bestBatteryId != 0, "No suitable battery available for swap");
        
        Battery storage stationBattery = batteries[bestBatteryId];
        
        // Calculate swap fee based on the station battery characteristics
        uint256 swapFee = calculateSwapFee(stationId, bestBatteryId);
        
        // Check user sent sufficient SEI
        require(msg.value >= swapFee, "Insufficient SEI for swap");
        
        // Calculate platform fee
        uint256 platformFee = (swapFee * platformFeePercentage) / 100;
        uint256 operatorFee = swapFee - platformFee;
        
        // Transfer fees
        (bool success1, ) = treasuryAddress.call{value: platformFee}("");
        require(success1, "Platform fee transfer failed");
        
        (bool success2, ) = station.operator.call{value: operatorFee}("");
        require(success2, "Operator fee transfer failed");
        
        // Refund excess SEI
        if (msg.value > swapFee) {
            (bool success3, ) = msg.sender.call{value: msg.value - swapFee}("");
            require(success3, "Refund failed");
        }
        
        // Perform the swap
        _performBatterySwap(msg.sender, stationId, userBatteryId, bestBatteryId);
        
        // Update user profile
        UserProfile storage userProfile = userProfiles[msg.sender];
        userProfile.totalSwaps++;
        userProfile.totalSeiSpent += swapFee;
        
        // Emit events
        emit FeeCalculated(
            bestBatteryId,
            station.baseFee,
            80 + (stationBattery.qualityRating - 1) * 10,
            70 + (stationBattery.healthScore * 60 / 100),
            130 - (stationBattery.carbonIntensity * 60 / 100),
            swapFee
        );
        
        emit BatterySwapped(
            msg.sender,
            stationId,
            userBatteryId,
            bestBatteryId,
            swapFee,
            block.timestamp
        );
    }
    
    /**
     * @dev Internal function to perform battery swap logic
     */
    function _performBatterySwap(
        address user,
        string memory stationId,
        uint256 userBatteryId,
        uint256 stationBatteryId
    ) internal {
        Station storage station = stations[stationId];
        Battery storage userBattery = batteries[userBatteryId];
        Battery storage stationBattery = batteries[stationBatteryId];
        
        // Remove station battery from station inventory
        _removeBatteryFromStation(stationId, stationBatteryId);
        
        // Add user battery to station inventory
        _addBatteryToStation(stationId, userBatteryId);
        
        // Update battery ownership
        userBattery.currentOwner = address(this); // Contract holds station batteries
        userBattery.currentStationId = stationId;
        
        stationBattery.currentOwner = user;
        stationBattery.currentStationId = "";
        
        // Update user battery arrays
        _removeBatteryFromUser(user, userBatteryId);
        _addBatteryToUser(user, stationBatteryId);
        
        // Update user profile battery arrays
        UserProfile storage userProfile = userProfiles[user];
        _removeBatteryFromArray(userProfile.ownedBatteries, userBatteryId);
        userProfile.ownedBatteries.push(stationBatteryId);
        
        // Increment cycle counts
        userBattery.cycleCount++;
        stationBattery.cycleCount++;
    }

    // =================== STAKING FUNCTIONS ===================
    
    /**
     * @dev Stake SEI to get swap fee discounts
     */
    function stake() external payable nonReentrant {
        require(msg.value > 0, "Must stake some SEI");
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        if (userStake.isActive) {
            userStake.amount += msg.value;
        } else {
            userStake.amount = msg.value;
            userStake.timestamp = block.timestamp;
            userStake.isActive = true;
        }
        
        totalStaked += msg.value;
        
        emit StakeDeposited(msg.sender, msg.value);
    }
    
    /**
     * @dev Unstake SEI (with cooldown period)
     */
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.isActive, "No active stake");
        require(userStake.amount >= amount, "Insufficient staked amount");
        require(block.timestamp >= userStake.timestamp + 7 days, "Stake is locked for 7 days");
        
        userStake.amount -= amount;
        if (userStake.amount == 0) {
            userStake.isActive = false;
        }
        
        totalStaked -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Unstake transfer failed");
        
        emit StakeWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Award carbon credits and SEI rewards for clean energy usage
     */
    function awardCarbonCredits(
        address user,
        uint256 credits,
        string memory energySource
    ) external onlyOwner {
        uint256 seiReward = credits * carbonCreditRewardRate;
        
        // Store carbon credit record
        carbonCredits[user].push(CarbonCredit({
            amount: credits,
            seiValue: seiReward,
            timestamp: block.timestamp,
            source: energySource
        }));
        
        totalCarbonCredits[user] += credits;
        
        // Send SEI reward if contract has sufficient balance
        if (address(this).balance >= seiReward && seiReward > 0) {
            (bool success, ) = user.call{value: seiReward}("");
            require(success, "Carbon credit reward transfer failed");
            emit CarbonCreditsAwarded(user, credits, seiReward);
        }
    }
    
    /**
     * @dev Calculate effective swap fee with staking discount
     */
    function calculateEffectiveSwapFee(
        string memory stationId,
        uint256 batteryId,
        address user,
        bool isCleanEnergy
    ) public view stationMustExist(stationId) batteryMustExist(batteryId) returns (uint256) {
        uint256 baseFee = calculateSwapFee(stationId, batteryId);
        
        // Apply staking discount if user has minimum stake
        if (stakes[user].isActive && stakes[user].amount >= minimumStakeAmount) {
            baseFee = (baseFee * (100 - swapFeeDiscount)) / 100;
        }
        
        // Apply clean energy discount
        if (isCleanEnergy) {
            baseFee = (baseFee * 80) / 100; // 20% discount for clean energy
        }
        
        return baseFee;
    }

    // =================== STATION INVENTORY MANAGEMENT ===================
    
    /**
     * @dev Deposit battery to station (for operators)
     */
    function depositBatteryToStation(
        string memory stationId,
        uint256 batteryId
    ) external onlyStationOperator(stationId) batteryMustExist(batteryId) {
        Station storage station = stations[stationId];
        Battery storage battery = batteries[batteryId];
        
        require(station.availableSlots > 0, "No available slots at station");
        require(battery.currentOwner == msg.sender, "Not battery owner");
        require(battery.isAvailableForSwap, "Battery not available");
        
        _addBatteryToStation(stationId, batteryId);
        
        battery.currentOwner = address(this);
        battery.currentStationId = stationId;
        
        _removeBatteryFromUser(msg.sender, batteryId);
        
        emit BatteryDeposited(stationId, batteryId, msg.sender);
    }
    
    /**
     * @dev Withdraw battery from station (for operators)
     */
    function withdrawBatteryFromStation(
        string memory stationId,
        uint256 batteryId
    ) external onlyStationOperator(stationId) batteryMustExist(batteryId) {
        Battery storage battery = batteries[batteryId];
        
        require(
            keccak256(bytes(battery.currentStationId)) == keccak256(bytes(stationId)),
            "Battery not at this station"
        );
        
        _removeBatteryFromStation(stationId, batteryId);
        
        battery.currentOwner = msg.sender;
        battery.currentStationId = "";
        
        _addBatteryToUser(msg.sender, batteryId);
        
        emit BatteryWithdrawn(stationId, batteryId, msg.sender);
    }

    // =================== HELPER FUNCTIONS ===================
    
    function _addBatteryToStation(string memory stationId, uint256 batteryId) internal {
        Station storage station = stations[stationId];
        station.batteries.push(batteryId);
        station.availableSlots--;
    }
    
    function _removeBatteryFromStation(string memory stationId, uint256 batteryId) internal {
        Station storage station = stations[stationId];
        
        for (uint256 i = 0; i < station.batteries.length; i++) {
            if (station.batteries[i] == batteryId) {
                station.batteries[i] = station.batteries[station.batteries.length - 1];
                station.batteries.pop();
                station.availableSlots++;
                break;
            }
        }
    }
    
    function _addBatteryToUser(address user, uint256 batteryId) internal {
        userBatteries[user].push(batteryId);
    }
    
    function _removeBatteryFromUser(address user, uint256 batteryId) internal {
        uint256[] storage userBats = userBatteries[user];
        
        for (uint256 i = 0; i < userBats.length; i++) {
            if (userBats[i] == batteryId) {
                userBats[i] = userBats[userBats.length - 1];
                userBats.pop();
                break;
            }
        }
    }
    
    function _removeBatteryFromArray(uint256[] storage array, uint256 batteryId) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == batteryId) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }

    // =================== VIEW FUNCTIONS ===================
    
    /**
     * @dev Get all station IDs
     */
    function getAllStationIds() external view returns (string[] memory) {
        return stationIds;
    }
    
    /**
     * @dev Get station batteries
     */
    function getStationBatteries(string memory stationId) 
        external 
        view 
        stationMustExist(stationId) 
        returns (uint256[] memory) 
    {
        return stations[stationId].batteries;
    }
    
    /**
     * @dev Get user batteries
     */
    function getUserBatteries(address user) external view returns (uint256[] memory) {
        return userBatteries[user];
    }
    
    /**
     * @dev Get detailed station information
     */
    function getStationDetails(string memory stationId) 
        external 
        view 
        stationMustExist(stationId) 
        returns (
            string memory name,
            string memory location,
            address operator,
            uint256 totalSlots,
            uint256 availableSlots,
            uint256 batteryCount,
            bool isActive,
            uint256 baseFee
        ) 
    {
        Station memory station = stations[stationId];
        return (
            station.name,
            station.location,
            station.operator,
            station.totalSlots,
            station.availableSlots,
            station.batteries.length,
            station.isActive,
            station.baseFee
        );
    }
    
    /**
     * @dev Get detailed battery information
     */
    function getBatteryDetails(uint256 batteryId) 
        external 
        view 
        batteryMustExist(batteryId) 
        returns (
            string memory manufacturer,
            string memory model,
            uint256 capacity,
            uint256 currentCharge,
            uint256 healthScore,
            uint256 qualityRating,
            uint256 carbonIntensity,
            address currentOwner,
            string memory currentStationId,
            bool isAvailableForSwap
        ) 
    {
        Battery memory battery = batteries[batteryId];
        return (
            battery.manufacturer,
            battery.model,
            battery.capacity,
            battery.currentCharge,
            battery.healthScore,
            battery.qualityRating,
            battery.carbonIntensity,
            battery.currentOwner,
            battery.currentStationId,
            battery.isAvailableForSwap
        );
    }
    
    /**
     * @dev Get user staking information
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 timestamp,
        bool isActive,
        bool canUnstake
    ) {
        StakeInfo memory userStake = stakes[user];
        return (
            userStake.amount,
            userStake.timestamp,
            userStake.isActive,
            userStake.isActive && block.timestamp >= userStake.timestamp + 7 days
        );
    }
    
    /**
     * @dev Get user carbon credits
     */
    function getUserCarbonCredits(address user) external view returns (
        uint256 totalCredits,
        CarbonCredit[] memory credits
    ) {
        return (totalCarbonCredits[user], carbonCredits[user]);
    }

    // =================== GOVERNANCE FUNCTIONS ===================
    
    /**
     * @dev Update platform configuration
     */
    function updatePlatformConfig(
        uint256 _platformFeePercentage,
        uint256 _minimumStakeAmount,
        address _treasuryAddress,
        uint256 _swapFeeDiscount,
        uint256 _carbonCreditRewardRate
    ) external onlyOwner {
        require(_platformFeePercentage <= 10, "Platform fee too high");
        require(_swapFeeDiscount <= 50, "Discount too high");
        
        platformFeePercentage = _platformFeePercentage;
        minimumStakeAmount = _minimumStakeAmount;
        treasuryAddress = _treasuryAddress;
        swapFeeDiscount = _swapFeeDiscount;
        carbonCreditRewardRate = _carbonCreditRewardRate;
    }
    
    /**
     * @dev Add funds to contract for carbon credit rewards
     */
    function addCarbonCreditFunds() external payable onlyOwner {
        // Allows owner to add SEI to contract for carbon credit rewards
    }
    
    /**
     * @dev Withdraw excess funds (emergency function)
     */
    function withdrawFunds(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Emergency pause/unpause
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
