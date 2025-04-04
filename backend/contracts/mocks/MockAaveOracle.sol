// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAaveOracle} from "../Aave.sol";
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

}