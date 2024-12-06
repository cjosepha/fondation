// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";

contract MockERC20 is IERC20 {

    address public transferedFromFrom;
    address public transferedFromTo;
    uint256 public transferedFromValue;

    address public approvedSpender;
    uint256 public approvedValue;

    address public transferedTo;
    uint256 public transferedValue;

    uint256 private fakeTotalSupply;
    uint256 private fakeBalance;
    uint256 private fakeAllowance;

    function setTotalSupply(uint256 _fakeTotalSupply) external {
        fakeTotalSupply = _fakeTotalSupply;
    }

    function setBalance(uint256 _fakeBalance) external {
        fakeBalance = _fakeBalance;
    }

    function setAllowance(uint256 _fakeAllowance) external {
        fakeAllowance = _fakeAllowance;
    }
    
    function totalSupply() external view override returns (uint256) {
        return fakeTotalSupply;
    }

    function balanceOf(
        address account
    ) external view override returns (uint256) {
        return fakeBalance;
    }

    function transfer(
        address to,
        uint256 value
    ) external override returns (bool) {
        transferedTo = to;
        transferedValue = value;
        return true;
    }

    function allowance(
        address owner,
        address spender
    ) external view override returns (uint256) {
        return fakeAllowance;
    }

    function approve(
        address spender,
        uint256 value
    ) external override returns (bool) {
        approvedSpender = spender;
        approvedValue = value;
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external override returns (bool) {
        transferedFromFrom = from;
        transferedFromTo = to;
        transferedFromValue = value;
        return true;
    }
}