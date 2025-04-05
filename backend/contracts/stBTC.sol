// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IFondation} from "./Fondation.sol";

interface IStBTC is IERC20 {
    function mint(address _to, uint256 _amount) external;
    function burn(address _from, uint256 _amount) external;
}

contract stBTC is ERC20, Ownable {
    IFondation public immutable fondation;

    modifier onlyFondation() {
        require(msg.sender == address(fondation), "Caller must be the Fondation contract");
        _;
    }

    constructor(IFondation _fondation) ERC20("Fondation Staked BTC", "stBTC") Ownable(msg.sender) {
        require(address(_fondation) != address(0), "Invalid Fondation address");
        fondation = _fondation;
    }

    function mint(address _to, uint256 _amount) external onlyFondation {
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external onlyFondation {
        _burn(_from, _amount);
    }
}