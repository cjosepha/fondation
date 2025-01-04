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


const StrategyCard = () => {

    const { toast } = useToast()

    const { isConnected, address } = useAccount()
    const [assetAmount, setAssetAmount] = useState("")
    const [needApproval, setNeedApproval] = useState(true);
    const [isApproveEnabled, setIsApproveEnabled] = useState(false);
    const [isAddFakeYieldEnabled, setIsAddFakeYieldEnabled] = useState(false);
    const [isFundsSufficient, setIsFundsSufficient] = useState(true);

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
        }]
    })
    const [getYieldAmount, getAsset, getDecimals, balance, allowance] = data || []

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
      hash: hash
    })

    const checkAmountValidity = (): boolean => {
        try {
            if (assetAmount.length == 0) { return false }
            const numericAmount = Number(parseUSDC(assetAmount.trim()));
            if (isNaN(numericAmount) || numericAmount < 0) {
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    const addFakeYield = () => {
        writeContract({
            abi: fakeStrategy.abi,
            address: fakeStrategy.address,
            functionName: "addFakeYield",
            args: [parseUSDC(assetAmount)]
        })
    }

    const approveUSDC = () => {
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
                allowance?.result < parseUSDC(assetAmount)
            );
        }
    }, [allowance, assetAmount]);

    useEffect(() => {
        if (isConnected && !isLoading && balance?.result) {
            setIsFundsSufficient(
                balance?.result >= parseUSDC(assetAmount)
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
        if (hash) {
            console.log("Submitted", hash)
            toast({
                title: "Add Fake Yield submitted",
                description: "Click to view the transaction",
                action: <ToastAction onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`)} altText={"View on Etherscan"}>Open</ToastAction>
            })
        }
    }, [hash])

    useEffect(() => {
        if (isConfirming) {
            console.log("Confirming", hash)
            toast({
                title: "Add Fake Yield in progress...",
                description: "Click to view the transaction",
                action: <ToastAction onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`)} altText={"View on Etherscan"}>Open</ToastAction>
            })
        }
    }, [isConfirming])

    useEffect(() => {
        if (isConfirmed) {
            console.log("Succeed", hash)
            refetch()
            toast({
                title: "Add Fake Yield successful",
                description: "Click to view the transaction",
                action: <ToastAction onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`)} altText={"View on Etherscan"}>Open</ToastAction>
            })
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

    const setMaxAssetAmount = () => {
        if (!balance?.result) { return }
        setAssetAmount(formatFakeStrategyAsset(balance?.result))
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
                        <Label >Asset : {isLoading || !getAsset?.result ? "--" : getAddress(getAsset?.result)}</Label>
                        <Label >Decimals : {isLoading || !getDecimals?.result ? "--" : Number(getDecimals?.result)}</Label>
                        <Label >Current yield : {isLoading || !getYieldAmount?.result ? "--" : formatFakeStrategyAsset(getYieldAmount?.result)}</Label>
                    </div>
                    <div className="flex flex-row">
                        <Input value={assetAmount} onChange={(e) => setAssetAmount(e.target.value)} placeholder='Enter an amount' />
                        <Label className="ml-2 mt-auto mb-auto">USDC</Label>
                        <Button className="ml-2 mt-auto mb-auto" onClick={setMaxAssetAmount}>Max</Button>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-auto space-x-2">
                <Button disabled={!isApproveEnabled || !checkAmountValidity()} onClick={approveUSDC}>Approve</Button>
                <Button disabled={!isAddFakeYieldEnabled || !checkAmountValidity()} onClick={addFakeYield}>Add Fake Yield</Button>
            </CardFooter>
        </Card>
    );
};

export default StrategyCard;