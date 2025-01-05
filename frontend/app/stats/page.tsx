'use client';

import StakedTable from "@/components/shared/StakedTable";
import UnstakedTable from "@/components/shared/UnstakedTable";
import FeesPaidTable from "@/components/shared/FeesPaidTable";
import YieldAccruedTable from "@/components/shared/YieldAccruedTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Stats() {

  return (
    <div className="container">
      <Tabs defaultValue="staked">
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="staked">Staked</TabsTrigger>
            <TabsTrigger value="unstaked">Unstaked</TabsTrigger>
            <TabsTrigger value="yield">Yield</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="staked"><StakedTable /></TabsContent>
        <TabsContent value="unstaked"><UnstakedTable /></TabsContent>
        <TabsContent value="yield"><YieldAccruedTable /></TabsContent>
        <TabsContent value="fees"><FeesPaidTable /></TabsContent>
      </Tabs>
    </div>
  );
}
