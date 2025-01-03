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
    parseStBTC,
    formatWBTC,
    formatExchangeRate
} from "@/utils/contract"
import {
    EXCHANGE_RATE_DECIMALS
} from "@/constants"
import { useWriteContract, useReadContracts, useWaitForTransactionReceipt } from "wagmi"
import { use, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { useAccount } from "wagmi";

const UnstakeCard = () => {

    const { isConnected, address } = useAccount()

    const [stBTCAmount, setStBTCAmount] = useState("")

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
            abi: fondation.abi,
            address: fondation.address,
            functionName: "exchangeRate"
        }]
    })
    const [exchangeRate] = data || []

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
      hash: hash
    })

    const isUnstakeEnabled = () : boolean => {
        return isConnected && !isLoading && !isPending
    }

    const expectedWBTCAmount = () => {
        return (parseStBTC(stBTCAmount) *  exchangeRate?.result / BigInt(EXCHANGE_RATE_DECIMALS)) / BigInt(1e10)
    }

    const oneStBTCInWBTC = () => {
        return (parseStBTC('1.0') * exchangeRate?.result / BigInt(EXCHANGE_RATE_DECIMALS)) / BigInt(1e10)
    }

    const unstakeStBTC = () => {
        writeContract({
            abi: fondation.abi,
            address: fondation.address,
            functionName: "unstake",
            args: [parseStBTC(stBTCAmount)]
        })
    }

    const checkAmountValidity = () : boolean => {
        try {
            const numericAmount = parseFloat(stBTCAmount.trim());
            if (isNaN(numericAmount) || numericAmount < 0) {
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
                title: "Unstaking of stBTC submitted",
                description: "Click to view the transaction",
                action: <ToastAction onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`)} altText={"View on Etherscan"}>Open</ToastAction>
            })
        }
    }, [hash])

    useEffect(() => {
        if (isConfirming) {
            console.log("Confirming", hash)
            toast({
                title: "Unstaking of stBTC in progress...",
                description: "Click to view the transaction",
                action: <ToastAction onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`)} altText={"View on Etherscan"}>Open</ToastAction>
            })
        }
    }, [isConfirming])

    useEffect(() => {
        if (isConfirmed) {
            console.log("Succeed", hash)
            toast({
                title: "Unstaking of stBTC successful",
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
                <CardTitle>Unstake stBTC</CardTitle>
                <CardDescription>Unstake your stBTC and get the equivalent amount of wBTC in return</CardDescription>
            </CardHeader>
            <CardContent>
                <form>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label>wBTC</Label>
                            <Input value={stBTCAmount} onChange={(e) => setStBTCAmount(e.target.value)} placeholder="Enter the amount of stBTC to unstake" />
                            { !isLoading && checkAmountValidity() && <Label >You will receive { formatWBTC(expectedWBTCAmount()) } wBTC</Label> }
                            { !isLoading && <Label >1 stBTC = { formatWBTC(oneStBTCInWBTC()) } wBTC</Label> }
                            { !isLoading && <Label >Exchange rate: {formatExchangeRate(exchangeRate?.result)}</Label> }
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex-auto">
                <Button disabled={!isUnstakeEnabled() || !checkAmountValidity()} onClick={unstakeStBTC}>
                    { isLoading ? "Loading..." : (isPending ? "Unstaking..." : "Unstake") }
                </Button>
            </CardFooter>
        </Card>
    );
};

export default UnstakeCard;