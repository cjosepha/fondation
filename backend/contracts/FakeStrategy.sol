// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BaseStrategy} from "./BaseStrategy.sol";
import {Fondation} from "./Fondation.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
/**
 * @title FakeStrategy
 * The FakeStrategy contract is an implementation of IFondationStrategy that simulate yield accrueing.
 * The contract owner can send fake yield by calling the addYFakeYield() function.
 */
contract FakeStrategy is BaseStrategy {

    using SafeERC20 for IERC20;

    uint256 private yield;
    uint256 public depositedAmount; // For testing purposes

    constructor(
        Fondation _fondation,
        address _asset,
        uint8 _decimals
    ) BaseStrategy(_fondation, _asset, _decimals) {}

    function getYieldAmount() external view override returns (uint256) {
        return yield;
    }

    function deposit(uint256 _amount) public override onlyFondation {
        super.deposit(_amount);
        depositedAmount = _amount;
    }

    function decommission() public override onlyFondation {
        yield = 0;
        depositedAmount = 0;
        // In a real strategy, any position should be closed and all asset should be back before calling super.decomission()
        super.decommission();
    }

    function retrieveYield() external override onlyFondation returns (uint256) {
        uint256 yieldToSend = yield;
        if (yieldToSend > 0) {
            // Transfer fake yield to caller
            IERC20(asset).safeTransfer(msg.sender, yieldToSend);
        }
        yield = 0;
        return yieldToSend;
    }

    function addFakeYield(uint256 _amount) external onlyOwner {
        require(_amount > 0, "You must specify an amount greater than 0");
        // Transfer fake yield from caller to FakeStrategy
        IERC20(asset).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );
        yield += _amount;
    }
}