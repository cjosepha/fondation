// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/Ownable.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import {IStBTC} from "./stBTC.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IAToken} from "@aave/core-v3/contracts/interfaces/IAToken.sol";
import {IAaveOracle} from "@aave/core-v3/contracts/interfaces/IAaveOracle.sol";
import {IFondationStrategy} from "./IFondationStrategy.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title Fondation
 * The Fondation contract is the user facade of the Fondation system.
 * Users interact with this contract to stake and unstake wBTC.
 */
contract Fondation is Ownable {

    IERC20 private wBTC; // 8 decimals
    IAToken private aWBTC; // 8 decimals
    IStBTC private stBTC; // 18 decimals

    IPool private aavePool;
    IAaveOracle private aaveOracle;
    IFondationStrategy private strategy;

    uint256 private minimumHealthFactor = 2 * 1e18; // 2.0

    uint public feesRate;

    modifier onlyStrategy() {
        require(isStrategyInitialized(), "A IFondationStrategy contract must be set");
        require(msg.sender == address(strategy), "Caller must be the current IFondationStrategy contract");
        _;
    }

    event Staked(uint amount, uint when); // Amount of wBTC that has been staked.
    event Unstaked(uint amount, uint when); // Amount of staked wBTC that has been unstaked.
    event FeesPaid(uint amount, uint when); // Amount of fees that has been paid to the owner of the contract.
    event YieldAccrued(uint amount, uint when); // Amount of yield that has been accrued to the contract.

    /**
     * @dev Constructor that sets the fees rate for the contract.
     * @param _feesRate The initial fees rate to be set, expressed in 0.01 of %.
     */
    constructor(uint _feesRate, IERC20 _wBTC, IAToken _aWBTC, IStBTC _stBTC, IPool _aavePool, IAaveOracle _aaveOracle) {
        require(
            _feesRate > 0 && _feesRate <= 10000,
            "fees rate is expressed in 0.01 of % and should be between 0 and 10000"
        );

        feesRate = _feesRate;
        wBTC = _wBTC;
        aWBTC = _aWBTC;
        stBTC = _stBTC;
        aavePool = _aavePool;
        aaveOracle = _aaveOracle;
    }

    ///////////////////////////
    // User Facing Interface // 
    ///////////////////////////
    
    function stake(uint _amount) external {
        
        require(_amount > 0, "You must specify an amount greater than 0");

        uint rate = exchangeRate();

        // Transfert wBTC from user to Fondation
        wBTC.transferFrom(msg.sender, address(this), _amount);

        supplyToPool(_amount);

        if (isStrategyInitialized()) {

            // Get the maximum possible amount of strategy asset that can be borrowed
            uint maximumBorrow = getMaximumPossibleBorrow();

            if (maximumBorrow > 0) {
                // Borrow the maximum possible amount of strategy asset
                aavePool.borrow(
                    strategy.getAsset(),
                    maximumBorrow,
                    2,
                    0,
                    address(this)
                );
            }

            // Retrieve strategy asset balance of Fondation contract
            uint strategyAssetBalance = getStrategyAsset().balanceOf(address(this));

            if (strategyAssetBalance > 0) {
                // Deposit strategy asset to the IFondationStrategy contract
                depositToStrategy(strategyAssetBalance);
            }
        }

        // Mint stBTC to user
        uint stBTCAmount = _amount * 1e19 / rate;
        stBTC.mint(msg.sender, stBTCAmount);

        emit Staked(_amount, block.timestamp);
    }

    function unstake(uint _amount) external {
        
        require(isStrategyInitialized(), "A IFondationStrategy contract must be set");
        require(_amount > 0, "You must specify an amount greater than 0");

        // Retrieving the exchange rate, before buring the stBTC
        uint rate = exchangeRate();

        // Burn stBTC from user
        // This will revert the transaction if the user doesn't have enough stBTC
        stBTC.burn(msg.sender, _amount);

        // Calculating the amount of wBTC to be withdrawn
        uint wBTCAmount = (_amount * rate) / 1e19;
        
        require(wBTCAmount <= getMaximumPossibleWithdraw(), "Unstake amount exceeds maximum possible withdraw"); // TODO: Remove this requirement after implementing delayed unstake

        // Withdraw wBTC from Aave Pool
        aavePool.withdraw(
            address(wBTC),
            wBTCAmount,
            msg.sender
        );

        emit Unstaked(wBTCAmount, block.timestamp);
    }

    /**
     * Returns the current exchange rate.
     * @return The exchange rate as an unsigned integer expressed on 9 decimals.
     */
    function exchangeRate() public view returns (uint) {

        uint stBTCSupply = stBTC.totalSupply();
        uint aWBTCBalance = aWBTC.balanceOf(address(this));

        if (stBTCSupply == 0) {
            // The exchange rate should be 1.0
            return 1e9;
        }

        return aWBTCBalance * 1e19 / stBTCSupply; // = 10^( (18-8) + 9 ) = 10^(10+9) = 10^19
    }

    function checkMaximumPossibleUnstake() external view returns (uint) {

    }

    function totalStaked() external view returns (uint) {
        return aWBTC.scaledBalanceOf(address(this));
    }

    /////////////////////////////
    // Contract Administration //
    /////////////////////////////

    /**
     * Set the strategy contract to be used, alongside with the asset to be used by the strategy.
     */
    function setStrategy(IFondationStrategy _strategy) external onlyOwner {
        require(address(_strategy) != address(0), "Invalid strategy address");
        strategy = _strategy;
    }

    function accrueYield() external onlyOwner {
        
        require(isStrategyInitialized(), "A IFondationStrategy contract must be set");
        
        // Request the IFondationStrategy to transfer to the Fondation contract the yield accrued from its deposits
        uint rawYield = strategy.retrieveYield();
        
        if (rawYield > 0) {

            uint fees = rawYield * feesRate / 10_000;
            uint netYield = rawYield - fees;

            // Transfer the fees to the owner of the contract
            getStrategyAsset().transfer(msg.sender, fees);

            // TODO: swap netYield for wBTC on UniSwap

            uint wBTCBalance = wBTC.balanceOf(address(this)); // TODO: get exact amount from swap result, to reduce gas

            if (wBTCBalance > 0) {
                supplyToPool(wBTCBalance);
            }

            emit FeesPaid(fees, block.timestamp);
        }
    }

    function setMinimumHealthFactor(uint256 _minimumHealthFactor) external onlyOwner {
        minimumHealthFactor = _minimumHealthFactor;
    }

    /////////////////////// 
    // Private utilities //
    ///////////////////////

    /**
     * Check if the strategy is initialized
     */
    function isStrategyInitialized() private view returns (bool) {
        return address(strategy) != address(0);
    }

    function supplyToPool(uint _wBTCAmount) private {
        // Approve Pool to spend on behalf of Fondation
        bool approved = wBTC.approve(address(aavePool), _wBTCAmount);
        require(approved, "wBTC approval failed");

        // Supply wBTC to Aave Pool
        aavePool.supply(
            address(wBTC),
            _wBTCAmount,
            address(this),
            0
        );
    }

    function depositToStrategy(uint _strategyAssetAmount) private {
        // Approve IFondationStrategy to spend on behalf of Fondation
        bool approved = getStrategyAsset().approve(address(strategy), _strategyAssetAmount);
        require(approved, "IFondationStrategy asset approval failed");
        
        // Deposit strategy asset to IFondationStrategy
        strategy.deposit(_strategyAssetAmount);
    }

    function getStrategyAsset() private view returns (IERC20) {
        return IERC20(strategy.getAsset());
    }

    function getStrategyPriceFeed() private view returns (AggregatorV3Interface) {
        return AggregatorV3Interface(strategy.getPriceFeed());
    }

    function getMaximumPossibleWithdraw() public view returns (uint256) {

        // Fetch user account data from Aave
        (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            , // availableBorrowsBase (ignored)
            uint256 currentLiquidationThreshold,
            , // ltv (ignored)
            uint256 healthFactor
        ) = aavePool.getUserAccountData(address(this));

        // Ensure the health factor is not already below the minimum threshold
        require(healthFactor > minimumHealthFactor, "Health factor is already below safe levels");

        // Get the current wBTC underlying asset balance (aWBTC) of the Fondation contract
        uint256 aWBTCBalance = aWBTC.balanceOf(address(this));

        // If there is no debt, the entire collateral can be withdrawn
        if (totalDebtBase == 0) {
            return aWBTCBalance;
        }

        // Calculate the maximum collateral that can be withdrawn while maintaining the target health factor
        uint256 maxWithdrawCollateralBase = totalCollateralBase - ((totalDebtBase * minimumHealthFactor) / 1e18); // TODO: consider currentLiquidationThreshold in the calculation

        // Get the price of aWBTC in USD
        uint256 priceOfaWBTC = aaveOracle.getAssetPrice(address(aWBTC));

        // Convert collateral amount back to wBTC units
        uint256 maxWithdrawAmountInSatoshi = (maxWithdrawCollateralBase * 1e8) / priceOfaWBTC;

        // We can't withdraw more than the effective balance of the contract
        if (maxWithdrawAmountInSatoshi > aWBTCBalance) {
            maxWithdrawAmountInSatoshi = aWBTCBalance;
        }

        return maxWithdrawAmountInSatoshi;
    }

    function getMaximumPossibleBorrow() private view returns (uint256) {
        
        // Fetch user account data from Aave
        (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            , // ltv (ignored)
            uint256 healthFactor
        ) = aavePool.getUserAccountData(address(this));

        // Ensure the health factor is not already below the minimum threshold
        require(healthFactor > minimumHealthFactor, "Health factor is already below safe levels");

        // If there is no collateral, nothing can be borrowed
        if (totalCollateralBase == 0) {
            return 0;
        }

        // We want final HF >= minimumHealthFactor
        //    In this simplified approach: HF = totalCollateral / totalDebt
        //    => totalDebt <= totalCollateral / minHF
        //    => additionalBorrow = (totalCollateral / minHF) - totalDebt
        //
        //    Because totalCollateralBase, totalDebtBase, and minimumHealthFactor
        //    are all in 1e18 scale, we must do careful integer math:
        //
        //    maxDebt = (totalCollateralBase * 1e18) / minimumHealthFactor
        //    additionalBorrow = maxDebt - totalDebtBase

        uint256 maxDebtAllowed = (totalCollateralBase * 1e18) / minimumHealthFactor;
        if (maxDebtAllowed <= totalDebtBase) {
            // No room left to borrow while keeping HF >= minimumHealthFactor
            return 0;
        }
        uint256 additionalBorrow = maxDebtAllowed - totalDebtBase;

        // Aave also enforces availableBorrowsBase, so we can't exceed that
        if (additionalBorrow > availableBorrowsBase) {
            additionalBorrow = availableBorrowsBase;
        }

        return additionalBorrow;
    }

}
