'use client';

import StakeCard from "@/components/shared/StakeCard";
import UnstakeCard from "@/components/shared/UnstakeCard";

export default function Home() {
  return (
    <div className="container">
      <StakeCard />
      <UnstakeCard />
    </div>
  );
}
