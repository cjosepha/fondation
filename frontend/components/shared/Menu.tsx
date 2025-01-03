'use client'

import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { fondation } from "@/utils/contract";

const Menu = () => {

    const { isConnected, address } = useAccount()

    const { data: owner } = useReadContract({
        abi: fondation.abi,
        address: fondation.address,
        functionName: "owner"
    })

    return (
        <ul className="menu">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/stats">Stats</Link></li>
            { isConnected && owner === address ? <li><Link href="/admin">Admin</Link></li> : "" }
        </ul>
    )
}

export default Menu;