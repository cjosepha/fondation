// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IPool, IAToken} from "../Aave.sol";
import {MockERC20} from "./MockERC20.sol";
import "hardhat/console.sol";

/**
 * @title MockAavePool
 * @notice A mock implementation of the Aave Pool interface.
 * @dev This mock allows for testing of the Aave Pool contract by providing a controlled environment for simulating
 *      various scenarios and interactions with the Aave protocol.
 * @dev There is no need to use SafeERC20 because the mock is only used for testing purposes.
 */
contract MockAavePool is IPool {

    address public suppliedAsset;
    uint256 public suppliedAmount;
    address public suppliedOnBehalfOf;
    uint16 public suppliedReferralCode;

    address public borrowedAsset;
    uint256 public borrowedAmount;
    uint256 public borrowedInterestrateMode;
    uint16 public borrowedReferralCode;
    address public borrowedOnBehalfOf;

    address public withdrawnAsset;
    address public withdrawnTo;
    uint256 public withdrawnAmount;

    address public repaidAsset;
    uint256 public repaidAmount;
    address public repaidOnBehalfOf;
    uint256 public repaidInterestrateMode;

    IAToken internal aWBTC;
    MockERC20 internal wBTC;
    MockERC20 internal USDC;
    uint256 internal btcPrice;
    uint256 internal usdcPrice;

    uint256 private fakeDebtRate; // 4 decimals
    bool private transactionShouldFail;

    constructor(IAToken _aWBTC, MockERC20 _wBTC, MockERC20 _USDC, uint256 _btcPrice, uint256 _usdcPrice) {
        aWBTC = _aWBTC;
        wBTC = _wBTC;
        USDC = _USDC;
        btcPrice = _btcPrice;
        usdcPrice = _usdcPrice;
    }

    /**
     * Sets the fake debt rate for testing purposes.
     * This function is used to simulate a specific debt rate in the mock Aave pool.
     * @param _debtRate The fake debt rate to be set on 4 decimals.
     */
    function setFakeDebtRate(uint256 _debtRate) external {
        fakeDebtRate = _debtRate;
    }

    function setTransactionShouldFail(bool _shouldFail) external {
        transactionShouldFail = _shouldFail;
    }

    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external override {
        require(asset == address(wBTC), "MockAavePool: supplied asset should be wBTC");
        suppliedAsset = asset;
        suppliedAmount = amount;
        suppliedOnBehalfOf = onBehalfOf;
        suppliedReferralCode = referralCode;
        if (transactionShouldFail) { return; }
        wBTC.transferFrom(msg.sender, address(this), amount);
        aWBTC.mint(msg.sender, onBehalfOf, amount, 0);
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external override returns (uint256) {
        require(asset == address(wBTC), "MockAavePool: withdrawn asset should be wBTC");
        withdrawnAsset = asset;
        withdrawnAmount = amount;
        withdrawnTo = to;
        if (transactionShouldFail) { return 0; }
        aWBTC.burn(msg.sender, to, amount, 0);
        wBTC.transfer(to, amount);
        return amount;
    }

    function borrow(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        uint16 referralCode,
        address onBehalfOf
    ) external override {
        require(asset == address(USDC), "MockAavePool: borrowed asset should be USDC");
        borrowedAsset = asset;
        borrowedAmount = amount;
        borrowedInterestrateMode = interestRateMode;
        borrowedReferralCode = referralCode;
        borrowedOnBehalfOf = onBehalfOf;
        if (transactionShouldFail) { return; }
        USDC.transfer(msg.sender, amount);
    }

    function repay(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf
    ) external override returns (uint256) {
        require(asset == address(USDC), "MockAavePool: repaid asset should be USDC");
        repaidAsset = asset;
        repaidAmount = amount;
        repaidInterestrateMode = interestRateMode;
        repaidOnBehalfOf = onBehalfOf;
        if (transactionShouldFail) { return 0; }
        USDC.transferFrom(msg.sender, address(this), amount);
        return amount;
    }

    function getUserAccountData(
        address user
    )
        external
        view
        override
        returns (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        )
    {
        require(user == msg.sender, "MockAavePool: user must be the caller");
        currentLiquidationThreshold = 80 * 1e2;
        ltv = 70 * 1e2;
        totalCollateralBase = (wBTC.balanceOf(address(this)) * btcPrice) / 1e8; // result is already 8 decimals because wBTC has 8 decimals
        totalDebtBase = (totalCollateralBase * fakeDebtRate) / 1e4;
        availableBorrowsBase = (USDC.balanceOf(address(this)) * 1e2 * usdcPrice) / 1e8; // USDC is 6 decimals so upscaling to 8 decimals before conversion to USD
        healthFactor = totalDebtBase == 0 ? type(uint256).max : (totalCollateralBase * currentLiquidationThreshold) * 1e14 / totalDebtBase;
        return (
            totalCollateralBase,
            totalDebtBase,
            availableBorrowsBase,
            currentLiquidationThreshold,
            ltv,
            healthFactor
        );
    }

}