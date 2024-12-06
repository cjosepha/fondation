// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import {ERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/ERC20.sol";
import {Ownable} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/Ownable.sol";

interface IStBTC is IERC20 {
    function mint(address _to, uint256 _amount) external;
    function burn(address _from, uint256 _amount) external;
}

contract stBTC is ERC20, Ownable {
    
    constructor() ERC20("Fondation Staked BTC", "stBTC") {}

    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external onlyOwner {
        _burn(_from, _amount);
    }
}