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
import { useEffect, useState } from "react"
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

    const expectedWBTCAmount = (_stBTCAmount : string) => {
        const result = (parseStBTC(_stBTCAmount) * exchangeRate?.result) / BigInt(10 ** EXCHANGE_RATE_DECIMALS);
        return formatWBTC(result / BigInt(10 ** 10)); // 10 = 18 - 8
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
            const numericAmount = Number(parseStBTC(stBTCAmount.trim()));
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
                        <div className="flex flex-col space-y-2">
                            <div className="flex flex-row">
                                <Input value={stBTCAmount} onChange={(e) => setStBTCAmount(e.target.value)} placeholder="Enter the amount of stBTC to unstake" />
                                <Label className="ml-2 mt-auto mb-auto">stBTC</Label>
                            </div>
                            <div className="flex flex-row justify-between">
                                { !isLoading && checkAmountValidity() && <Label >You will receive { expectedWBTCAmount(stBTCAmount) } wBTC</Label> }
                                { !isLoading && <Label >1 stBTC = { expectedWBTCAmount('1.0') } wBTC</Label> }
                            </div>
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