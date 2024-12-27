// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BaseStrategy} from "./BaseStrategy.sol";
import {Fondation} from "./Fondation.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";

/**
 * @title FakeStrategy
 * The FakeStrategy contract is an implementation of IFondationStrategy that simulate yield accrueing.
 * The contract owner can send fake yield by calling the addYFakeYield() function.
 */
contract FakeStrategy is BaseStrategy {

    uint256 private yield;
    
    constructor(Fondation _fondation, address _asset) BaseStrategy(_fondation, _asset) {}

    function retrieveYield() external override onlyFondation returns (uint256) {
        uint256 yieldToSend = yield;
        if (yield > 0) {
            // Transfer fake yield to caller
            bool result = IERC20(asset).transfer(msg.sender, yieldToSend);
            require(result, "retrieve yield failed");
        }
        yield = 0;
        return yieldToSend;
    }

    function addYFakeYield(uint256 _amount) external onlyOwner {
        require(_amount > 0, "You must specify an amount greater than 0");
        // Transfer fake yield from caller to FakeStrategy
        bool result = IERC20(asset).transferFrom(msg.sender, address(this), _amount);
        require(result, "add fake yield failed");
        yield += _amount;
    }
}