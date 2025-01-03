'use client';

import StakeCard from "@/components/shared/StakeCard";
import UnstakeCard from "@/components/shared/UnstakeCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <div className="container">
      <Tabs defaultValue="stake">
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="stake">Stake</TabsTrigger>
            <TabsTrigger value="unstake">Unstake</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="stake"><StakeCard /></TabsContent>
        <TabsContent value="unstake"><UnstakeCard /></TabsContent>
      </Tabs>
    </div>
  );
}
