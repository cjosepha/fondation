// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IFondationStrategy {

    /**
     * Returns to the caller the asset which is accepted for deposit, withdraw and yield retrieving
     * @return An IERC20 token address
     */
    function getAsset() external view returns (address);

    /**
     * Returns to number of decimals of the accepted asset
     * @return The number of decimals
     */
    function getDecimals() external view returns (uint8);

    /**
     * Returns the current yield in strategy asset
     * @return The amount of yield in strategy asset
     */
    function getYieldAmount() external view returns (uint256);

    /**
     * Allow to deposit strategy asset
     * @param _amount The amount of strategy asset to deposit
     */
    function deposit(uint256 _amount) external;

    /**
     * Allow to decomission the contract.
     * This function ensure to withdraw all asset and transfer it to the caller,
     * closing any position and cleaning the strategy.
     */
    function decomission() external;

    /**
     * Allow to retrieve the current yield in strategy asset
     */
    function retrieveYield() external returns (uint256);

}