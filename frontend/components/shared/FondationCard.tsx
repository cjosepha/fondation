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
import { use, useEffect, useState } from "react"
import { getAddress } from "viem"

interface FondationCardProps {
    showAccrueYieldButton: boolean;
}

const FondationCard = ({ showAccrueYieldButton }: FondationCardProps) => {

    const { toast } = useToast()

    const [fondationYield, setFondationYield] = useState("--")

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
            functionName: "totalStaked"
        }, {
            abi: fondation.abi,
            address: fondation.address,
            functionName: "feesRate"
        }]
    })
    const [balance, exchangeRate, strategy, getMaximumPossibleWithdraw, totalStaked, feesRate] = data || []

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
      hash: hash
    })

    const accueYield = () => {
        writeContract({
            abi: fondation.abi,
            address: fondation.address,
            functionName: "accrueYield"
        })
    }

    useEffect(() => {
        if (!isLoading
            && balance?.result !== undefined
            && totalStaked?.result !== undefined) {
            setFondationYield(
                formatWBTC(balance?.result - totalStaked?.result)
            )
        } else {
            setFondationYield("--")
        }
    }, [balance, totalStaked])

    useEffect(() => {
        if (hash) {
            console.log("Submitted", hash)
            toast({
                title: "Accrue Yield submitted",
                description: "Click to view the transaction",
                action: <ToastAction onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`)} altText={"View on Etherscan"}>Open</ToastAction>
            })
        }
    }, [hash])

    useEffect(() => {
        if (isConfirming) {
            console.log("Confirming", hash)
            toast({
                title: "Accrue Yield in progress...",
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
                title: "Accrue Yield successful",
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fondation</CardTitle>
                <CardDescription>Current state of the Fondation contract</CardDescription>
            </CardHeader>
            <CardContent>
                <form>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-2">
                            <Label >Total wBTC locked in Fondation : { isLoading || !balance?.result ? "--" : formatWBTC(balance?.result) }</Label>
                            <Label >Maximum wBTC withdrawable : { isLoading || !getMaximumPossibleWithdraw?.result  ? "--" : formatWBTC(getMaximumPossibleWithdraw?.result) }</Label>
                            <Label >Exchange rate : { isLoading || !exchangeRate?.result  ? "--" : formatExchangeRate(exchangeRate?.result) }</Label>
                            <Label >Fees : { isLoading || !feesRate?.result  ? "--" : formatPercent(feesRate?.result) } %</Label>
                            <Label >Strategy contract address : { isLoading || !strategy?.result  ? "--" : getAddress(strategy?.result) }</Label>
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex-auto">
                <div className="flex flex-row mt-auto mb-auto">
                    {showAccrueYieldButton && (
                        <div>
                            <Button disabled={isLoading || isPending} onClick={accueYield}>Accrue Yield</Button>
                            <Label className="ml-2 mt-auto mb-auto">Retrieve the strategy yield and tranfer fees to owner.</Label>
                        </div>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};

export default FondationCard;