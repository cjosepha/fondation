// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract MockERC20 is IERC20 {

    using Strings for uint256;

    address public transferedFromFrom;
    address public transferedFromTo;
    uint256 public transferedFromAmount;

    address public approvedSpender;
    uint256 public approvedAmount;

    address public transferedTo;
    uint256 public transferedAmount;

    uint256 internal fakeTotalSupply;

    mapping(address => uint256) internal fakeBalances;
    mapping(address => mapping(address => uint256)) internal fakeAllowances;

    bool private transactionShouldFail;

    function addInterest(address account, uint256 amount) external {
        fakeBalances[account] += amount;
        fakeTotalSupply += amount;
    }

    function setTotalSupply(uint256 _fakeTotalSupply) external {
        fakeTotalSupply = _fakeTotalSupply;
    }

    function setBalance(address account, uint256 balance) external {
        fakeBalances[account] = balance;
    }

    function setAllowance(address owner, address spender, uint256 amount) external {
        fakeAllowances[owner][spender] = amount;
    }

    function setTransactionShouldFail(bool _shouldFail) external {
        transactionShouldFail = _shouldFail;
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
        if (transactionShouldFail) { return false; }
        uint256 balance = fakeBalances[msg.sender];
        require(
            balance >= value,
            string(
                abi.encodePacked(
                    "ERC20: transfer amount (",
                    value.toString(),
                    ") exceeds balance (",
                    balance.toString(),
                    ")"
                )
            )
        ); // Implementtaion of ERC20.transfer()
        fakeBalances[msg.sender] -= value;
        fakeBalances[to] += value;
        transferedTo = to;
        transferedAmount = value;
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
        if (transactionShouldFail) { return false; }
        fakeAllowances[msg.sender][spender] = value;
        approvedSpender = spender;
        approvedAmount = value;
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external override returns (bool) {
        if (transactionShouldFail) { return false; }
        require(fakeAllowances[from][msg.sender] >= value, "ERC20: spender not allowed for amount"); // Implementtaion of ERC20.transferFrom()
        require(fakeBalances[from] >= value, "ERC20: transfer amount exceeds balance"); // Implementtaion of ERC20.transferFrom()
        fakeBalances[from] -= value;
        fakeBalances[to] += value;
        transferedFromFrom = from;
        transferedFromTo = to;
        transferedFromAmount = value;
        return true;
    }
}