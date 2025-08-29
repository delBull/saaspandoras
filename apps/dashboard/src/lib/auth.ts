const adminWallets = [
  "0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9".toLowerCase(),
];

export function isAdmin(address: string | undefined): boolean {
  if (!address) {
    return false;
  }
  return adminWallets.includes(address.toLowerCase());
}
