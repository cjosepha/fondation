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
import {
    fondation,
    aWBTC,
    formatWBTC,
    formatExchangeRate,
    formatPercent
} from "@/utils/contract"
import { useWriteContract, useReadContracts, useWaitForTransactionReceipt } from "wagmi"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { useEffect, useState } from "react"
import { getAddress } from "viem"
import { Input } from "@/components/ui/input"
import { ProgressDialog } from "./ProgressDialog"

interface FondationCardProps {
    showAdminActions: boolean;
    onRefresh: () => void;
    strategyAddress: string;
}

const FondationCard = ({ showAdminActions, onRefresh, strategyAddress }: FondationCardProps) => {

    const { toast } = useToast()

    const [progress, setProgress] = useState(0)
    const [showProgressDialog, setShowProgressDialog] = useState(false)
    const [progressTitle, setProgressTitle] = useState("")
    const [strategyAddress, setStrategyAddress] = useState("")
    const [currentAction, setCurrentAction] = useState("");

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
            abi: aWBTC.abi,
            address: aWBTC.address,
            functionName: "balanceOf",
            args: [fondation.address]
        }, {
            abi: fondation.abi,
            address: fondation.address,
            functionName: "exchangeRate"
        }, {
            abi: fondation.abi,
            address: fondation.address,
            functionName: "strategy"
        }, {
            abi: fondation.abi,
            address: fondation.address,
            functionName: "getMaximumPossibleWithdraw"
        }, {
            abi: fondation.abi,
            address: fondation.address,
            functionName: "feesRate"
        }]
    })
    const [balance, exchangeRate, strategy, getMaximumPossibleWithdraw, feesRate] = data || []

    const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isTransationFailed } = useWaitForTransactionReceipt({
      hash: hash
    })

    const accueYield = () => {
        const action = "Accrue Yield"
        setCurrentAction(action)
        setProgress(0)
        setProgressTitle(action)
        setShowProgressDialog(true)
        writeContract({
            abi: fondation.abi,
            address: fondation.address,
            functionName: "accrueYield"
        })
    }

    const setStrategy = () => {
        const action = "Set Strategy"
        setCurrentAction(action)
        setProgress(0)
        setProgressTitle(action)
        setShowProgressDialog(true)
        writeContract({
            abi: fondation.abi,
            address: fondation.address,
            functionName: "setStrategy",
            args: [strategyAddress]
        })
    }

    const disableStrategy = () => {
        const action = "Disable Strategy"
        setCurrentAction(action)
        setProgress(0)
        setProgressTitle(action)
        setShowProgressDialog(true)
        writeContract({
            abi: fondation.abi,
            address: fondation.address,
            functionName: "disableStrategy"
        })
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
                <CardTitle>Fondation</CardTitle>
                <CardDescription>Current state of the Fondation contract</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-2">
                        <Label >Total wBTC locked in Fondation : {isLoading || !balance?.result ? "--" : formatWBTC(balance?.result as bigint)}</Label>
                        <Label >Maximum wBTC withdrawable : {isLoading || !getMaximumPossibleWithdraw?.result ? "--" : formatWBTC(getMaximumPossibleWithdraw?.result as bigint)}</Label>
                        <Label >Exchange rate : {isLoading || !exchangeRate?.result ? "--" : formatExchangeRate(exchangeRate?.result as bigint)}</Label>
                        <Label >Fees : {isLoading || !feesRate?.result ? "--" : formatPercent(feesRate?.result as bigint)} %</Label>
                        <Label >Strategy contract address : {isLoading || !strategy?.result ? "--" : getAddress(strategy?.result as string)}</Label>
                    </div>
                </div>
                { showProgressDialog ? <ProgressDialog title={progressTitle} progress={progress} hash={hash} /> : null }
            </CardContent>
            <CardFooter className="flex-auto">
                <div className="flex flex-row mt-auto mb-auto">
                    {showAdminActions && (
                        <div className="flex flex-col space-y-2">
                            <div className="flex flex-row">
                                <Button disabled={isLoading || isPending} onClick={accueYield}>Accrue Yield</Button>
                                <Label className="ml-2 mt-auto mb-auto">Retrieve the strategy yield and tranfer fees to owner.</Label>
                            </div>
                            <div className="flex flex-row">
                                <Button disabled={isLoading || isPending} onClick={disableStrategy}>Disable Strategy</Button>
                                <Label className="ml-2 mt-auto mb-auto">Remove the current strategy and repay debts, allowing full unstaking.</Label>
                            </div>
                            <div className="flex flex-row">
                                <Input type="text" value={strategyAddress} onChange={(e) => setStrategyAddress(e.target.value)} placeholder='Enter a IFondationStrategy address' />
                                <div className="ml-2 mt-auto mb-auto"></div>
                                <Button disabled={isLoading || isPending} onClick={setStrategy}>Set Strategy</Button>
                            </div>
                        </div>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};

export default FondationCard;