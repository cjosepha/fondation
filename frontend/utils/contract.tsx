'use client';

import { getContract } from 'viem'
import {
    fondationAddress,
    stBTCAddress,
    wBTCAddress,
    STBTC_DECIMALS,
    WBTC_DECIMALS,
    EXCHANGE_RATE_DECIMALS
} from "@/constants"
import { publicClient } from "@/utils/client"
import { parseUnits, formatUnits } from 'viem'
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
    return parseUnits(amount, WBTC_DECIMALS)
}

export const formatWBTC = (amount: bigint) => {
    return formatUnits(amount, WBTC_DECIMALS)
}

export const parseStBTC = (amount: string) => {
    return parseUnits(amount, STBTC_DECIMALS)
}

export const formatStBTC = (amount: bigint) => {
    return formatUnits(amount, STBTC_DECIMALS)
}

export const formatExchangeRate = (amount: bigint) => {
    return formatUnits(amount, EXCHANGE_RATE_DECIMALS)
}

