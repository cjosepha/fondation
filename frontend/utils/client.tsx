'use client'

import { createPublicClient, http } from 'viem'
import { hardhat, sepolia } from 'viem/chains'
 
export const publicClient = createPublicClient({ 
  chain: sepolia, // or hardhat
  transport: http("https://holesky.infura.io/v3/44a639d76d6c43c9845c5e780f0e522a")
});