// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IStBTC} from "../stBTC.sol";
import {MockERC20} from "./MockERC20.sol";

contract MockStBTC is MockERC20, IStBTC {

    address private mintedTo;
    uint256 private mintedAmount;

    address private burnedFrom;
    uint256 private burnedAmount;

    function mint(address _to, uint256 _amount) external override {
        mintedTo = _to;
        mintedAmount = _amount;
    }

    function burn(address _from, uint256 _amount) external override {
        burnedFrom = _from;
        burnedAmount = _amount;
    }
}