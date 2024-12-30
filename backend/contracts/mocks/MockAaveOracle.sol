// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAaveOracle} from "@aave/core-v3/contracts/interfaces/IAaveOracle.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IAToken} from "@aave/core-v3/contracts/interfaces/IAToken.sol";

contract MockAaveOracle is IAaveOracle {

    IAToken internal aWBTC;
    uint256 internal price;

    constructor(IAToken _aWBTC, uint256 _price) {
        aWBTC = _aWBTC;
        price = _price;
    }
    
    function getAssetPrice(
        address _asset
    ) external view override returns (uint256) {
        require(_asset == address(aWBTC), "MockAaveOracle: Only aWBTC is supported");
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