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

    IERC20 private wBTC;
    IAToken private aWBTC;
    IStBTC private stBTC;

    IPool private aavePool;
    IFondationStrategy private strategy;

    uint public feesRate;

    modifier onlyStrategy() {
        require(isStrategyInitialized(), "A IFondationStrategy contract must be set");
        require(msg.sender == address(strategy), "Caller must be the current IFondationStrategy contract");
        _;
    }

    event Staked(uint amount, uint when); // Amount of wBTC that has been staked.
    event Unstaked(uint amount, uint when); // Amount of staked wBTC that has been unstaked.
    event FeesPaid(uint amount, uint when); // Amount of fees that has been paid to the owner of the contract.

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
    
    function stake(uint _amount) public {
        
        require(_amount > 0, "You must specify an amount greater than 0");

        uint rate = exchangeRate();

        // Transfert wBTC from user to Fondation
        wBTC.transferFrom(msg.sender, address(this), _amount);

        supplyToPool(_amount);

        if (isStrategyInitialized()) {

            // TODO: borrow strategy asset from Aave Pool

            uint strategyAssetBalance = IERC20(strategy.getAsset()).balanceOf(address(this)); // TODO: get exact amount from borrow result, to reduce gas

            // Deposit strategy asset to the IFondationStrategy contract
            depositToStrategy(strategyAssetBalance);
        }

        // Mint stBTC to user
        uint stBTCAmount = _amount * 100_000_000 / rate;
        stBTC.mint(msg.sender, stBTCAmount);

        emit Staked(_amount, block.timestamp);
    }

    function unstake(uint _amount) public {
        
        require(isStrategyInitialized(), "A IFondationStrategy contract must be set");
        require(_amount > 0, "You must specify an amount greater than 0");

        uint rate = exchangeRate();
        uint wBTCAmount = _amount * rate / 100_000_000;

        // Burn stBTC from user
        // This will revert if the user doesn't have enough stBTC
        stBTC.burn(msg.sender, _amount);

        // Withdraw wBTC from the IFondationStrategy contract and send it to the caller
        strategy.withdraw(wBTCAmount);

        emit Unstaked(wBTCAmount, block.timestamp);
    }

    /**
     * @dev Returns the current exchange rate.
     * @return The exchange rate as an unsigned integer expressed in 0.00000001 of %.
     */
    function exchangeRate() public view returns (uint) {

        uint stBTCSupply = stBTC.totalSupply();
        uint aWBTCBalance = aWBTC.balanceOf(address(this));

        if (stBTCSupply == 0) {
            // The exchange rate should be 1.0
            return 100_000_000;
        }

        return aWBTCBalance * 100_000_000 / stBTCSupply;
    }

    /**
     * Set the strategy contract to be used, alongside with the asset to be used by the strategy.
     */
    function setStrategy(address _strategy) external {
        require(_strategy != address(0), "Invalid strategy address");
        strategy = IFondationStrategy(_strategy);
    }

    /**
     * Check if the strategy is initialized
     */
    function isStrategyInitialized() private view returns (bool) {
        return address(strategy) != address(0);
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

    function totalStaked() external view returns (uint) {
        return aWBTC.scaledBalanceOf(address(this));
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
        bool approved = IERC20(strategy.getAsset()).approve(address(strategy), _strategyAssetAmount);
        require(approved, "IFondationStrategy asset approval failed");
        
        // Deposit strategy asset to IFondationStrategy
        strategy.deposit(_strategyAssetAmount);
    }

    function checkMaximumPossibleUnstake() external view returns (uint) {

    }

}
