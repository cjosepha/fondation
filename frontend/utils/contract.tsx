'use client';

import { getAddress } from 'viem'
import {
    fondationAddress,
    stBTCAddress,
    wBTCAddress,
    aWBTCAddress,
    STBTC_DECIMALS,
    WBTC_DECIMALS,
    EXCHANGE_RATE_DECIMALS,
    RATE_DECIMALS
} from "@/constants"
import { parseUnits, formatUnits } from 'viem'
import { useAccount, useReadContract } from "wagmi";
import stBTCJson from "../../backend/ignition/deployments/chain-31337/artifacts/FondationModule#stBTC.json"
import wBTCJson from "../../backend/ignition/deployments/chain-31337/artifacts/FondationModule#wBTC.json"
import aWBTCJson from "../../backend/ignition/deployments/chain-31337/artifacts/FondationModule#aWBTC.json"
import fondationJson from "../../backend/ignition/deployments/chain-31337/artifacts/FondationModule#Fondation.json"
import fakeStrategyJson from '../../backend/ignition/deployments/chain-31337/artifacts/FondationModule#FakeStrategy.json'
import USDCJson from '../../backend/ignition/deployments/chain-31337/artifacts/FondationModule#USDC.json'

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

export const STABLE = {
    abi: USDCJson.abi
}

export const fakeStrategy = {
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

export const formatRate = (amount: bigint) => {
    return formatUnits(amount, RATE_DECIMALS)
}

export const formatPercent = (amount: bigint) => {
    return formatUnits(amount, RATE_DECIMALS-2)
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

export interface FondationEvent {
    amount: bigint
    when: Date
}
