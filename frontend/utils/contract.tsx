'use client';

import { getContract } from 'viem'
import { contractAddress, contractAbi } from "@/constants"
import { publicClient } from "@/utils/client"


export const contract = getContract({
    address: contractAddress,
    abi: contractAbi,
    client: { public: publicClient }
})