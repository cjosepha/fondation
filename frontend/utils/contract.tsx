'use client';

import { getContract } from 'viem'
import { fondationAddress, stBTCAddress, wBTCAddress } from "@/constants"
import { publicClient } from "@/utils/client"
import { parseUnits } from 'viem'
import stBTCJson from "../../backend/artifacts/contracts/stBTC.sol/stBTC.json"
import wBTCJson from "../../backend/artifacts/contracts/wBTC.sol/wBTC.json"
import fondationJson from "../../backend/artifacts/contracts/Fondation.sol/Fondation.json"

export const fondation = getContract({
    address: fondationAddress,
    abi: fondationJson.abi,
    client: { public: publicClient }
})

export const stBTC = getContract({
    address: stBTCAddress,
    abi: stBTCJson.abi,
    client: { public: publicClient }
})

export const wBTC = getContract({
    address: wBTCAddress,
    abi: wBTCJson.abi,
    client: { public: publicClient }
})

export const parseWBTC = (amount: string) => {
    return parseUnits(amount, 8)
}

export const parseStBTC = (amount: string) => {
    return parseUnits(amount, 18)
}

