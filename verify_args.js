
const cWallet = "0x96631d6c5295f1f08334888c5d6f3a246fa9c3ba";
const pct = 80;
const qPct = 10;
const vHours = 24 * 3600;
const eHours = 168 * 3600;
const eqPct = 10;
const rate = 1000000000000000;
const split = 10;

console.table({
  _creatorWallet: cWallet,
  _creatorPayoutPct: pct,
  _minQuorumPercentage: qPct,
  _votingPeriodSeconds: vHours,
  _emergencyPeriodSeconds: eHours,
  _emergencyQuorumPct: eqPct,
  _stakingRewardRate: rate,
  _phiFundSplitPct: split
});

