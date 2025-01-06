import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

interface ProgressDialogProps {
    title: string;
    progress: number;
    hash: `0x${string}` | undefined;
}

export function ProgressDialog({ title, progress, hash }: ProgressDialogProps) {
  return (
    <Dialog defaultOpen={true}>
      <DialogContent className="[&>button]:hidden">
        <DialogHeader className="flex items-center">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Progress max={100} value={progress} indeterminate={progress != 100 ? true : false}/>
        <DialogFooter>
            <div className="flex items-center justify-center w-full">
            { hash ? <Button onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`)}>View transaction</Button> : null }
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}