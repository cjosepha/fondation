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
    uint8 private constant EXCHANGE_RATE_DECIMALS = 9;
    uint8 private constant HEALTH_FACTOR_DECIMALS = 18;
    uint8 private constant RATE_DECIMALS = 4;

    // Tokens
    IERC20 private immutable wBTC; // 8 decimals
    IAToken private immutable aWBTC; // 8 decimals
    IStBTC public stBTC; // 18 decimals, can be set only once

    // Dependencies
    IPool private immutable aavePool;
    IAaveOracle private immutable aaveOracle;
    IUniswapV2Router02 private immutable swapRouter;

    IFondationStrategy public strategy;

    uint256 private minimumHealthFactorBorrow = 4 * (10 ** HEALTH_FACTOR_DECIMALS);
    uint256 private minimumHealthFactorWithdraw = 2 * (10 ** HEALTH_FACTOR_DECIMALS);

    uint256 public immutable feesRate;

    event Staked(uint256 amount, uint256 when); // Amount of wBTC that has been staked.
    event Unstaked(uint256 amount, uint256 when); // Amount of staked wBTC that has been unstaked.
    event FeesPaid(uint256 amount, uint256 when); // Amount of fees that has been paid to the owner of the contract.
    event YieldAccrued(uint256 amount, uint256 when); // Amount of yield that has been accrued to the contract.

    /**
     * @dev Constructor that sets the fees rate for the contract.
     * @param _feesRate The initial fees rate to be set, expressed in 0.01 of %.
     */
    constructor(uint256 _feesRate, IERC20 _wBTC, IAToken _aWBTC, IPool _aavePool, IAaveOracle _aaveOracle, IUniswapV2Router02 _swapRouter) {
        require(
            _feesRate > 1 && _feesRate < 1 * (10 ** RATE_DECIMALS),
            "fees rate should be between 0 and 9999"
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
    
    function stake(uint256 _amount) external {
        
        require(_amount > 0, "You must specify an amount greater than 0");

        uint256 rate = exchangeRate();

        // Transfert wBTC from user to Fondation
        wBTC.transferFrom(msg.sender, address(this), _amount);

        supplyToPool(_amount);

        depositMaxAssetToStrategy();

        // Mint stBTC to user
        uint256 stBTCAmount = shiftAmount(_amount, WBTC_DECIMALS, STBTC_DECIMALS) * (10 ** EXCHANGE_RATE_DECIMALS) / rate;
        stBTC.mint(msg.sender, stBTCAmount);

        emit Staked(_amount, block.timestamp);
    }

    /**
     * Allows a user to unstake a specified amount of stBTC tokens.
     * The protocol will burn the stBTC tokens and return the equivalent amount of wBTC tokens to the caller, according to the current exchange rate.
     * @param _amount The amount of stBTC tokens to unstake on 18 decimals.
     */
    function unstake(uint256 _amount) external {
        
        require(_amount > 0, "You must specify an amount greater than 0");

        // Retrieving the exchange rate on EXCHANGE_RATE_DECIMALS decimals, before burning the stBTC
        uint256 rate = exchangeRate();

        // Burn stBTC from user
        // This will revert the transaction if the user doesn't have enough stBTC
        stBTC.burn(msg.sender, _amount);

        // Calculating the amount of wBTC to be withdrawn
        uint256 wBTCAmount = shiftAmount((_amount * rate) / (10 ** EXCHANGE_RATE_DECIMALS), STBTC_DECIMALS, WBTC_DECIMALS);
        
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
    function exchangeRate() public view returns (uint256) {

        uint256 stBTCSupply = stBTC.totalSupply();
        uint256 aWBTCBalance = aWBTC.balanceOf(address(this));

        if (stBTCSupply == 0) {
            // The exchange rate should be 1.0
            return (10 ** EXCHANGE_RATE_DECIMALS);
        }
        
        uint256 rate = shiftAmount(aWBTCBalance, WBTC_DECIMALS, STBTC_DECIMALS) * (10 ** STBTC_DECIMALS) / stBTCSupply;
        rate = shiftAmount(rate, STBTC_DECIMALS, EXCHANGE_RATE_DECIMALS);
        return rate;
    }

    function checkMaximumPossibleUnstake() external view returns (uint256) {

    }

    function totalStaked() external view returns (uint256) {
        return aWBTC.scaledBalanceOf(address(this));
    }

    /////////////////////////////
    // Contract Administration //
    /////////////////////////////

    /**
     * Set the strategy contract to be used.
     * If a new strategy is set, the current strategy will be decommissioned and the borrowed asset will be repaid.
     * It's important to call accrueYield() on the current strategy prior to set a new strategy, to retrieve any pending yield and processes fees.
     */
    function setStrategy(IFondationStrategy _strategy) external onlyOwner {
        
        require(address(_strategy) != address(strategy), "Strategy must be different from the current one");

        if (address(strategy) != address(0)) {
            
            // Decomission the current strategy
            strategy.decommission();
            
            // Repay the borrowed strategy asset
            IERC20 strategyAsset = getStrategyERC20();
            uint256 repaidAmount = strategyAsset.balanceOf(address(this));
            
            bool approved = strategyAsset.approve(address(aavePool), repaidAmount);
            require(approved, "Strategy asset approval failed");
            
            uint256 repaid = aavePool.repay(
                strategy.getAsset(),
                repaidAmount,
                2,
                address(this)
            );
            
            require(repaid == repaidAmount, "Repay failed");
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
        uint256 rawYield = strategy.retrieveYield();
        
        if (rawYield > 0) {

            uint256 fees = rawYield * feesRate / (10 ** RATE_DECIMALS);
            uint256 netYield = rawYield - fees;
            IERC20 strategyAsset = getStrategyERC20();
            uint8 strategyAssetDecimals = strategy.getDecimals();

            // Transfer the fees to the owner of the contract
            require(strategyAsset.transfer(msg.sender, fees), "Fees transfer failed");

            // Price of wBTC in USD with 5% margin up, 8 decimals
            uint256 wBTCPrice = aaveOracle.getAssetPrice(address(wBTC)) * 105 / 1e2;

            // Minimum amount of wBTC to receive from the swap
            uint256 minWBTC = (netYield * (10 ** AAVE_BASE_CURRENCY_DECIMALS)) / wBTCPrice;
            minWBTC = shiftAmount(minWBTC, strategyAssetDecimals, WBTC_DECIMALS);

            // Swap netYield amount strategy asset for wBTC on UniSwap
            strategyAsset.approve(address(swapRouter), netYield);
            address[] memory path = new address[](2);
            path[0] = address(strategyAsset);
            path[1] = address(wBTC);
            uint256[] memory amounts = swapRouter.swapExactTokensForTokens(
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

    function supplyToPool(uint256 _wBTCAmount) private {
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

    function depositToStrategy(uint256 _strategyAssetAmount) private {
        // Approve IFondationStrategy to spend on behalf of Fondation
        bool approved = getStrategyERC20().approve(address(strategy), _strategyAssetAmount);
        require(approved, "IFondationStrategy asset approval failed");
        
        // Deposit strategy asset to IFondationStrategy
        strategy.deposit(_strategyAssetAmount);
    }

    function getStrategyERC20() private view returns (IERC20) {
        return IERC20(strategy.getAsset());
    }

    function depositMaxAssetToStrategy() private {
        if (isStrategyInitialized()) {
            // Get the maximum possible amount of strategy asset that can be borrowed
            uint256 maximumBorrow = getMaximumPossibleBorrow();

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
            uint256 strategyAssetBalance = getStrategyERC20().balanceOf(address(this));

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
        if (healthFactor <= minimumHealthFactorWithdraw) {
            return 0;
        }

        // Get the current wBTC underlying asset balance (aWBTC) of the Fondation contract
        uint256 aWBTCBalance = aWBTC.balanceOf(address(this));

        // If there is no debt, the entire collateral can be withdrawn
        if (totalDebtBase == 0) {
            return aWBTCBalance;
        }

        // Minimum collateral that should be maintained to avoid liquidation (health factor = 1)
        uint256 minimumCollateralBase = (totalDebtBase * (10 ** RATE_DECIMALS)) / currentLiquidationThreshold;

        // Adjust this minimum collateral to consider the actual mimimum health factor
        minimumCollateralBase = (minimumCollateralBase * minimumHealthFactorWithdraw) / (10 ** HEALTH_FACTOR_DECIMALS);

        if (minimumCollateralBase >= totalCollateralBase) {
            // No room left to withdraw while keeping HF >= minimumHealthFactorWithdraw
            return 0;
        }

        // Get the price of wBTC in USD on 8 decimals
        uint256 wBTCPrice = aaveOracle.getAssetPrice(address(wBTC));

        // Convert collateral amount back to wBTC units
        uint256 maxWithdrawAmount = ((totalCollateralBase - minimumCollateralBase) * (10 ** AAVE_BASE_CURRENCY_DECIMALS)) / wBTCPrice;

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
        if (healthFactor <= minimumHealthFactorBorrow) {
            return 0;
        }

        // If there is no collateral, nothing can be borrowed
        if (totalCollateralBase == 0) {
            return 0;
        }

        // Maximum debt allowed to avoid liquidation (health factor = 1)
        uint256 maxDebtAllowed = (totalCollateralBase * currentLiquidationThreshold) / (10 ** RATE_DECIMALS);

        // Adjust this maximum debt to consider the actual mimimum health factor
        maxDebtAllowed = (maxDebtAllowed * (10 ** HEALTH_FACTOR_DECIMALS)) / minimumHealthFactorBorrow;
        
        if (maxDebtAllowed <= totalDebtBase) {
            // No room left to borrow while keeping HF >= minimumHealthFactorBorrow
            return 0;
        }

        uint256 maxBorrow = maxDebtAllowed - totalDebtBase;

        // Aave also enforces availableBorrowsBase with a 5% security margin, so we can't exceed that
        if (maxBorrow > availableBorrowsBase) {
            maxBorrow = (availableBorrowsBase * 95) / 1e2;
        }

        // Get the price of the strategy asset in USD on 8 decimals
        uint256 strategyAssetPrice = aaveOracle.getAssetPrice(strategy.getAsset());

        // Convert borrow amount to strategy asset amount
        maxBorrow = (maxBorrow * (10 ** AAVE_BASE_CURRENCY_DECIMALS)) / strategyAssetPrice;

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
        } else if (_toDecimals < _fromDecimals) {
            return _amount / (10 ** (_fromDecimals - _toDecimals));
        } else {
            return _amount;
        }
    }

}
