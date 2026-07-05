const walletAddress = "0x5aeaE3D13F480a4231dD09D873f5A094424A2ed6";
const oracleAddress = walletAddress;
const rootTreasury = "0x1e92270332F1BAa9c98679c44792997c1A33bD50";
const config = { treasurySigners: undefined };

const uniquePandoraSigners = Array.from(new Set((config.treasurySigners && config.treasurySigners.length >= 2) ? config.treasurySigners : [walletAddress, oracleAddress]))
.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
const uniqueDaoSigners = Array.from(new Set([walletAddress, oracleAddress, rootTreasury]))
.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

console.log("Pandora:", uniquePandoraSigners);
console.log("Dao:", uniqueDaoSigners);
