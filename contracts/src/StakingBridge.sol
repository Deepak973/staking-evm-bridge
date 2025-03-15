// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/interfaces/IERC20.sol";

contract StakingBridge is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {

    using SafeERC20 for IERC20;
  

    enum StakingDuration {
        ONE_MONTH,    // 30 days
        SIX_MONTHS,   // 180 days
        ONE_YEAR,     // 365 days
        TWO_YEARS     // 730 days
    }

    struct Stake {
        address user;
        address token; // Address(0) for native asset (ETH)
        uint256 amount;
        uint256 startTime;
        StakingDuration duration;
        bool claimed;
    }

    uint256 public penaltyPercent;
    uint256 public bonusPercent;

    mapping(StakingDuration => uint256) public durationPeriods;

    mapping(address => Stake[]) public stakes;
    address public treasury;

    event Staked(address indexed user, address indexed token, uint256 amount, uint256 duration);
    event Unstaked(address indexed user, address indexed token, uint256 amount, bool early);
    event TreasuryUpdated(address indexed newTreasury);
    event PenaltyPercentUpdated(uint256 newPercent);
    event BonusPercentUpdated(uint256 newPercent);

    /// @dev Initialize function for upgradeable contract
    function initialize(address _treasury) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        treasury = _treasury;
        
        penaltyPercent = 20;
        bonusPercent = 5;

        durationPeriods[StakingDuration.ONE_MONTH] = 30 days;
        durationPeriods[StakingDuration.SIX_MONTHS] = 180 days;
        durationPeriods[StakingDuration.ONE_YEAR] = 365 days;
        durationPeriods[StakingDuration.TWO_YEARS] = 730 days;
    }

    /// @dev Update penalty percentage (only owner)
    function setPenaltyPercent(uint256 _newPercent) external onlyOwner {
        require(_newPercent <= 100, "Penalty cannot exceed 100%");
        penaltyPercent = _newPercent;
        emit PenaltyPercentUpdated(_newPercent);
    }

    /// @dev Update bonus percentage (only owner)
    function setBonusPercent(uint256 _newPercent) external onlyOwner {
        require(_newPercent <= 100, "Bonus cannot exceed 100%");
        bonusPercent = _newPercent;
        emit BonusPercentUpdated(_newPercent);
    }

    /// @dev Stake ERC-20 tokens
    function stakeERC20(address _token, uint256 _amount, StakingDuration _duration) external nonReentrant {
        require(_amount > 0, "Amount must be greater than zero");

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        stakes[msg.sender].push(Stake(msg.sender, _token, _amount, block.timestamp, _duration, false));

        emit Staked(msg.sender, _token, _amount, durationPeriods[_duration]);
    }

    /// @dev Stake native assets (ETH)
    function stakeETH(StakingDuration _duration) external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than zero");

        stakes[msg.sender].push(Stake(msg.sender, address(0), msg.value, block.timestamp, _duration, false));

        emit Staked(msg.sender, address(0), msg.value, durationPeriods[_duration]);
    }

    /// @dev Unstake tokens (with penalty if early)
    function unstake(uint256 _index) external nonReentrant {
        require(_index < stakes[msg.sender].length, "Invalid stake index");

        Stake storage stakeData = stakes[msg.sender][_index];
        require(!stakeData.claimed, "Already unstaked");

        uint256 amount = stakeData.amount;
        uint256 stakingPeriod = durationPeriods[stakeData.duration];
        bool early = block.timestamp < stakeData.startTime + stakingPeriod;

        if (early) {
            uint256 penalty = (amount * penaltyPercent) / 100;
            amount -= penalty;

            // Send penalty to treasury
            if (stakeData.token == address(0)) {
                payable(treasury).transfer(penalty);
            } else {
                IERC20(stakeData.token).safeTransfer(treasury, penalty);
            }
        } 
        else
        {
             // Transfer unstaked assets
        if (stakeData.token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(stakeData.token).safeTransfer(msg.sender, amount);
        }

        stakeData.claimed = true;
        }
          emit Unstaked(msg.sender, stakeData.token, amount, early);

       
    }

    /// @dev Update treasury address (only owner)
    function setTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid address");
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }

    /// @dev Process matured stakes for a user
    function processMaturedStakes(address user, uint256[] calldata stakeIndexes) external nonReentrant {
        for (uint256 i = 0; i < stakeIndexes.length; i++) {
            uint256 index = stakeIndexes[i];
            require(index < stakes[user].length, "Invalid stake index");
            
            Stake storage stakeData = stakes[user][index];
            require(!stakeData.claimed, "Already unstaked");
            
            uint256 stakingPeriod = durationPeriods[stakeData.duration];
            require(block.timestamp >= stakeData.startTime + stakingPeriod, "Stake not matured");

            uint256 amount = stakeData.amount;
            if (stakingPeriod >= 180 days) {
                uint256 bonus = (amount * bonusPercent) / 100;
                amount += bonus;
            }

            // Transfer matured stake
            if (stakeData.token == address(0)) {
                payable(user).transfer(amount);
            } else {
                IERC20(stakeData.token).safeTransfer(user, amount);
            }

            stakeData.claimed = true;
            emit Unstaked(user, stakeData.token, amount, false);
        }
    }

    function claimRewards (address user, uint256[] calldata stakeIndexes) external nonReentrant {
        for (uint256 i = 0; i < stakeIndexes.length; i++) {
            uint256 index = stakeIndexes[i];
            require(index < stakes[user].length, "Invalid stake index");
            
        }
    }

    /// @dev Allow contract to receive ETH
    receive() external payable {}
}
