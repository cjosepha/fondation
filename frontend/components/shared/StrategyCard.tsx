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
    fakeStrategy,
    formatFakeStrategyAsset,
    USDC,
    parseUSDC
} from "@/utils/contract"
import { useWriteContract, useReadContracts, useWaitForTransactionReceipt } from "wagmi"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { useEffect, useState } from "react"
import { getAddress } from "viem"
import { useAccount } from "wagmi";
import { ProgressDialog } from "./ProgressDialog"


const StrategyCard = () => {

    const { toast } = useToast()

    const { isConnected, address } = useAccount()
    const [assetAmount, setAssetAmount] = useState("")
    const [needApproval, setNeedApproval] = useState(true);
    const [isApproveEnabled, setIsApproveEnabled] = useState(false);
    const [isAddFakeYieldEnabled, setIsAddFakeYieldEnabled] = useState(false);
    const [isFundsSufficient, setIsFundsSufficient] = useState(true);
    const [progress, setProgress] = useState(0)
    const [showProgressDialog, setShowProgressDialog] = useState(false)
    const [progressTitle, setProgressTitle] = useState("")
    const [currentAction, setCurrentAction] = useState("");

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
            abi: fakeStrategy.abi,
            address: fakeStrategy.address,
            functionName: "getYieldAmount"
        }, {
            abi: fakeStrategy.abi,
            address: fakeStrategy.address,
            functionName: "getAsset"
        }, {
            abi: fakeStrategy.abi,
            address: fakeStrategy.address,
            functionName: "getDecimals"
        }, {
            abi: USDC.abi,
            address: USDC.address,
            functionName: "balanceOf",
            args: [address]
        }, {
            abi: USDC.abi,
            address: USDC.address,
            functionName: "allowance",
            args: [address, fakeStrategy.address]
        }, {
            abi: USDC.abi,
            address: USDC.address,
            functionName: "balanceOf",
            args: [fakeStrategy.address]
        }]
    })
    const [getYieldAmount, getAsset, getDecimals, balance, allowance, balanceOf] = data || []

    const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isTransationFailed } = useWaitForTransactionReceipt({
      hash: hash
    })

    const checkAmountValidity = (): boolean => {
        try {
            if (assetAmount.length == 0) { return false }
            const numericAmount = Number(parseUSDC(assetAmount.trim()));
            if (isNaN(numericAmount) || numericAmount <= 0) {
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    const addFakeYield = () => {
        const action = "Adding Fake USDC Yield"
        setCurrentAction(action)
        setProgress(0)
        setProgressTitle(action)
        setShowProgressDialog(true)
        writeContract({
            abi: fakeStrategy.abi,
            address: fakeStrategy.address,
            functionName: "addFakeYield",
            args: [parseUSDC(assetAmount)]
        })
    }

    const approveUSDC = () => {
        const action = "Approving USDC"
        setCurrentAction(action)
        setProgress(0)
        setProgressTitle(action)
        setShowProgressDialog(true)
        writeContract({
            abi: USDC.abi,
            address: USDC.address,
            functionName: "approve",
            args: [fakeStrategy.address, parseUSDC(assetAmount)]
        })
    }

    useEffect(() => {
        if (isConnected && !isLoading && allowance?.result) {
            setNeedApproval(
                (allowance?.result as bigint) < parseUSDC(assetAmount)
            );
        }
    }, [allowance, assetAmount]);

    useEffect(() => {
        if (isConnected && !isLoading && balance?.result) {
            setIsFundsSufficient(
                (balance?.result as bigint) >= parseUSDC(assetAmount)
            );
        }
    }, [balance, assetAmount]);

    useEffect(() => {
        setIsApproveEnabled(
            isConnected &&
            !isLoading &&
            !isPending &&
            needApproval
        );
    }, [isConnected, isLoading, isPending, needApproval]);

    useEffect(() => {
        setIsAddFakeYieldEnabled(
            isConnected &&
            !isLoading &&
            !isPending &&
            !needApproval &&
            isFundsSufficient
        );
    }, [isConnected, isLoading, isPending, isFundsSufficient, needApproval]);

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

    const setMaxAssetAmount = () => {
        if (!balance?.result) { return }
        setAssetAmount(formatFakeStrategyAsset(balance?.result as bigint))
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Strategy</CardTitle>
                <CardDescription>All information about the current strategy</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-2">
                        <Label >Asset : {isLoading || (getAsset?.result === undefined) ? "--" : getAddress(getAsset?.result as string)}</Label>
                        <Label >Decimals : {isLoading || (getDecimals?.result === undefined) ? "--" : Number(getDecimals?.result)}</Label>
                        <Label >Current yield : {isLoading || (getYieldAmount?.result === undefined) ? "--" : formatFakeStrategyAsset(getYieldAmount?.result as bigint)} USDC</Label>
                        <Label >Contract balance : {isLoading || (balanceOf?.result === undefined) ? "--" : formatFakeStrategyAsset(balanceOf?.result as bigint)} USDC</Label>
                        <Label >Your balance : {isLoading || (balance?.result === undefined) ? "--" : formatFakeStrategyAsset(balance?.result as bigint)} USDC</Label>
                    </div>
                    <div className="flex flex-row">
                        <Input type="number" value={assetAmount} onChange={(e) => setAssetAmount(e.target.value)} placeholder='Enter an amount' />
                        <Label className="ml-2 mt-auto mb-auto">USDC</Label>
                        <Button className="ml-2 mt-auto mb-auto" onClick={setMaxAssetAmount}>Max</Button>
                    </div>
                </div>
                { showProgressDialog ? <ProgressDialog title={progressTitle} progress={progress} hash={hash} /> : null }
            </CardContent>
            <CardFooter className="flex-auto space-x-2">
                <Button disabled={!isApproveEnabled || !checkAmountValidity()} onClick={approveUSDC}>Approve</Button>
                <Button disabled={!isAddFakeYieldEnabled || !checkAmountValidity()} onClick={addFakeYield}>Add Fake Yield</Button>
            </CardFooter>
        </Card>
    );
};

export default StrategyCard;