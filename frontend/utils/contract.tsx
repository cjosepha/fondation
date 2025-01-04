'use client';

import { getAddress } from 'viem'
import {
    fondationAddress,
    stBTCAddress,
    wBTCAddress,
    aWBTCAddress,
    fakeStrategyAddress,
    USDCAddress,
    STBTC_DECIMALS,
    WBTC_DECIMALS,
    EXCHANGE_RATE_DECIMALS,
    USDC_DECIMALS
} from "@/constants"
import { parseUnits, formatUnits } from 'viem'
import { useAccount, useReadContract } from "wagmi";
import stBTCJson from "../../backend/artifacts/contracts/stBTC.sol/stBTC.json"
import wBTCJson from "../../backend/artifacts/contracts/wBTC.sol/wBTC.json"
import aWBTCJson from "../../backend/artifacts/contracts/aWBTC.sol/aWBTC.json"
import fondationJson from "../../backend/artifacts/contracts/Fondation.sol/Fondation.json"
import fakeStrategyJson from '../../backend/artifacts/contracts/FakeStrategy.sol/FakeStrategy.json'
import USDCJson from '../../backend/artifacts/contracts/USDC.sol/USDC.json'

export const fondation = {
    address: getAddress(fondationAddress),
    abi: fondationJson.abi
}

export const stBTC = {
    address: getAddress(stBTCAddress),
    abi: stBTCJson.abi
}

export const wBTC = {
    address: getAddress(wBTCAddress),
    abi: wBTCJson.abi
}

export const aWBTC = {
    address: getAddress(aWBTCAddress),
    abi: aWBTCJson.abi
}

export const USDC = {
    address: getAddress(USDCAddress),
    abi: USDCJson.abi
}

export const fakeStrategy = {
    address: getAddress(fakeStrategyAddress),
    abi: fakeStrategyJson.abi
}

export const parseWBTC = (amount: string) => {
    return parseUnits(amount, WBTC_DECIMALS)
}

export const formatWBTC = (amount: bigint) => {
    return formatUnits(amount, WBTC_DECIMALS)
}

export const parseStBTC = (amount: string) => {
    return parseUnits(amount, STBTC_DECIMALS)
}

export const parseUSDC = (amount: string) => {
    return parseUnits(amount, USDC_DECIMALS)
}

export const formatStBTC = (amount: bigint) => {
    return formatUnits(amount, STBTC_DECIMALS)
}

export const formatExchangeRate = (amount: bigint) => {
    return formatUnits(amount, EXCHANGE_RATE_DECIMALS)
}

export const formatFakeStrategyAsset = (amount: bigint) => {
    return formatUnits(amount, USDC_DECIMALS)
}

export function useIsOwner() {

    const { isConnected, address } = useAccount();

    const { data: owner, isLoading, error } = useReadContract({
        abi: fondation.abi,
        address: fondation.address,
        functionName: "owner",
    });

    const isOwner = isConnected && owner === address;

    return {
        isOwner,
        isLoading,
        error,
    };
}
