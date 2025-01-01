// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAaveOracle} from "@aave/core-v3/contracts/interfaces/IAaveOracle.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {MockAWBTC} from "./MockAWBTC.sol";
import {MockERC20} from "./MockERC20.sol";

contract MockAaveOracle is IAaveOracle {

    mapping(address => uint256) private prices;

    constructor(
        MockERC20 _wBTC,
        uint256 _priceWBTC,
        MockERC20 _USDC,
        uint256 _priceUSDC
    ) {
        prices[address(_wBTC)] = _priceWBTC;
        prices[address(_USDC)] = _priceUSDC;
    }
    
    function getAssetPrice(
        address _asset
    ) external view override returns (uint256 price) {
        price = prices[_asset];
        require(price != 0, "MockAaveOracle: this asset has no price");
        return price;
    }

    function BASE_CURRENCY() external view override returns (address) {}

    function BASE_CURRENCY_UNIT() external view override returns (uint256) {}

    function ADDRESSES_PROVIDER()
        external
        view
        override
        returns (IPoolAddressesProvider)
    {}

    function setAssetSources(
        address[] calldata assets,
        address[] calldata sources
    ) external override {}

    function setFallbackOracle(address fallbackOracle) external override {}

    function getAssetsPrices(
        address[] calldata assets
    ) external view override returns (uint256[] memory) {}

    function getSourceOfAsset(
        address asset
    ) external view override returns (address) {}

    function getFallbackOracle() external view override returns (address) {}
}