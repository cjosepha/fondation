
import { publicClient } from "@/utils/client";
import { contract } from "@/utils/contract";
import { decodeEventLog, parseAbiItem } from 'viem'

export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to Fondation</p>
    </div>
  );
}
