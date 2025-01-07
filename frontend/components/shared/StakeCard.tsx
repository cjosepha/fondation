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
import { use, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { useAccount } from "wagmi";
import { ProgressDialog } from "./ProgressDialog"

const StakeCard = () => {

    const { isConnected, address } = useAccount()

    const [wBTCAmount, setWBTCAmount] = useState("")
    const [currentAction, setCurrentAction] = useState("");
    const [needApproval, setNeedApproval] = useState(true);
    const [isApproveEnabled, setIsApproveEnabled] = useState(false);
    const [isStakeEnabled, setIsStakeEnabled] = useState(false);
    const [isFundsSufficient, setIsFundsSufficient] = useState(true);
    const [progress, setProgress] = useState(0)
    const [showProgressDialog, setShowProgressDialog] = useState(false)
    const [progressTitle, setProgressTitle] = useState("")

    const { toast } = useToast()

    const { data: hash, writeContract, isPending, isError } = useWriteContract({
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

    const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isTransationFailed } = useWaitForTransactionReceipt({
      hash: hash
    })

    useEffect(() => {
        if (isConnected && !isLoading && allowance?.result) {
            setNeedApproval(
                (allowance?.result as bigint) < parseWBTC(wBTCAmount)
            );
        }
    }, [allowance, wBTCAmount]);

    useEffect(() => {
        if (isConnected && !isLoading && balance?.result) {
            setIsFundsSufficient(
                (balance?.result as bigint) >= parseWBTC(wBTCAmount)
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
        if (!exchangeRate?.result) { return "--" }
        const result = parseWBTC(_wBTCAmount) * BigInt(10 ** EXCHANGE_RATE_DECIMALS) / (exchangeRate?.result as bigint);
        return formatStBTC(result * BigInt(10 ** 10)); // 10 = 18 - 8
    }

    const setMaxWBTCAmount = () => {
        if (!balance?.result) { return }
        setWBTCAmount(formatWBTC(balance?.result as bigint))
    }

    const stakeWBTC = () => {
        const action = "Staking wBTC"
        setCurrentAction(action)
        setProgress(0)
        setProgressTitle(action)
        setShowProgressDialog(true)
        writeContract({
            abi: fondation.abi,
            address: fondation.address,
            functionName: "stake",
            args: [parseWBTC(wBTCAmount)]
        })
    }

    const approveWBTC = () => {
        const action = "Approving wBTC"
        setCurrentAction(action)
        setProgress(0)
        setProgressTitle(action)
        setShowProgressDialog(true)
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
        if (isConfirming) {
            console.log("Confirming", hash)
            setProgressTitle(`${currentAction} in progress`)
        }
    }, [isConfirming])

    useEffect(() => {
        let timer : ReturnType<typeof setTimeout>
        if (isConfirmed) {
            console.log("Succeed", hash)
            const progressTitle = `${currentAction} successful`
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
                <CardTitle>Stake wBTC</CardTitle>
                <CardDescription>Stake your wBTC and get the equivalent amount of stBTC in return</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-2">
                        <div className="flex flex-row mt-auto mb-auto">
                            <Label >Your balance : { (isLoading || !balance?.result) ? "--" : formatWBTC(balance?.result as bigint)} wBTC</Label>
                        </div>
                        <div className="flex flex-row mt-auto mb-auto">
                            <Input type="number" value={wBTCAmount} onChange={(e) => setWBTCAmount(e.target.value)} placeholder="Enter the amount of wBTC to stake" />
                            <Label className="ml-2 mt-auto mb-auto">wBTC</Label>
                            <Button className="ml-2 mt-auto mb-auto" onClick={setMaxWBTCAmount}>Max</Button>
                        </div>
                        <div className="flex flex-row justify-between mt-auto mb-auto">
                            { isFundsSufficient ?
                                <Label >You will receive {(isLoading || !checkAmountValidity()) ? "--" : expectedStBTCAmount(wBTCAmount)} stBTC</Label>
                                :
                                <Label >Insufficient balance</Label>
                            }
                            <Label >1 wBTC = {isLoading ? "--" : expectedStBTCAmount('1.0')} stBTC</Label>
                        </div>
                    </div>
                </div>
                { showProgressDialog ? <ProgressDialog title={progressTitle} progress={progress} hash={hash} /> : null }
            </CardContent>
            <CardFooter className="flex-auto space-x-2">
                <Button disabled={!isApproveEnabled || !checkAmountValidity()} onClick={approveWBTC}>Approve</Button>
                <Button disabled={!isStakeEnabled || !checkAmountValidity()} onClick={stakeWBTC}>Stake</Button>
            </CardFooter>
        </Card>
    );
};

export default StakeCard;