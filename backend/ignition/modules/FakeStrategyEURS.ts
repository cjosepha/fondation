import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EURS_ADDRESS = "0x6d906e526a4e2Ca02097BA9d0caA3c382F52278E"; // EURS Sepolia Testnet
const FONDATION_ADDRESS = "0xaE4A3E14a51209D29892924fCdb39915B38d2113"; // Fondation Sepolia Testnet

const FakeStrategyEURSModule = buildModule("FakeStrategyEURSModule", (m) => {
  const eurs = m.contractAt("EURS", EURS_ADDRESS);
  const fondation = m.contractAt("Fondation", FONDATION_ADDRESS);

  const fakeStrategyEURS = m.contract("FakeStrategy", [fondation, eurs, 2]);

  return { fakeStrategyEURS };
});

export default FakeStrategyEURSModule;
