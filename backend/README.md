# Fondation Hardhat Project

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
SOLIDITY_COVERAGE=true npx hardhat coverage
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Fondation.ts
npx hardhat ignition deploy ./ignition/modules/Fondation.ts --network sepolia --verify
```

## Description

The `Fondation` smart contract allows to stake wrapped Bitcoin `wBTC` and earn interests while keeping the advantages of being liquid.

When a user stakes some `wBTC` in `Fondation`, the contract mints the equivalent amount of `stBTC` to the user, according to the current exchange rate.

When a user unstakes some `stBTC` in `Fondation`, the contract burns those `stBTC` and sends to the user the equivalent amount of `wBTC` according to the current exchange rate.

The exchange rate is calculated by considering the total amount of wBTC the contract has in reserve, divided by the total supply of stBTC.

The Fondation contract takes a commission on the wBTC yields.

The challenge in this contract's logic is to calculate at any time the fees.

## Architecture



## 