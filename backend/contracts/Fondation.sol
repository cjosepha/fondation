// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/Ownable.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import {IStBTC} from "./stBTC.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IAToken} from "@aave/core-v3/contracts/interfaces/IAToken.sol";
import {IFondationStrategy} from "./IFondationStrategy.sol";

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
    IFondationStrategy private strategy;

    uint256 private minimumHealthFactor = 2;

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
    constructor(uint _feesRate, IERC20 _wBTC, IAToken _aWBTC, IStBTC _stBTC, IPool _aavePool) {
        require(
            _feesRate > 0 && _feesRate <= 10000,
            "fees rate is expressed in 0.01 of % and should be between 0 and 10000"
        );

        feesRate = _feesRate;
        wBTC = _wBTC;
        aWBTC = _aWBTC;
        stBTC = _stBTC;
        aavePool = _aavePool;
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

            // Borrow the maximum possible amount of strategy asset
            aavePool.borrow(
                strategy.getAsset(),
                getMaximumPossibleBorrow(),
                2,
                0,
                address(this)
            );

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

        // Burn stBTC from user
        // This is an early check to revert the transaction if the user doesn't have enough stBTC
        stBTC.burn(msg.sender, _amount);

        uint rate = exchangeRate();
        uint wBTCAmount = _amount * rate / 1e19;
        
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

            // TODO: swap netYield for wBTC on UniSwap

            uint wBTCBalance = wBTC.balanceOf(address(this)); // TODO: get exact amount from swap result, to reduce gas

            supplyToPool(wBTCBalance);
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

    function getMaximumPossibleWithdraw() private view returns (uint256) {

    }

    function getMaximumPossibleBorrow() private view returns (uint256) {
        
    }

}
