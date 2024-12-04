// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Fondation is Ownable {

    uint public feesRate;
    uint public totalStaked = 0;

    event Staked(uint amount, uint when);
    event Unstaked(uint amount, uint when);

    /**
     * @dev Constructor that sets the fees rate for the contract.
     * @param _feesRate The initial fees rate to be set, expressed in 0.01 of %.
     */
    constructor(uint _feesRate) Ownable(msg.sender) {
        require(
            _feesRate > 0 && _feesRate <= 10000,
            "fees rate is expressed in 0.01 of % and should be between 0 and 10000"
        );

        feesRate = _feesRate;
    }
    
    function stake(uint _amount) public {
        
        require(_amount > 0, "You must specify an amount greater than 0");

        // TODO: Implement the stake function

        totalStaked += _amount;

        emit Staked(_amount, block.timestamp);
    }

    function unstake(uint _amount) public {
        
        require(_amount > 0, "You must specify an amount greater than 0");

        // TODO: Implement the unstake function

        totalStaked -= _amount;

        emit Unstaked(_amount, block.timestamp); // TODO: Calculate the right amount of unstaked wBTC
    }

    function exchangeRate() public view returns (uint) {

        // TODO: Implement the exchange rate function

    }

    function payout() public onlyOwner {

        // TODO: Implement the payout function

    }
}
