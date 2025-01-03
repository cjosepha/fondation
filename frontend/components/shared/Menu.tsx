'use client'

import Link from "next/link";
import { useIsOwner } from "@/utils/contract";

const Menu = () => {

    const { isOwner } = useIsOwner();

    return (
        <ul className="menu">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/stats">Stats</Link></li>
            {isOwner && (
                <li><Link href="/admin">Admin</Link></li>
            )}
        </ul>
    )
}

export default Menu;