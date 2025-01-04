'use client';

import { useAccount } from 'wagmi';
import FondationCard from "@/components/shared/FondationCard";
import StrategyCard from "@/components/shared/StrategyCard";

export default function Admin() {

  const { isConnected } = useAccount(); // Replace this with your actual wallet connection logic

  return (
    <div className="container">
      <FondationCard showAccrueYieldButton={isConnected} />
      { isConnected ? <StrategyCard /> : null }
    </div>
  );
}