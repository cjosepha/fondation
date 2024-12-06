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

    mapping(address => uint256) private fakeBalances;
    mapping(address => mapping(address => uint256)) private fakeAllowances;

    function setTotalSupply(uint256 _fakeTotalSupply) external {
        fakeTotalSupply = _fakeTotalSupply;
    }

    function setBalance(address account, uint256 balance) external {
        fakeBalances[account] = balance;
    }

    function setAllowance(address owner, address spender, uint256 amount) external {
        fakeAllowances[owner][spender] = amount;
    }
    
    function totalSupply() external view override returns (uint256) {
        return fakeTotalSupply;
    }

    function balanceOf(
        address account
    ) external view override returns (uint256) {
        return fakeBalances[account];
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
        return fakeAllowances[owner][spender];
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