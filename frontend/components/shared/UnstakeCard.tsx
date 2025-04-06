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
    stBTC,
    parseStBTC,
    formatWBTC,
    formatStBTC
} from "@/utils/contract"
import {
    EXCHANGE_RATE_DECIMALS
} from "@/constants"
import { useWriteContract, useReadContracts, useWaitForTransactionReceipt } from "wagmi"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { useAccount } from "wagmi";
import { ProgressDialog } from "./ProgressDialog"

const UnstakeCard = () => {

    const { isConnected, address } = useAccount()

    const [stBTCAmount, setStBTCAmount] = useState("")
    const [isUnstakeEnabled, setIsUnstakeEnabled] = useState(false);
    const [isFundsSufficient, setIsFundsSufficient] = useState(true);
    const [isAmountExceedUnstakable, setIsAmountExceedUnstakable] = useState(true);
    const [progress, setProgress] = useState(0)
    const [showProgressDialog, setShowProgressDialog] = useState(false)
    const [progressTitle, setProgressTitle] = useState("")

    const { toast } = useToast()

    const { data: hash, writeContract, isPending, isError } = useWriteContract({
        mutation: {
            onError(error) {
                console.log("Error", error)
                toast({
                    title: "Error",
                    description: error.message
                })
            }
        }
    })

    const {
        data,
        error,
        isLoading,
        refetch
    } = useReadContracts({
        contracts: [{
            abi: fondation.abi,
            address: fondation.address,
            functionName: "exchangeRate"
        }, {
            abi: fondation.abi,
            address: fondation.address,
            functionName: "getMaximumPossibleWithdraw"
        }, {
            abi: stBTC.abi,
            address: stBTC.address,
            functionName: "balanceOf",
            args: [address]
        }]
    })
    const [exchangeRate, getMaximumPossibleWithdraw, balance] = data || []

    const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isTransationFailed } = useWaitForTransactionReceipt({
      hash: hash
    })

    const expectedWBTCAmount = (_stBTCAmount : string) => {
        if (!exchangeRate?.result) { return "--" }
        const result = (parseStBTC(_stBTCAmount) * (exchangeRate?.result as bigint)) / BigInt(10 ** EXCHANGE_RATE_DECIMALS);
        return formatWBTC(result / BigInt(10 ** 10)); // 10 = 18 - 8
    }

    const unstakeStBTC = () => {
        setProgress(0)
        setProgressTitle("Unstaking stBTC")
        setShowProgressDialog(true)
        writeContract({
            abi: fondation.abi,
            address: fondation.address,
            functionName: "unstake",
            args: [parseStBTC(stBTCAmount)]
        })
    }

    const setMaxStBTCAmount = () => {
        if (!balance?.result || !getMaximumPossibleWithdraw?.result) { return }
        if ((balance?.result as bigint) < ((getMaximumPossibleWithdraw?.result as bigint) * BigInt(1e10))) {
            setStBTCAmount(formatStBTC(balance?.result as bigint))
        } else {
            setStBTCAmount(formatWBTC(getMaximumPossibleWithdraw?.result as bigint))
        }
    }

    const checkAmountValidity = () : boolean => {
        try {
            if (stBTCAmount.length == 0) { return false }
            const numericAmount = Number(parseStBTC(stBTCAmount.trim()));
            if (isNaN(numericAmount) || numericAmount <= 0) {
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    useEffect(() => {
        if (isConnected && !isLoading && balance?.result) {
            setIsFundsSufficient(
                (balance?.result as bigint) >= parseStBTC(stBTCAmount)
            );
        }
    }, [balance, stBTCAmount]);

    useEffect(() => {
        setIsUnstakeEnabled(
            isConnected &&
            !isLoading &&
            !isPending &&
            isFundsSufficient
        );
    }, [isConnected, isLoading, isPending, isFundsSufficient]);

    useEffect(() => {
        if (isConnected && !isLoading && (getMaximumPossibleWithdraw?.result !== undefined)) {
            setIsAmountExceedUnstakable(
                ((getMaximumPossibleWithdraw?.result as bigint) * BigInt(1e10)) < parseStBTC(stBTCAmount)
            )
        }
    }, [stBTCAmount, getMaximumPossibleWithdraw]);

    useEffect(() => {
        if (isConfirming) {
            console.log("Confirming", hash)
            setProgressTitle(`Unstaking stBTC in progress`)
        }
    }, [isConfirming])

    useEffect(() => {
        let timer : ReturnType<typeof setTimeout>
        if (isConfirmed) {
            console.log("Succeed", hash)
            const progressTitle = `Unstaking stBTC successful`
            setProgressTitle(progressTitle)
            setProgress(100)
            toast({
                title: progressTitle,
                description: "Open to view the transaction",
                action: <ToastAction onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`)} altText={"View on Etherscan"}>Open</ToastAction>
            })
            timer = setTimeout(() => setShowProgressDialog(false), 1000)
            refetch()
        }
        return () => clearTimeout(timer)
    }, [isConfirmed])

    useEffect(() => {
        if (error || isTransationFailed) {
            console.log("Error", error)
            toast({
                title: (isTransationFailed? "Transaction failed" : "Error"),
                description: (error? error.message : (isTransationFailed? "Open to view the transaction" : "")),
                action: (hash ? <ToastAction onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`)} altText={"View on Etherscan"}>Open</ToastAction> : undefined)
            })
        }
    }, [error, isTransationFailed])

    useEffect(() => {
        if (isError || isTransationFailed) {
            setShowProgressDialog(false)
        }
    }, [isError, isTransationFailed])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Unstake stBTC</CardTitle>
                <CardDescription>Unstake your stBTC and get the equivalent amount of wBTC in return</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-2">
                        <div className="flex flex-row mt-auto mb-auto">
                            <Label >Your balance : { (isLoading || !balance?.result) ? "--" : formatStBTC(balance?.result as bigint)} stBTC</Label>
                        </div>
                        <div className="flex flex-row mt-auto mb-auto">
                            <Input type="number" value={stBTCAmount} onChange={(e) => setStBTCAmount(e.target.value)} placeholder="Enter the amount of stBTC to unstake" />
                            <Label className="ml-2 mt-auto mb-auto">stBTC</Label>
                            <Button className="ml-2 mt-auto mb-auto" onClick={setMaxStBTCAmount}>Max</Button>
                        </div>
                        <div className="flex flex-row mt-auto mb-auto">
                            { !isFundsSufficient ? <Label >Insufficient balance</Label> : null }
                        </div>
                        <div className="flex flex-row justify-between">
                            { !isAmountExceedUnstakable ?
                                <Label >You will receive {(isLoading || !checkAmountValidity()) ? "--" : expectedWBTCAmount(stBTCAmount)} wBTC</Label>
                                :
                                <Label >Amount exceeds unstakable amount</Label>
                            }
                            <Label >1 stBTC = {isLoading ? "--" : expectedWBTCAmount('1.0')} wBTC</Label>
                        </div>
                    </div>
                </div>
                { showProgressDialog ? <ProgressDialog title={progressTitle} progress={progress} hash={hash} /> : null }
            </CardContent>
            <CardFooter className="flex-auto">
                <Button disabled={!isUnstakeEnabled || isAmountExceedUnstakable || !checkAmountValidity()} onClick={unstakeStBTC}>Unstake</Button>
            </CardFooter>
        </Card>
    );
};

export default UnstakeCard;