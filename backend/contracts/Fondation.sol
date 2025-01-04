// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/Ownable.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import {IStBTC} from "./stBTC.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IAToken} from "@aave/core-v3/contracts/interfaces/IAToken.sol";
import {IAaveOracle} from "@aave/core-v3/contracts/interfaces/IAaveOracle.sol";
import {IFondationStrategy} from "./IFondationStrategy.sol";
import {IUniswapV2Router02} from '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';

interface IFondation {} // For testing purposes

/**
 * @title Fondation
 * The Fondation contract is the user facade of the Fondation system.
 * Users interact with this contract to stake and unstake wBTC.
 */
contract Fondation is Ownable, IFondation {

    // Decimals
    uint8 private constant WBTC_DECIMALS = 8;
    uint8 private constant STBTC_DECIMALS = 18;
    uint8 private constant AAVE_BASE_CURRENCY_DECIMALS = 8;

    // Tokens
    IERC20 private immutable wBTC; // 8 decimals
    IAToken private immutable aWBTC; // 8 decimals
    IStBTC public stBTC; // 18 decimals, can be set only once

    // Dependencies
    IPool private immutable aavePool;
    IAaveOracle private immutable aaveOracle;
    IUniswapV2Router02 private immutable swapRouter;

    IFondationStrategy public strategy;

    uint256 private minimumHealthFactorBorrow = 4 * 1e18; // 18 decimals
    uint256 private minimumHealthFactorWithdraw = 2 * 1e18; // 18 decimals

    uint public immutable feesRate; // 0.01 of % so 4 decimals

    event Staked(uint amount, uint when); // Amount of wBTC that has been staked.
    event Unstaked(uint amount, uint when); // Amount of staked wBTC that has been unstaked.
    event FeesPaid(uint amount, uint when); // Amount of fees that has been paid to the owner of the contract.
    event YieldAccrued(uint amount, uint when); // Amount of yield that has been accrued to the contract.

    /**
     * @dev Constructor that sets the fees rate for the contract.
     * @param _feesRate The initial fees rate to be set, expressed in 0.01 of %.
     */
    constructor(uint _feesRate, IERC20 _wBTC, IAToken _aWBTC, IPool _aavePool, IAaveOracle _aaveOracle, IUniswapV2Router02 _swapRouter) {
        require(
            _feesRate > 0 && _feesRate <= 10000,
            "fees rate is expressed in 0.01 of % and should be between 0 and 10000"
        );

        feesRate = _feesRate;
        wBTC = _wBTC;
        aWBTC = _aWBTC;
        aavePool = _aavePool;
        aaveOracle = _aaveOracle;
        swapRouter = _swapRouter;
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

        depositMaxAssetToStrategy();

        // Mint stBTC to user
        uint stBTCAmount = _amount * 1e19 / rate;
        stBTC.mint(msg.sender, stBTCAmount);

        emit Staked(_amount, block.timestamp);
    }

    /**
     * Allows a user to unstake a specified amount of stBTC tokens.
     * The protocol will burn the stBTC tokens and return the equivalent amount of wBTC tokens to the caller, according to the current exchange rate.
     * @param _amount The amount of stBTC tokens to unstake on 18 decimals.
     */
    function unstake(uint _amount) external {
        
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
     * Set the strategy contract to be used.
     */
    function setStrategy(IFondationStrategy _strategy) external onlyOwner {
        
        require(address(_strategy) != address(strategy), "Strategy must be different from the current one");

        if (address(strategy) != address(0)) {
            // Decomission the current strategy
            strategy.decomission();
        }

        strategy = _strategy;

        // Send the strategy asset to the strategy contract
        depositMaxAssetToStrategy();
    }

    /**
     * Set the stBTC contract to be used.
     */
    function setStBTC(IStBTC _stBTC) external onlyOwner {
        require(address(stBTC) == address(0), "stBTC can be set only once");
        require(address(_stBTC) != address(0), "Invalid stBTC address");
        stBTC = _stBTC;
    }

    function accrueYield() external onlyOwner {
        
        require(isStrategyInitialized(), "A IFondationStrategy contract must be set");
        
        // Request the IFondationStrategy to transfer to the Fondation contract the yield accrued from its deposits
        // The number of decimals is the same as the strategy asset
        uint rawYield = strategy.retrieveYield();
        
        if (rawYield > 0) {

            uint fees = rawYield * feesRate / 1e4;
            uint netYield = rawYield - fees;
            IERC20 strategyAsset = getStrategyAsset();
            uint8 strategyAssetDecimals = strategy.getDecimals();

            // Transfer the fees to the owner of the contract
            require(strategyAsset.transfer(msg.sender, fees), "Fees transfer failed");

            // Price of wBTC in USD with 5% margin up, 8 decimals
            uint256 wBTCPrice = aaveOracle.getAssetPrice(address(wBTC)) * 105 / 1e2;

            // Minimum amount of wBTC to receive from the swap
            uint256 minWBTC = (netYield * 1e8 /* Aave base currency decimals */) / wBTCPrice;
            minWBTC = shiftAmount(minWBTC, strategyAssetDecimals, WBTC_DECIMALS);

            // Swap netYield amount strategy asset for wBTC on UniSwap
            strategyAsset.approve(address(swapRouter), netYield);
            address[] memory path = new address[](2);
            path[0] = address(strategyAsset);
            path[1] = address(wBTC);
            uint[] memory amounts = swapRouter.swapExactTokensForTokens(
                netYield,
                minWBTC,
                path,
                address(this),
                block.timestamp
            );

            require(amounts[0] == netYield, "net yield failed to be swapped to wBTC");

            supplyToPool(amounts[1]);

            emit FeesPaid(fees, block.timestamp);
            emit YieldAccrued(amounts[1], block.timestamp);
        }
    }

    function setBorrowHealthFactor(uint256 _minimumHealthFactor) external onlyOwner {
        minimumHealthFactorBorrow = _minimumHealthFactor;
    }

    function setWithdrawHealthFactor(uint256 _minimumHealthFactor) external onlyOwner {
        minimumHealthFactorWithdraw = _minimumHealthFactor;
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

    function depositMaxAssetToStrategy() private {
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
    }

    /**
     * Calculates the maximum possible amount of wBTC that can be withdrawn.
     * @return The maximum possible withdrawable amount of wBTC on 8 decimals.
     */
    function getMaximumPossibleWithdraw() public view returns (uint256) {

        // Fetch user account data from Aave
        (
            uint256 totalCollateralBase, // USD equivalent on 8 decimals
            uint256 totalDebtBase, // USD equivalent on 8 decimals
            , // availableBorrowsBase (ignored)
            uint256 currentLiquidationThreshold, // % on 2 decimals => ratio on 4 decimals
            , // ltv (ignored)
            uint256 healthFactor // ratio on 18 decimals
        ) = aavePool.getUserAccountData(address(this));

        // Ensure the health factor is not already below the minimum threshold
        require(healthFactor > minimumHealthFactorWithdraw, "Health factor is already below safe levels");

        // Get the current wBTC underlying asset balance (aWBTC) of the Fondation contract
        uint256 aWBTCBalance = aWBTC.balanceOf(address(this));

        // If there is no debt, the entire collateral can be withdrawn
        if (totalDebtBase == 0) {
            return aWBTCBalance;
        }

        // Minimum collateral that should be maintained to avoid liquidation (health factor = 1)
        uint256 minimumCollateralBase = (totalDebtBase * 1e4) / currentLiquidationThreshold;

        // Adjust this minimum collateral to consider the actual mimimum health factor
        minimumCollateralBase = (minimumCollateralBase * minimumHealthFactorWithdraw) / 1e18;

        if (minimumCollateralBase >= totalCollateralBase) {
            // No room left to withdraw while keeping HF >= minimumHealthFactorWithdraw
            return 0;
        }

        // Get the price of wBTC in USD on 8 decimals
        uint256 wBTCPrice = aaveOracle.getAssetPrice(address(wBTC));

        // Convert collateral amount back to wBTC units
        uint256 maxWithdrawAmount = ((totalCollateralBase - minimumCollateralBase) * 1e8) / wBTCPrice;

        return maxWithdrawAmount;
    }

    /**
     * Calculates the maximum amount of strategy asset that can be borrowed.
     * @return The maximum possible borrow amount of strategy asset in the asset units (asset decimals).
     */
    function getMaximumPossibleBorrow() private view returns (uint256) {
        
        // Fetch user account data from Aave
        (
            uint256 totalCollateralBase, // USD equivalent on 8 decimals
            uint256 totalDebtBase, // USD equivalent on 8 decimals
            uint256 availableBorrowsBase, // USD equivalent on 8 decimals
            uint256 currentLiquidationThreshold, // % on 2 decimals => ratio on 4 decimals
            , // ltv (ignored)
            uint256 healthFactor // ratio on 18 decimals
        ) = aavePool.getUserAccountData(address(this));

        // Ensure the health factor is not already below the minimum threshold
        require(healthFactor > minimumHealthFactorBorrow, "Health factor is already below safe levels");

        // If there is no collateral, nothing can be borrowed
        if (totalCollateralBase == 0) {
            return 0;
        }

        // Maximum debt allowed to avoid liquidation (health factor = 1)
        uint256 maxDebtAllowed = (totalCollateralBase * currentLiquidationThreshold) / 1e4;

        // Adjust this maximum debt to consider the actual mimimum health factor
        maxDebtAllowed = (maxDebtAllowed * 1e18) / minimumHealthFactorBorrow;
        
        if (maxDebtAllowed <= totalDebtBase) {
            // No room left to borrow while keeping HF >= minimumHealthFactorBorrow
            return 0;
        }

        uint256 maxBorrow = maxDebtAllowed - totalDebtBase;

        // Aave also enforces availableBorrowsBase, so we can't exceed that
        if (maxBorrow > availableBorrowsBase) {
            maxBorrow = availableBorrowsBase;
        }

        // Get the price of the strategy asset in USD on 8 decimals
        uint256 strategyAssetPrice = aaveOracle.getAssetPrice(strategy.getAsset());

        // Convert borrow amount to strategy asset amount
        maxBorrow = (maxBorrow * 1e8) / strategyAssetPrice;

        // Convert borrow amount to strategy asset decimals
        maxBorrow = shiftAaveBaseCurrencyAmount(maxBorrow, strategy.getDecimals());

        return maxBorrow;
    }

    /**
     * Converts an amount from the Aave base currency's decimals (8) to a specified number of decimals.
     * @param _amount8 The amount on 8 decimals.
     * @param _toDecimals The number of decimals to convert the amount to.
     * @return The converted amount in the specified number of decimals.
     */
    function shiftAaveBaseCurrencyAmount(uint256 _amount8, uint8 _toDecimals) private pure returns (uint256) {
        return shiftAmount(_amount8, 8, _toDecimals);
    }

    /**
     * Converts an amount from a number of decimals to a specified number of decimals.
     * @param _amount The amount on _fromDecimals decimals.
     * @param _fromDecimals The number of decimals of _amount.
     * @param _toDecimals The number of decimals to _amount to.
     * @return The converted amount in the specified number of decimals.
     */
    function shiftAmount(uint256 _amount, uint8 _fromDecimals, uint8 _toDecimals) private pure returns (uint256) {
        if (_toDecimals > _fromDecimals) {
            return _amount * (10 ** (_toDecimals - _fromDecimals));
        } else if (_toDecimals < 8) {
            return _amount / (10 ** (_fromDecimals - _toDecimals));
        } else {
            return _amount;
        }
    }

}
