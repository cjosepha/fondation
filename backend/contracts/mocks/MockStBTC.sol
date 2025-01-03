// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IStBTC} from "../stBTC.sol";
import {MockERC20} from "./MockERC20.sol";
import {IFondation} from "../Fondation.sol";

contract MockStBTC is MockERC20, IStBTC {

    address public mintedTo;
    uint256 public mintedAmount;

    address public burnedFrom;
    uint256 public burnedAmount;

    IFondation private fondation;

    constructor(IFondation _fondation) {
        fondation = _fondation;
    }

    function mint(address _to, uint256 _amount) external override {
        require(msg.sender == address(fondation), "stBTC: caller must be the Fondation contract"); // Implementtaion of stBTC.onlyFondation()
        fakeBalances[_to] += _amount; // Implementtaion of ERC20._mint()
        fakeTotalSupply += _amount;
        mintedTo = _to;
        mintedAmount = _amount;
    }

    function burn(address _from, uint256 _amount) external override {
        require(msg.sender == address(fondation), "stBTC: caller must be the Fondation contract"); // Implementtaion of stBTC.onlyFondation()
        require(fakeBalances[_from] >= _amount, "stBTC: burn amount exceeds balance"); // Implementtaion of ERC20._burn()
        fakeBalances[_from] -= _amount;
        fakeTotalSupply -= _amount;
        burnedFrom = _from;
        burnedAmount = _amount;
    }
}