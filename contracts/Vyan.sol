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
        uint256 finalFee
    );
    




    // =================== STRUCTS ===================
    
    /**
     * @dev Represents a charging station in the network
     */
    struct Station {
        string id;              // Station identifier
        string name;            // Human-readable station name
        string location;        // Station location description
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
    }
    
    /**
     * @dev Represents a battery with essential metrics
     */
    struct Battery {
        uint256 id;                    // Unique battery identifier
        uint256 capacity;              // Battery capacity in kWh * 1000
        uint256 currentCharge;         // Current charge percentage (0-100)
        uint256 healthScore;           // Battery health (0-100, 100 = perfect)
        uint256 cycleCount;            // Number of charge cycles
        uint256 manufactureDate;       // Manufacturing timestamp
        string currentStationId;       // Current station ID (empty if with user)
        address currentOwner;          // Current owner/holder
        bool isAvailableForSwap;       // Availability for swapping
    }
    
    /**
     * @dev User tracking with essential fields
     */
    struct UserProfile {
        address userAddress;
        uint256 totalSwaps;
        uint256 totalSeiSpent;
        uint256[] ownedBatteries;    // Batteries currently owned by user
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
    
    // Platform configuration
    address public treasuryAddress;             // Platform treasury
    uint256 public platformFeePercentage = 5;  // 5% platform fee

    // =================== CONSTRUCTOR ===================
    
    constructor(
        address _treasuryAddress
    ) Ownable(msg.sender) {
        treasuryAddress = _treasuryAddress;
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
        newStation.latitude = _latitude;
        newStation.longitude = _longitude;
        newStation.operator = msg.sender;
        newStation.totalSlots = _totalSlots;
        newStation.availableSlots = _totalSlots;
        newStation.isActive = true;
        newStation.createdAt = block.timestamp;
        newStation.baseFee = _baseFee;
        newStation.rating = 5; // Default rating
        
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
        uint256 _capacity,
        uint256 _currentCharge,
        uint256 _healthScore,
        address _initialOwner
    ) external returns (uint256) {
        require(_healthScore <= 100, "Health score must be <= 100");
        require(_currentCharge <= 100, "Current charge must be <= 100");
        
        uint256 newBatteryId = _batteryIdCounter.current();
        _batteryIdCounter.increment();
        
        Battery storage newBattery = batteries[newBatteryId];
        newBattery.id = newBatteryId;
        newBattery.capacity = _capacity;
        newBattery.currentCharge = _currentCharge;
        newBattery.healthScore = _healthScore;
        newBattery.cycleCount = 0;
        newBattery.manufactureDate = block.timestamp;
        newBattery.currentOwner = _initialOwner;
        newBattery.isAvailableForSwap = true;
        
        batteryExists[newBatteryId] = true;
        userBatteries[_initialOwner].push(newBatteryId);
        
        // Initialize user profile if needed
        if (userProfiles[_initialOwner].userAddress == address(0)) {
            userProfiles[_initialOwner].userAddress = _initialOwner;
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
     * @dev Calculate swap fee based on battery characteristics (simplified for POC)
     */
    function calculateSwapFee(
        string memory stationId,
        uint256 batteryId
    ) public view stationMustExist(stationId) batteryMustExist(batteryId) returns (uint256) {
        Station memory station = stations[stationId];
        Battery memory battery = batteries[batteryId];
        
        uint256 baseFee = station.baseFee;
        
        // Simple health multiplier: Better health = higher fee
        // Health 0-100 maps to 80%-120% of base fee
        uint256 healthMultiplier = 80 + (battery.healthScore * 40 / 100);
        
        // Calculate final fee
        uint256 adjustedFee = (baseFee * healthMultiplier) / 100;
        
        return adjustedFee;
    }
    
    /**
     * @dev Perform battery swap at a station (simplified for POC)
     */
    function swapBattery(
        string memory stationId,
        uint256 userBatteryId
    ) external payable nonReentrant whenNotPaused stationMustExist(stationId) batteryMustExist(userBatteryId) {
        require(stations[stationId].isActive, "Station is not active");
        require(stations[stationId].availableSlots > 0, "No batteries available at station");
        require(batteries[userBatteryId].currentOwner == msg.sender, "Not battery owner");
        
        // Find the best available battery at the station
        uint256 bestBatteryId = _findBestBatteryForSwap(stationId, userBatteryId);
        require(bestBatteryId != 0, "No suitable battery available for swap");
        
        // Calculate swap fee
        uint256 swapFee = calculateSwapFee(stationId, bestBatteryId);
        require(msg.value >= swapFee, "Insufficient SEI for swap");
        
        // Process fees
        _processSwapFees(stationId, swapFee);
        
        // Refund excess SEI
        if (msg.value > swapFee) {
            (bool success, ) = msg.sender.call{value: msg.value - swapFee}("");
            require(success, "Refund failed");
        }
        
        // Perform the swap
        _performBatterySwap(msg.sender, stationId, userBatteryId, bestBatteryId);
        
        // Update user stats
        userProfiles[msg.sender].totalSwaps++;
        userProfiles[msg.sender].totalSeiSpent += swapFee;
        
        // Emit event
        emit BatterySwapped(msg.sender, stationId, userBatteryId, bestBatteryId, swapFee, block.timestamp);
        emit FeeCalculated(bestBatteryId, swapFee);
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
        // Remove station battery from station inventory
        _removeBatteryFromStation(stationId, stationBatteryId);
        
        // Add user battery to station inventory
        _addBatteryToStation(stationId, userBatteryId);
        
        // Update battery ownership
        batteries[userBatteryId].currentOwner = address(this); // Contract holds station batteries
        batteries[userBatteryId].currentStationId = stationId;
        
        batteries[stationBatteryId].currentOwner = user;
        batteries[stationBatteryId].currentStationId = "";
        
        // Update user battery arrays
        _removeBatteryFromUser(user, userBatteryId);
        _addBatteryToUser(user, stationBatteryId);
        
        // Update user profile battery arrays
        UserProfile storage userProfile = userProfiles[user];
        _removeBatteryFromArray(userProfile.ownedBatteries, userBatteryId);
        userProfile.ownedBatteries.push(stationBatteryId);
        
        // Increment cycle counts
        batteries[userBatteryId].cycleCount++;
        batteries[stationBatteryId].cycleCount++;
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
    
    /**
     * @dev Find the best available battery for swap at a station
     */
    function _findBestBatteryForSwap(string memory stationId, uint256 userBatteryId) internal view returns (uint256) {
        Station storage station = stations[stationId];
        Battery storage userBattery = batteries[userBatteryId];
        
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
        
        return bestBatteryId;
    }
    
    /**
     * @dev Process swap fees by transferring to treasury and operator
     */
    function _processSwapFees(string memory stationId, uint256 swapFee) internal {
        uint256 platformFee = (swapFee * platformFeePercentage) / 100;
        uint256 operatorFee = swapFee - platformFee;
        
        (bool success1, ) = treasuryAddress.call{value: platformFee}("");
        require(success1, "Platform fee transfer failed");
        
        (bool success2, ) = stations[stationId].operator.call{value: operatorFee}("");
        require(success2, "Operator fee transfer failed");
    }
    

    
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
            int256 latitude,
            int256 longitude,
            address operator,
            uint256 totalSlots,
            uint256 availableSlots,
            bool isActive,
            uint256 createdAt,
            uint256 baseFee,
            uint16 rating
        ) 
    {
        Station memory station = stations[stationId];
        return (
            station.name,
            station.location,
            station.latitude,
            station.longitude,
            station.operator,
            station.totalSlots,
            station.availableSlots,
            station.isActive,
            station.createdAt,
            station.baseFee,
            station.rating
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
            uint256 capacity,
            uint256 currentCharge,
            uint256 healthScore,
            uint256 cycleCount,
            uint256 manufactureDate,
            address currentOwner,
            string memory currentStationId,
            bool isAvailableForSwap
        ) 
    {
        Battery memory battery = batteries[batteryId];
        return (
            battery.capacity,
            battery.currentCharge,
            battery.healthScore,
            battery.cycleCount,
            battery.manufactureDate,
            battery.currentOwner,
            battery.currentStationId,
            battery.isAvailableForSwap
        );
    }
    


    // =================== GOVERNANCE FUNCTIONS ===================
    
    /**
     * @dev Update platform configuration (simplified for POC)
     */
    function updatePlatformConfig(
        uint256 _platformFeePercentage,
        address _treasuryAddress
    ) external onlyOwner {
        require(_platformFeePercentage <= 10, "Platform fee too high");
        
        platformFeePercentage = _platformFeePercentage;
        treasuryAddress = _treasuryAddress;
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
