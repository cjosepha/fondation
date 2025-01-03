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
} from "@/utils/contract"
import { useWriteContract, useReadContracts, useWaitForTransactionReceipt } from "wagmi"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { useEffect } from "react"


const AccrueYieldCard = () => {

    const { toast } = useToast()

    const { data: hash, writeContract, isPending } = useWriteContract({
        mutation: {
            
        }
    })

    const {
        data,
        error,
        isLoading
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
        }]
    })
    const [balance, exchangeRate] = data || []

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
                <CardTitle>Accrue Yield</CardTitle>
                <CardDescription>Accrue the yields generated in the Strategy contract onto the Fondation contract</CardDescription>
            </CardHeader>
            <CardContent>
                <form>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-2">
                            <Label >Total wBTC locked in Fondation : { isLoading ? "--" : formatWBTC(balance?.result) }</Label>
                            <Label >Current exchange rate : { isLoading ? "--" : formatExchangeRate(exchangeRate?.result) }</Label>
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex-auto">
                <Button disabled={isLoading} onClick={accueYield}>
                    { isLoading ? "Loading..." : (isPending ? "Processing..." : "Accrue Yield") }
                </Button>
            </CardFooter>
        </Card>
    );
};

export default AccrueYieldCard;