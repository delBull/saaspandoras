import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
  const tx = await provider.getTransaction("0x4c58303ecebce4dadaedfb0d550cb3c82473c786f17356de6ad84791ca9013bd");
  try {
    const res = await provider.call({
      to: tx.to,
      from: tx.from,
      data: tx.data,
      value: tx.value
    }, tx.blockNumber - 1);
    console.log("Call succeeded? res =", res);
  } catch (e: any) {
    console.log("REVERT DATA:", e.data || e.error?.data || e.message);
    if (e.data || e.error?.data) {
       console.log("STRING:", ethers.utils.toUtf8String("0x" + (e.data || e.error?.data).replace("0x", "").slice(136)));
    }
  }
}
main();
