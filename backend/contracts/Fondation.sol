// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/Ownable.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import {IStBTC} from "./stBTC.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IAToken} from "@aave/core-v3/contracts/interfaces/IAToken.sol";

contract Fondation is Ownable {

    IERC20 private wBTC;
    IAToken private aWBTC;
    IStBTC private stBTC;

    IPool private aavePool;

    uint public feesRate;
    uint public totalStaked = 0;

    event Staked(uint amount, uint when);
    event Unstaked(uint amount, uint when);

    /**
     * @dev Constructor that sets the fees rate for the contract.
     * @param _feesRate The initial fees rate to be set, expressed in 0.01 of %.
     */
    constructor(uint _feesRate, IERC20 _wBTC, IAToken _aWBTC, IStBTC _stBTC, IPool _aavePool) {
        require(
            _feesRate > 0 && _feesRate <= 10000,
            "fees rate is expressed in 0.01 of % and should be between 0 and 10000"
        );

        feesRate = _feesRate;
        wBTC = _wBTC;
        aWBTC = _aWBTC;
        stBTC = _stBTC;
        aavePool = _aavePool;
    }
    
    function stake(uint _amount) public {
        
        require(_amount > 0, "You must specify an amount greater than 0");

        // Transfert wBTC from user to Fondation
        wBTC.transferFrom(msg.sender, address(this), _amount);

        // Approve Pool to spend on behalf of Fondation
        bool approved = wBTC.approve(address(aavePool), _amount);
        require(approved, "wBTC approval failed");

        // Supply wBTC to Aave Pool
        aavePool.supply(
            address(wBTC),
            _amount,
            address(this),
            0
        );

        // Mint stBTC to user
        uint stBTCAmount = (_amount * exchangeRate())/100;
        stBTC.mint(msg.sender, stBTCAmount);

        totalStaked += _amount;

        emit Staked(_amount, block.timestamp);
    }

    function unstake(uint _amount) public {
        
        require(_amount > 0, "You must specify an amount greater than 0");

        // Burn stBTC from user
        stBTC.burn(msg.sender, _amount);

        // Withdraw wBTC from Aave Pool
        uint wBTCAmount = _amount / exchangeRate();
        aavePool.withdraw(
            address(wBTC),
            wBTCAmount,
            msg.sender
        );

        totalStaked -= wBTCAmount;

        emit Unstaked(wBTCAmount, block.timestamp); // TODO: Calculate the right amount of unstaked wBTC
    }

    /**
     * @dev Returns the current exchange rate.
     * @return The exchange rate as an unsigned integer expressed in 0.01 of %.
     */
    function exchangeRate() public pure returns (uint) {

        // TODO: Implement the exchange rate function

        return 100;
    }

    /**
     * @dev Transfers the contract's balance to the owner.
     * Can only be called by the contract owner.
     */
    function payout() public onlyOwner {

        // TODO: Implement the payout function

    }
}
