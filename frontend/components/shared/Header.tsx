'use client';

import { ConnectButton } from "@rainbow-me/rainbowkit";

const Header = () => {
    return (
        <header>
            <div>
                <h1>Fondation</h1>
                <h3>Liquid Staking for Bitcoin</h3>
            </div>
            <ConnectButton />
        </header>
    );
};

export default Header;