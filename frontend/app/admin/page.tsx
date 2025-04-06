'use client';

import { useAccount } from 'wagmi';
import FondationCard from "@/components/shared/FondationCard";
import StrategyCard from "@/components/shared/StrategyCard";
import { fondation } from "@/utils/contract"
import { useReadContracts } from "wagmi"

export default function Admin() {

  const { isConnected } = useAccount(); // Replace this with your actual wallet connection logic

  const {
    data,
    isLoading,
    refetch
  } = useReadContracts({
    contracts: [{
      abi: fondation.abi,
      address: fondation.address,
      functionName: "strategy"
    }]
  })
  const strategy = data?.[0]?.result as string | undefined

  return (
    <div className="container">
      { isLoading ? <div>Loading...</div> :
      <>
        { strategy ? <FondationCard showAdminActions={isConnected} onRefresh={refetch} strategyAddress={strategy} /> : null}
        { isConnected ?  (strategy ? <StrategyCard strategyAddress={strategy} /> : null) : null }
      </>
      }
    </div>
  );
}