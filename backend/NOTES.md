

## Decimals

### Pool.getUserAccountData()

- The `base` currency (USD) is on 8 decimals
- The healthFactor is on 1! decimals
- The percentages are on 2 decimals (so the scaling is on 4 decimals)

Example:

```
totalCollateralBase -> 32400000000 -> 324.00 USD -> 8 decimals
totalDebtBase -> 1009323300 -> 10.09 USD -> 8 decimals
availableBorrowsBase -> 21670676700 -> 216.70 USD ->  8 decimals
currentLiquidationThreshold -> 7500 -> 75% -> 2 decimals
ltv -> 7000 -> 70% -> 2 decimals
healthFactor -> 24075536550082614758 -> 24.07 -> 18 decimals
```

### Oracle.getAssetPrice()

The return value of the `getAssetPrice()` function is always on 8 decimals.
It's exepressed in the same base currency as `Pool.getUserAccountData()`.

```
asset ->  0x29f2D40B0605204364af54EC677bD022dA425d03 -> wBTC
result -> 6000000000000 -> 60_000 USD -> 8 decimals
```

```
asset ->  0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8 -> USDC
result -> 100000000 -> 1 USD -> 8 decimals
```

### Pool.borrow()

The `amount` parameters of the `borrow()` function is expressed in the number of decimals of the asset borrowed.

```
asset -> 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8 -> USDC
amount -> 10 -> 0.000010 -> 6 decimals
```

```
asset -> 0x29f2D40B0605204364af54EC677bD022dA425d03 -> wBTC
amount -> 10 -> 0.00000010 -> 8 decimals
```

