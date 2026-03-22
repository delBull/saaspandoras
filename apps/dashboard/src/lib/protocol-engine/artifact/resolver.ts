export function resolveArtifactContract({
  phase,
  project,
  utilityContract
}: {
  phase?: any;
  project: any;
  utilityContract?: any;
}) {
  const artifactAddress = phase?.artifactAddress;

  const licenseAddress =
    project.licenseContractAddress ||
    project.w2eConfig?.licenseToken?.address ||
    (project as any).contractAddress;

  if (artifactAddress && artifactAddress !== "0x0000000000000000000000000000000000000000") {
    return {
      address: artifactAddress,
      type: 'artifact'
    };
  }

  if (licenseAddress && licenseAddress !== "0x0000000000000000000000000000000000000000") {
    return {
      address: licenseAddress,
      type: 'license'
    };
  }

  if (utilityContract?.address && utilityContract.address !== "0x0000000000000000000000000000000000000000") {
    return {
      address: utilityContract.address,
      type: 'utility_fallback'
    };
  }

  throw new Error("No valid contract found for artifact purchase");
}
