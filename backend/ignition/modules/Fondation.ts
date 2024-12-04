// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FEES_RATE_0_01 = 10;

const FondationModule = buildModule("FondationModule", (m) => {
  const feesRate = m.getParameter("feesRate", FEES_RATE_0_01);

  const fondation = m.contract("Fondation", [feesRate]);

  return { fondation };
});

export default FondationModule;
