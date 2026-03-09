import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://rpc.sepolia.org");
  const tx = await provider.getTransaction("0x6cf311a0d4953ca6f99e89c491b2eca97cf15f8cace904b975a3fae455316dfe");
  if (!tx) { console.log("TX NOT FOUND"); return; }
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
    let errorData = e.data || e.error?.data;
    if (typeof errorData === "string" && errorData.startsWith("0x")) {
       try {
           console.log("STRING:", ethers.utils.toUtf8String("0x" + errorData.replace("0x", "").slice(136)));
       } catch (err) {
           console.log("COULD NOT DECODE STRING:", errorData);
       }
    }
  }
}
main();
