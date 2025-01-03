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
import { fondation, parseWBTC, wBTC } from "@/utils/contract"
import { useWriteContract, useReadContract } from "wagmi"
import { use, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { useAccount } from "wagmi";

const StakeCard = () => {

    const { isConnected, address } = useAccount()

    const [wBTCAmount, setWBTCAmount] = useState("")

    const { toast } = useToast()

    const { data: hash, writeContract, isPending } = useWriteContract({
        mutation: {
            
        }
    })

    const { data: allowance, isLoading } = useReadContract({
        abi: wBTC.abi,
        address: wBTC.address,
        functionName: "allowance",
        args: [address, fondation.address]
    })

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

    const checkWBTCAllowance = () => {
        if (isPending || isLoading) { return }
        allowance < parseWBTC(wBTCAmount) ? approveWBTC() : stakeWBTC()
    }

    const checkAmountValidity = () : boolean => {
        try {
            const numericAmount = parseFloat(wBTCAmount.trim());
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
            toast({
                title: "Staking of wBTC submitted",
                description: "Click to view the transaction",
                action: <ToastAction onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`)} altText={"View on Etherscan"}>Open</ToastAction>
            })
        }
    }, [hash])



    return (
        <Card>
            <CardHeader>
                <CardTitle>Stake wBTC</CardTitle>
                <CardDescription>Stake your wBTC and get the equivalent amount of stBTC in return</CardDescription>
            </CardHeader>
            <CardContent>
                <form>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label>wBTC</Label>
                            <Input value={wBTCAmount} onChange={(e) => setWBTCAmount(e.target.value)} placeholder="Enter the amount of wBTC to stake" />
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex-auto">
                <Button disabled={isLoading || isPending || !checkAmountValidity()} onClick={checkWBTCAllowance}>
                    { isLoading ? "Loading..." : (isPending ? "Staking..." : "Stake") }
                </Button>
            </CardFooter>
        </Card>
    );
};

export default StakeCard;