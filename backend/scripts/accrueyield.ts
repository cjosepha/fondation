import hre from "hardhat";
import fondationJson from "../ignition/deployments/chain-11155111/artifacts/FondationModule#Fondation.json"
export const fondationAddress = "0x56eBe35FB218D3f35D18253D19355eBaD35de0d0";

async function main() {

  const account = (await hre.viem.getWalletClients())[0]; // First signer
  console.log("📤 Using signer:", account.account.address);

  const hash = await account.writeContract({
    address: fondationAddress,
    abi: fondationJson.abi,
    functionName: "accrueYield",
  });

  console.log("⏳ Transaction sent. Waiting for confirmation...");
  const receipt = await (await hre.viem.getPublicClient()).waitForTransactionReceipt({ hash });


  console.log(`✅ accrueYield succeeded in block ${receipt.blockNumber}`);
  console.log(`🔗 TX hash: ${receipt.transactionHash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error during accrueYield execution:", error);
    process.exit(1);
  });