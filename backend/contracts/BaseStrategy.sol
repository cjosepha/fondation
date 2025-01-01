// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IFondationStrategy} from "./IFondationStrategy.sol";
import {Ownable} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/Ownable.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import {Fondation} from "./Fondation.sol";

/**
 * @title BaseStrategy
 * The BaseStrategy contract is the base implementation of IFondationStrategy with minimum logic.
 * Any IFondationStrategy implementation should inherit from this contract.
 */
abstract contract BaseStrategy is Ownable, IFondationStrategy {
    
    Fondation private fondation;
    address internal asset;
    uint8 internal decimals;

    modifier onlyFondation() {
        require(msg.sender == address(fondation), "Caller must be the Fondation contract");
        _;
    }

    constructor(Fondation _fondation, address _asset, uint8 _decimals) {
        fondation = _fondation;
        asset = _asset;
        decimals = _decimals;
    }

    function deposit(uint256 _amount) public virtual override onlyFondation {
        
        require(_amount > 0, "You must specify an amount greater than 0");

        // Transfer strategy asset from Fondation to BaseStrategy
        bool result = IERC20(asset).transferFrom(msg.sender, address(this), _amount);

        require(result, "deposit failed");
    }

    function withdraw(uint256 _amount) public virtual override onlyFondation {

        require(_amount > 0, "You must specify an amount greater than 0");

        // Transfer strategy asset from BaseStrategy to Fondation
        bool result = IERC20(asset).transfer(msg.sender, _amount);

        require(result, "withdraw failed");
    }

    function getAsset() external view override returns (address) {
        return asset;
    }   

    function getDecimals() external view override returns (uint8) {
        return decimals;
    }

}