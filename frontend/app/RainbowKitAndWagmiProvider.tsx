'use client';

import '@rainbow-me/rainbowkit/styles.css';
import React, { PropsWithChildren } from "react";


import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  hardhat,
  sepolia
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { http } from 'wagmi';

const config = getDefaultConfig({
  appName: 'Fondation',
  projectId: '846e8e9e05bdefbef626f4c8736d21ce',
  chains: [hardhat, sepolia],
  transports: {
    [sepolia.id]: http("https://sepolia.infura.io/v3/44a639d76d6c43c9845c5e780f0e522a"),
  },
  ssr: true,
});

const queryClient = new QueryClient();

const RainbowKitAndWagmiProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default RainbowKitAndWagmiProvider