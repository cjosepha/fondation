'use client'

import Link from "next/link";

const Menu = () => {
    return (
        <ul className="menu">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/stats">Stats</Link></li>
            <li><Link href="/admin">Admin</Link></li>
        </ul>
    )
}

export default Menu;