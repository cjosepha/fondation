import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    fondation,
    parseWBTC,
    wBTC,
    formatStBTC,
    formatWBTC
} from "@/utils/contract"
import {
    EXCHANGE_RATE_DECIMALS
} from "@/constants"
import { useWriteContract, useReadContracts, useWaitForTransactionReceipt } from "wagmi"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { useAccount } from "wagmi";
import { parse } from "path"

const StakeCard = () => {

    const { isConnected, address } = useAccount()

    const [wBTCAmount, setWBTCAmount] = useState("")

    const [needApproval, setNeedApproval] = useState(true);

    const [isApproveEnabled, setIsApproveEnabled] = useState(false);

    const [isStakeEnabled, setIsStakeEnabled] = useState(false);

    const [isFundsSufficient, setIsFundsSufficient] = useState(true);

    const { toast } = useToast()

    const { data: hash, writeContract, isPending } = useWriteContract({
        mutation: {
            
        }
    })

    const {
        data,
        error,
        isLoading,
        refetch
    } = useReadContracts({
        contracts: [{
            abi: wBTC.abi,
            address: wBTC.address,
            functionName: "allowance",
            args: [address, fondation.address]
        }, {
            abi: wBTC.abi,
            address: wBTC.address,
            functionName: "balanceOf",
            args: [address]
        }, {
            abi: fondation.abi,
            address: fondation.address,
            functionName: "exchangeRate"
        }]
    })
    const [allowance, balance, exchangeRate] = data || []

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
      hash: hash
    })

    useEffect(() => {
        if (isConnected && !isLoading && allowance?.result) {
            setNeedApproval(
                allowance?.result < parseWBTC(wBTCAmount)
            );
        }
    }, [allowance, wBTCAmount]);

    useEffect(() => {
        if (isConnected && !isLoading && balance?.result) {
            setIsFundsSufficient(
                balance?.result >= parseWBTC(wBTCAmount)
            );
        }
    }, [balance, wBTCAmount]);

    useEffect(() => {
        setIsApproveEnabled(
            isConnected &&
            !isLoading &&
            !isPending &&
            needApproval
        );
    }, [isConnected, isLoading, isPending, needApproval]);

    useEffect(() => {
        setIsStakeEnabled(
            isConnected &&
            !isLoading &&
            !isPending &&
            !needApproval &&
            isFundsSufficient
        );
    }, [isConnected, isLoading, isPending, isFundsSufficient, needApproval]);

    const expectedStBTCAmount = (_wBTCAmount : string) => {
        const result = parseWBTC(_wBTCAmount) * BigInt(10 ** EXCHANGE_RATE_DECIMALS) / exchangeRate?.result;
        return formatStBTC(result * BigInt(10 ** 10)); // 10 = 18 - 8
    }

    const setMaxWBTCAmount = () => {
        if (!balance?.result) { return }
        setWBTCAmount(formatWBTC(balance?.result))
    }

    const stakeWBTC = () => {
        writeContract({
            abi: fondation.abi,
            address: fondation.address,
            functionName: "stake",
            args: [parseWBTC(wBTCAmount)]
        })
    }

    const approveWBTC = () => {
        writeContract({
            abi: wBTC.abi,
            address: wBTC.address,
            functionName: "approve",
            args: [fondation.address, parseWBTC(wBTCAmount)]
        })
    }

    const checkAmountValidity = () : boolean => {
        try {
            if (wBTCAmount.length == 0) { return false }
            const numericAmount = Number(parseWBTC(wBTCAmount.trim()));
            if (isNaN(numericAmount) || numericAmount <= 0) {
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    useEffect(() => {
        if (hash) {
            console.log("Submitted", hash)
            toast({
                title: "Staking of wBTC submitted",
                description: "Click to view the transaction",
                action: <ToastAction onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`)} altText={"View on Etherscan"}>Open</ToastAction>
            })
        }
    }, [hash])

    useEffect(() => {
        if (isConfirming) {
            console.log("Confirming", hash)
            toast({
                title: "Staking of wBTC in progress...",
                description: "Click to view the transaction",
                action: <ToastAction onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`)} altText={"View on Etherscan"}>Open</ToastAction>
            })
        }
    }, [isConfirming])

    useEffect(() => {
        if (isConfirmed) {
            console.log("Succeed", hash)
            toast({
                title: "Staking of wBTC successful",
                description: "Click to view the transaction",
                action: <ToastAction onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`)} altText={"View on Etherscan"}>Open</ToastAction>
            })
            refetch()
        }
    }, [isConfirmed])

    useEffect(() => {
        if (error) {
            console.log("Error", error)
            toast({
                title: "Error",
                description: error.message
            })
        }
    }, [error])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Stake wBTC</CardTitle>
                <CardDescription>Stake your wBTC and get the equivalent amount of stBTC in return</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-2">
                        <div className="flex flex-row mt-auto mb-auto">
                            <Label >Your balance : { (isLoading || !balance?.result) ? "--" : formatWBTC(balance?.result)} wBTC</Label>
                        </div>
                        <div className="flex flex-row mt-auto mb-auto">
                            <Input value={wBTCAmount} onChange={(e) => setWBTCAmount(e.target.value)} placeholder="Enter the amount of wBTC to stake" />
                            <Label className="ml-2 mt-auto mb-auto">wBTC</Label>
                            <Button className="ml-2 mt-auto mb-auto" onClick={setMaxWBTCAmount}>Max</Button>
                        </div>
                        <div className="flex flex-row mt-auto mb-auto">
                            { !isFundsSufficient ? <Label >Insufficient balance</Label> : null }
                        </div>
                        <div className="flex flex-row justify-between mt-auto mb-auto">
                            <Label >You will receive {(isLoading || !checkAmountValidity()) ? "--" : expectedStBTCAmount(wBTCAmount)} stBTC</Label>
                            <Label >1 wBTC = {isLoading ? "--" : expectedStBTCAmount('1.0')} stBTC</Label>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-auto space-x-2">
                <Button disabled={!isApproveEnabled || !checkAmountValidity()} onClick={approveWBTC}>Approve</Button>
                <Button disabled={!isStakeEnabled || !checkAmountValidity()} onClick={stakeWBTC}>Stake</Button>
            </CardFooter>
        </Card>
    );
};

export default StakeCard;