// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAToken} from "@aave/core-v3/contracts/interfaces/IAToken.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IAaveIncentivesController} from "@aave/core-v3/contracts/interfaces/IAaveIncentivesController.sol";
import {MockERC20} from "./MockERC20.sol";

contract MockAWBTC is MockERC20, IAToken {

    function scaledBalanceOf(
        address user
    ) external view override returns (uint256) {}

    function getScaledUserBalanceAndSupply(
        address user
    ) external view override returns (uint256, uint256) {}

    function scaledTotalSupply() external view override returns (uint256) {}

    function getPreviousIndex(
        address user
    ) external view override returns (uint256) {}

    function initialize(
        IPool pool,
        address treasury,
        address underlyingAsset,
        IAaveIncentivesController incentivesController,
        uint8 aTokenDecimals,
        string calldata aTokenName,
        string calldata aTokenSymbol,
        bytes calldata params
    ) external override {}

    function mint(
        address caller,
        address onBehalfOf,
        uint256 amount,
        uint256 index
    ) external override returns (bool) {
        fakeBalances[onBehalfOf] += amount;
        fakeTotalSupply += amount;
        return true;
    }

    function burn(
        address from,
        address receiverOfUnderlying,
        uint256 amount,
        uint256 index
    ) external override {
        fakeBalances[from] -= amount;
        fakeTotalSupply -= amount;
    }

    function mintToTreasury(uint256 amount, uint256 index) external override {}

    function transferOnLiquidation(
        address from,
        address to,
        uint256 value
    ) external override {}

    function transferUnderlyingTo(
        address target,
        uint256 amount
    ) external override {}

    function handleRepayment(
        address user,
        address onBehalfOf,
        uint256 amount
    ) external override {}

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {}

    function UNDERLYING_ASSET_ADDRESS()
        external
        view
        override
        returns (address)
    {}

    function RESERVE_TREASURY_ADDRESS()
        external
        view
        override
        returns (address)
    {}

    function DOMAIN_SEPARATOR() external view override returns (bytes32) {}

    function nonces(address owner) external view override returns (uint256) {}

    function rescueTokens(
        address token,
        address to,
        uint256 amount
    ) external override {}
}