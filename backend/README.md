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

When a user stakes some `wBTC` in `Fondation`, the contract mints the equivalent amount of `stBTC` according to the current exchange rate and sends it to the user.

When a user unstakes some `stBTC` in `Fondation`, the contract burns those `stBTC` and sends to the user the equivalent amount of `wBTC` according to the current exchange rate.

The exchange rate is calculated by considering the total supply of stBTC, divided by the total amount of wBTC the contract has in reserve (which includes the interests)

## 