// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";

contract StakingBridge is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;

    /// @dev Staking duration enum
    enum StakingDuration {
        ONE_MONTH, // 30 days
        SIX_MONTHS, // 180 days
        ONE_YEAR, // 365 days
        TWO_YEARS // 730 days

    }

    /// @dev Stake struct
    struct Stake {
        address user;
        address token; // Address(0) for native asset (ETH)
        uint256 amount;
        uint256 startTime;
        StakingDuration duration;
        bool claimed;
        bool rewardsClaimed;
        bool allowedToClaimRewards;
    }

    /// @dev Penalty percentage
    uint256 public penaltyPercent;
    /// @dev Bonus percentage
    uint256 public bonusPercent;
    /// @dev CCIP router
    IRouterClient private s_router;
    /// @dev Staking duration periods
    mapping(StakingDuration => uint256) public durationPeriods;
    /// @dev Stakes
    mapping(address => Stake[]) public stakes;
    /// @dev Treasury address
    address public treasury;

    /// @dev Staked event
    event Staked(
        uint256 indexed stakeId, address indexed user, address indexed token, uint256 amount, uint256 duration
    );
    /// @dev Unstaked event
    event Unstaked(uint256 indexed stakeId, address indexed user, address indexed token, uint256 amount, bool early);
    /// @dev Claimed rewards event
    event ClaimedRewards(uint256 indexed stakeId, address indexed user, address indexed token, uint256 amount);
    /// @dev Treasury updated event
    event TreasuryUpdated(address indexed newTreasury);
    /// @dev Penalty percentage updated event
    event PenaltyPercentUpdated(uint256 newPercent);
    /// @dev Bonus percentage updated event
    event BonusPercentUpdated(uint256 newPercent);
    /// @dev Tokens transferred cross chain event
    event TokensTransferredCrossChain(
        bytes32 messageId,
        uint64 destinationChainSelector,
        address receiver,
        address token,
        uint256 amount,
        address nativeToken,
        uint256 nativeFee
    );

    /// @dev Initialize function for upgradeable contract
    /// @param _treasury The treasury address
    /// @param _router The CCIP router address
    function initialize(address _treasury, address _router) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        treasury = _treasury;
        s_router = IRouterClient(_router);

        penaltyPercent = 10;
        bonusPercent = 2;

        durationPeriods[StakingDuration.ONE_MONTH] = 30 days;
        durationPeriods[StakingDuration.SIX_MONTHS] = 180 days;
        durationPeriods[StakingDuration.ONE_YEAR] = 365 days;
        durationPeriods[StakingDuration.TWO_YEARS] = 730 days;
    }

    /// @dev Update penalty percentage (only owner)
    /// @param _newPercent The new penalty percentage
    function setPenaltyPercent(uint256 _newPercent) external onlyOwner {
        require(_newPercent <= 100, "Penalty cannot exceed 100%");
        penaltyPercent = _newPercent;
        emit PenaltyPercentUpdated(_newPercent);
    }

    /// @dev Update bonus percentage (only owner)
    /// @param _newPercent The new bonus percentage
    function setBonusPercent(uint256 _newPercent) external onlyOwner {
        require(_newPercent <= 100, "Bonus cannot exceed 100%");
        bonusPercent = _newPercent;
        emit BonusPercentUpdated(_newPercent);
    }

    /// @dev Update treasury address (only owner)
    /// @param _newTreasury The new treasury address
    function setTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid address");
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }

    /// @dev Stake ERC-20 tokens
    /// @param _token The token address
    /// @param _amount The amount of tokens to stake
    /// @param _duration The duration of the stake
    function stakeERC20(address _token, uint256 _amount, StakingDuration _duration) external nonReentrant {
        require(_amount > 0, "Amount must be greater than zero");

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        stakes[msg.sender].push(Stake(msg.sender, _token, _amount, block.timestamp, _duration, false, false, false));

        emit Staked(stakes[msg.sender].length - 1, msg.sender, _token, _amount, durationPeriods[_duration]);
    }

    /// @dev Stake native assets (ETH)
    /// @param _duration The duration of the stake
    function stakeETH(StakingDuration _duration) external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than zero");

        stakes[msg.sender].push(
            Stake(msg.sender, address(0), msg.value, block.timestamp, _duration, false, false, false)
        );

        emit Staked(stakes[msg.sender].length - 1, msg.sender, address(0), msg.value, durationPeriods[_duration]);
    }

    /// @dev Unstake tokens (with penalty if early)
    /// @param _index The index of the stake
    /// @notice This function is used to unstake token and will penalize the user if unstaked before the staking period ends
    function unstakeManually(uint256 _index) external nonReentrant {
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
                payable(msg.sender).transfer(amount);
                payable(treasury).transfer(penalty);
            } else {
                IERC20(stakeData.token).safeTransfer(treasury, penalty);
                IERC20(stakeData.token).safeTransfer(msg.sender, amount);
            }
        } else {
            // Transfer unstaked assets
            // case if not automatically unstaked
            if (stakeData.token == address(0)) {
                payable(msg.sender).transfer(amount);
            } else {
                IERC20(stakeData.token).safeTransfer(msg.sender, amount);
            }
        }
        //set claimed to true
        stakeData.claimed = true;
        //check if staking period is more than 180 days, user can claim rewards
        if (stakingPeriod > 180 days) {
            //if staking period is more than 180 days, user can claim rewards
            stakeData.allowedToClaimRewards = true;
        }
        emit Unstaked(stakes[msg.sender].length - 1, msg.sender, stakeData.token, amount, early);
    }

    /// @dev Process matured stakes for multiple user
    /// @param users The users addresses
    /// @param stakeIndexes The stake indexes
    /// @notice This function is used to process matured stakes for multiple users automatically
    function processMaturedStakes(address[] calldata users, uint256[][] calldata stakeIndexes)
        external
        onlyOwner
        nonReentrant
    {
        require(users.length == stakeIndexes.length, "Mismatched input lengths");
        for (uint256 u = 0; u < users.length; u++) {
            address user = users[u];

            for (uint256 i = 0; i < stakeIndexes[u].length; i++) {
                uint256 index = stakeIndexes[u][i];
                require(index < stakes[user].length, "Invalid stake index");

                Stake storage stakeData = stakes[user][index];
                require(!stakeData.claimed, "Already unstaked");

                uint256 stakingPeriod = durationPeriods[stakeData.duration];
                require(block.timestamp >= stakeData.startTime + stakingPeriod, "Stake not matured");

                uint256 amount = stakeData.amount;

                // Transfer matured stake
                if (stakeData.token == address(0)) {
                    payable(user).transfer(amount);
                } else {
                    IERC20(stakeData.token).safeTransfer(user, amount);
                }

                //check if staking period is more than 180 days, user can claim rewards
                if (stakingPeriod >= 180 days) {
                    stakeData.allowedToClaimRewards = true;
                }

                stakeData.claimed = true;
                emit Unstaked(index, user, stakeData.token, amount, false);
            }
        }
    }

    /// @dev Claim rewards for a stake
    /// @param _index The index of the stake
    function claimRewards(uint256 _index) external nonReentrant {
        require(_index < stakes[msg.sender].length, "Invalid stake index");
        Stake storage stakeData = stakes[msg.sender][_index];

        require(stakeData.allowedToClaimRewards, "Not allowed to claim rewards");

        uint256 amount = stakeData.amount;
        uint256 bonus = (amount * bonusPercent) / 100;
        amount += bonus;

        // Transfer bonus to user
        if (stakeData.token == address(0)) {
            payable(msg.sender).transfer(bonus);
        } else {
            IERC20(stakeData.token).safeTransfer(msg.sender, bonus);
        }
        //set rewards claimed to true
        stakeData.rewardsClaimed = true;
        emit ClaimedRewards(stakes[msg.sender].length - 1, msg.sender, stakeData.token, bonus);
    }

    /// @dev Get user stakes
    /// @param _user The user address
    /// @return stakes The user stakes
    function getUserStakes(address _user) external view returns (Stake[] memory) {
        return stakes[_user];
    }

    /// @dev Transfer tokens cross chain
    /// @param _destinationChainSelector The destination chain selector
    /// @param _receiver The receiver address
    /// @param _token The token address
    /// @param _amount The amount of tokens to transfer
    /// @return messageId The message ID
    /// @notice This function is used to transfer tokens cross chain and require approval from the token contract before calling this function
    function transferTokenCrossChain(
        uint64 _destinationChainSelector,
        address _receiver,
        address _token,
        uint256 _amount
    ) external payable returns (bytes32 messageId) {
        // address(0) means fees are paid in native gas
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(_receiver, _token, _amount, address(0));

        // Get the fee required to send the message
        uint256 fees = s_router.getFee(_destinationChainSelector, evm2AnyMessage);

        if (fees > msg.value) {
            revert("Not enough balance");
        }

        // approve the Router to spend tokens on contract's behalf. It will spend the amount of the given token
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        IERC20(_token).approve(address(s_router), _amount);

        // Send the message through the router and store the returned message ID
        messageId = s_router.ccipSend{value: fees}(_destinationChainSelector, evm2AnyMessage);

        // Emit an event with message details
        emit TokensTransferredCrossChain(
            messageId, _destinationChainSelector, _receiver, _token, _amount, address(0), fees
        );

        // Return the message ID
        return messageId;
    }

    /// @dev Build CCIP message
    /// @param _receiver The receiver address
    /// @param _token The token address
    /// @param _amount The amount of tokens to transfer
    /// @param _feeTokenAddress The fee token address
    /// @return evm2AnyMessage The EVM2AnyMessage struct
    function _buildCCIPMessage(address _receiver, address _token, uint256 _amount, address _feeTokenAddress)
        private
        pure
        returns (Client.EVM2AnyMessage memory)
    {
        // Set the token amounts
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({token: _token, amount: _amount});
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        return Client.EVM2AnyMessage({
            receiver: abi.encode(_receiver), // ABI-encoded receiver address
            data: "", // No data
            tokenAmounts: tokenAmounts, // The amount and type of token being transferred
            extraArgs: Client._argsToBytes(
                // Additional arguments, setting gas limit and allowing out-of-order execution.
                // Best Practice: For simplicity, the values are hardcoded. It is advisable to use a more dynamic approach
                // where you set the extra arguments off-chain. This allows adaptation depending on the lanes, messages,
                // and ensures compatibility with future CCIP upgrades. Read more about it here: https://docs.chain.link/ccip/best-practices#using-extraargs
                Client.EVMExtraArgsV2({
                    gasLimit: 0, // Gas limit for the callback on the destination chain
                    allowOutOfOrderExecution: true // Allows the message to be executed out of order relative to other messages from the same sender
                })
            ),
            // Set the feeToken to a feeTokenAddress, indicating specific asset will be used for fees
            feeToken: _feeTokenAddress
        });
    }

    /// @dev Estimate fee for cross chain
    /// @param _destinationChainSelector The destination chain selector
    /// @param _receiver The receiver address
    /// @param _token The token address
    /// @param _amount The amount of tokens to transfer
    /// @return fee The fee
    function estimateFeeForCrossChain(
        uint64 _destinationChainSelector,
        address _receiver,
        address _token,
        uint256 _amount
    ) external view returns (uint256) {
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(_receiver, _token, _amount, address(0));
        return s_router.getFee(_destinationChainSelector, evm2AnyMessage);
    }

    /// @dev Withdraw ERC-20 tokens sent by mistake
    /// @param _token The token address
    /// @param _amount The amount of tokens to withdraw
    function withdrawERC20(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(msg.sender, _amount);
    }

    /// @dev Withdraw ETH sent by mistake
    /// @param _amount The amount of ETH to withdraw
    function withdrawETH(uint256 _amount) external onlyOwner {
        payable(msg.sender).transfer(_amount);
    }

    /// @notice Allow contract to receive ETH
    receive() external payable {}
}
