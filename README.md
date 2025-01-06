# FONDATION

## Liquid Staking For Bitcoin

Stake your wBTC and accrue yield by holding the stBTC you get in return.

Later, you can either:
   - Unstake your stBTC on `Fondation`, to retrieve an increased amount of wBTC from the same amount of stBTC you received
   - Sell your stBTC on the open market

### Frontend

The dApp is available at : https://fondation-one.vercel.app/

### Backend

The following `Fondation` smart contracts are deployed on Sepolia testnet:
  - Fondation : https://sepolia.etherscan.io/address/0xc90E62a2e0d63Fa423E74428dF288617b8EF2d49#code
  - FakeStrategy : https://sepolia.etherscan.io/address/0xbdCA2CbC0B8b38652117a47D6407Fe1c9b447252#code
  - stBTC : https://sepolia.etherscan.io/address/0x7C99E781454E6daA0038f96AB859D2AA49217882#code

The `Fondation` smart contract also interacts with the following existing contracts:
  - AAVE Pool : https://sepolia.etherscan.io/address/0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951#code
  - AAVE Oracle : https://sepolia.etherscan.io/address/0x2da88497588bf89281816106C7259e31AF45a663#code
  - UniSwap V2 Router : https://sepolia.etherscan.io/address/0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3#code
  - wBTC : https://sepolia.etherscan.io/address/0x29f2D40B0605204364af54EC677bD022dA425d03#code
  - aWBTC : https://sepolia.etherscan.io/address/0x1804Bf30507dc2EB3bDEbbbdd859991EAeF6EefF#code
  - USDC : https://sepolia.etherscan.io/address/0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8#code
