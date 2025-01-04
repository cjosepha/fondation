// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {DataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IAToken} from "@aave/core-v3/contracts/interfaces/IAToken.sol";
import {MockERC20} from "./MockERC20.sol";

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

    uint256 private fakeDebtPercent; // Percentage on 2 decimals

    constructor(IAToken _aWBTC, MockERC20 _wBTC, MockERC20 _USDC, uint256 _btcPrice) {
        aWBTC = _aWBTC;
        wBTC = _wBTC;
        USDC = _USDC;
        btcPrice = _btcPrice;
    }

    /**
     * Sets the fake debt percentage for testing purposes.
     * This function is used to simulate a specific debt percentage in the mock Aave pool.
     * @param _debtPercent The fake debt percentage to be set on 2 decimals.
     */
    function setFakeDebtPercent(uint256 _debtPercent) external {
        fakeDebtPercent = _debtPercent;
    }
    
    function mintUnbacked(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external override {}

    function backUnbacked(
        address asset,
        uint256 amount,
        uint256 fee
    ) external override returns (uint256) {}

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
        wBTC.transferFrom(msg.sender, address(this), amount);
        aWBTC.mint(msg.sender, onBehalfOf, amount, 0);
    }

    function supplyWithPermit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode,
        uint256 deadline,
        uint8 permitV,
        bytes32 permitR,
        bytes32 permitS
    ) external override {}

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external override returns (uint256) {
        require(asset == address(wBTC), "MockAavePool: withdrawn asset should be wBTC");
        withdrawnAsset = asset;
        withdrawnAmount = amount;
        withdrawnTo = to;
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
        USDC.transferFrom(msg.sender, address(this), amount);
        return amount;
    }

    function repayWithPermit(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf,
        uint256 deadline,
        uint8 permitV,
        bytes32 permitR,
        bytes32 permitS
    ) external override returns (uint256) {}

    function repayWithATokens(
        address asset,
        uint256 amount,
        uint256 interestRateMode
    ) external override returns (uint256) {}

    function swapBorrowRateMode(
        address asset,
        uint256 interestRateMode
    ) external override {}

    function rebalanceStableBorrowRate(
        address asset,
        address user
    ) external override {}

    function setUserUseReserveAsCollateral(
        address asset,
        bool useAsCollateral
    ) external override {}

    function liquidationCall(
        address collateralAsset,
        address debtAsset,
        address user,
        uint256 debtToCover,
        bool receiveAToken
    ) external override {}

    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata interestRateModes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external override {}

    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 referralCode
    ) external override {}

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
        totalDebtBase = (totalCollateralBase * fakeDebtPercent) / 1e4;
        availableBorrowsBase = (totalCollateralBase * ltv) * 1e4;
        healthFactor = totalDebtBase == 0 ? type(uint256).max : (totalCollateralBase * currentLiquidationThreshold) * 1e4 / totalDebtBase;
        return (
            totalCollateralBase,
            totalDebtBase,
            availableBorrowsBase,
            currentLiquidationThreshold,
            ltv,
            healthFactor
        );
    }

    function initReserve(
        address asset,
        address aTokenAddress,
        address stableDebtAddress,
        address variableDebtAddress,
        address interestRateStrategyAddress
    ) external override {}

    function dropReserve(address asset) external override {}

    function setReserveInterestRateStrategyAddress(
        address asset,
        address rateStrategyAddress
    ) external override {}

    function setConfiguration(
        address asset,
        DataTypes.ReserveConfigurationMap calldata configuration
    ) external override {}

    function getConfiguration(
        address asset
    )
        external
        view
        override
        returns (DataTypes.ReserveConfigurationMap memory)
    {}

    function getUserConfiguration(
        address user
    ) external view override returns (DataTypes.UserConfigurationMap memory) {}

    function getReserveNormalizedIncome(
        address asset
    ) external view override returns (uint256) {}

    function getReserveNormalizedVariableDebt(
        address asset
    ) external view override returns (uint256) {}

    function getReserveData(
        address asset
    ) external view override returns (DataTypes.ReserveData memory) {}

    function finalizeTransfer(
        address asset,
        address from,
        address to,
        uint256 amount,
        uint256 balanceFromBefore,
        uint256 balanceToBefore
    ) external override {}

    function getReservesList()
        external
        view
        override
        returns (address[] memory)
    {}

    function getReserveAddressById(
        uint16 id
    ) external view override returns (address) {}

    function ADDRESSES_PROVIDER()
        external
        view
        override
        returns (IPoolAddressesProvider)
    {}

    function updateBridgeProtocolFee(
        uint256 bridgeProtocolFee
    ) external override {}

    function updateFlashloanPremiums(
        uint128 flashLoanPremiumTotal,
        uint128 flashLoanPremiumToProtocol
    ) external override {}

    function configureEModeCategory(
        uint8 id,
        DataTypes.EModeCategory memory config
    ) external override {}

    function getEModeCategoryData(
        uint8 id
    ) external view override returns (DataTypes.EModeCategory memory) {}

    function setUserEMode(uint8 categoryId) external override {}

    function getUserEMode(
        address user
    ) external view override returns (uint256) {}

    function resetIsolationModeTotalDebt(address asset) external override {}

    function MAX_STABLE_RATE_BORROW_SIZE_PERCENT()
        external
        view
        override
        returns (uint256)
    {}

    function FLASHLOAN_PREMIUM_TOTAL()
        external
        view
        override
        returns (uint128)
    {}

    function BRIDGE_PROTOCOL_FEE() external view override returns (uint256) {}

    function FLASHLOAN_PREMIUM_TO_PROTOCOL()
        external
        view
        override
        returns (uint128)
    {}

    function MAX_NUMBER_RESERVES() external view override returns (uint16) {}

    function mintToTreasury(address[] calldata assets) external override {}

    function rescueTokens(
        address token,
        address to,
        uint256 amount
    ) external override {}

    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external override {}
}