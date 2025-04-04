// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IFondationStrategy} from "./IFondationStrategy.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Fondation} from "./Fondation.sol";

/**
 * @title BaseStrategy
 * The BaseStrategy contract is the base implementation of IFondationStrategy with minimum logic.
 * Any IFondationStrategy implementation should inherit from this contract.
 */
abstract contract BaseStrategy is Ownable, IFondationStrategy {

    using SafeERC20 for IERC20;
    
    Fondation private fondation;
    address internal asset;
    uint8 internal decimals;

    modifier onlyFondation() {
        require(msg.sender == address(fondation), "Caller must be the Fondation contract");
        _;
    }

    constructor(Fondation _fondation, address _asset, uint8 _decimals) Ownable(msg.sender) {
        fondation = _fondation;
        asset = _asset;
        decimals = _decimals;
    }

    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return interfaceId == type(IFondationStrategy).interfaceId;
    }

    /**
     * Deposits a specified amount into the strategy.
     * @param _amount The amount to be deposited.
     */
    function deposit(uint256 _amount) public virtual override onlyFondation {
        
        require(_amount > 0, "You must specify an amount greater than 0");

        // Transfer strategy asset from Fondation to BaseStrategy
        IERC20(asset).safeTransferFrom(msg.sender, address(this), _amount);
    }

    /**
     * Decommissions the strategy, making it empty and inactive.
     * This function must be overridden by derived contracts and called at the end of the child implementation.
     * The child implementation must close all positions and get all the strategy asset back, before calling .
     */
    function decommission() public virtual override onlyFondation {

        // Get the amount of strategy asset available
        uint256 amount = IERC20(asset).balanceOf(address(this));

        // Transfer all strategy asset to Fondation
        IERC20(asset).safeTransfer(msg.sender, amount);
    }

    function getAsset() external view override returns (address) {
        return asset;
    }   

    function getDecimals() external view override returns (uint8) {
        return decimals;
    }

}