import { Address, decodeEventLog, Log, parseUnits } from "viem";

export interface Event {
    eventName: string;
    args: any;
}

export function decodeEventFromLogs(logs: Log[], index: number, contract: any): Event {
    return decodeEventLog({
        abi: contract.abi,
        data: logs[index].data,
        topics: logs[index].topics
    });
}

export async function setBalanceAndAllowance(token: any, owner: Address, spender: Address, amount: bigint) {
    await token.write.setBalance([owner, amount]);
    await token.write.setAllowance([owner, spender, amount]);
}

export function toBigInt(stringNumber: string): bigint {
    return parseUnits(stringNumber, 18);
}

export function toBigIntRate(stringNumber: string): bigint {
    return parseUnits(stringNumber, 4);
}

export function toBigIntUSDC(stringNumber: string): bigint {
    return parseUnits(stringNumber, 6);
}

export function toBigIntWBTC(stringNumber: string): bigint {
    return parseUnits(stringNumber, 8);
}

export function toBigIntAaveBaseCurrency(stringNumber: string): bigint {
    return parseUnits(stringNumber, 8);
}

export function toBigIntExchangeRate(stringNumber: string): bigint {
    return parseUnits(stringNumber, 9);
}