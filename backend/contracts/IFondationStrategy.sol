// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IFondationStrategy {

    /**
     * Returns to the caller the asset which is accepted for deposit, withdraw and yield retrieving
     * @return An IERC20 token address
     */
    function getAsset() external view returns (address);

    /**
     * Returns to the caller the oracle contract which provides the BTC price against the asset price
     * @return An AggregatorV3Interface contract address
     */
    function getPriceFeed() external view returns (address);

    /**
     * Allow to deposit strategy asset
     * @param _amount The amount of strategy asset to deposit
     */
    function deposit(uint256 _amount) external;

    /**
     * Allow to withdraw strategy asset
     * @param _amount The amount of strategy asset to withdraw
     */
    function withdraw(uint256 _amount) external;

    /**
     * Allow to retrieve the current yield in strategy asset
     */
    function retrieveYield() external returns (uint256);

}