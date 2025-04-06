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
  - Fondation : https://sepolia.etherscan.io/address/0xaE4A3E14a51209D29892924fCdb39915B38d2113#code
  - FakeStrategy (USDC) : https://sepolia.etherscan.io/address/0xF54A1e99B20964961683B3691a893B775E1a1E13#code
  - FakeStrategy (EURS) : https://sepolia.etherscan.io/address/0x131C38E6870A1253D19e0a04ee7462a71D86A348#code
  - stBTC : https://sepolia.etherscan.io/address/0xCAB088433646c4d4e021B434EF55f15C1537Ee6F#code

The `Fondation` smart contract also interacts with the following existing contracts:
  - AAVE Pool : https://sepolia.etherscan.io/address/0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951#code
  - AAVE Oracle : https://sepolia.etherscan.io/address/0x2da88497588bf89281816106C7259e31AF45a663#code
  - UniSwap V2 Router : https://sepolia.etherscan.io/address/0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3#code
  - wBTC : https://sepolia.etherscan.io/address/0x29f2D40B0605204364af54EC677bD022dA425d03#code
  - aWBTC : https://sepolia.etherscan.io/address/0x1804Bf30507dc2EB3bDEbbbdd859991EAeF6EefF#code
  - USDC : https://sepolia.etherscan.io/address/0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8#code
  - EURS : https://sepolia.etherscan.io/address/0x6d906e526a4e2Ca02097BA9d0caA3c382F52278E#code
