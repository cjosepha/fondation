// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAToken, IPool} from "../Aave.sol";
import {MockERC20} from "./MockERC20.sol";

contract MockAWBTC is MockERC20, IAToken {

    function scaledBalanceOf(
        address user
    ) external view override returns (uint256) {}

    function mint(
        address caller,
        address onBehalfOf,
        uint256 amount,
        uint256 index
    ) external override returns (bool) {
        require(caller == onBehalfOf, "MockAWBTC: caller must be equal to onBehalfOf");
        require(index == 0, "MockAWBTC: index must be 0");
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
        require(receiverOfUnderlying != from, "MockAWBTC: receiverOfUnderlying must be different from from");
        require(index == 0, "MockAWBTC: index must be 0");
        fakeBalances[from] -= amount;
        fakeTotalSupply -= amount;
    }

}