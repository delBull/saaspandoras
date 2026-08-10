import { createPandorasRuntime } from '../src/lib/pandoras/core/sdk/create-runtime';
import { createPandorasApp } from '../src/lib/pandoras/core/sdk/create-app';
import { GoldenPack } from '../src/lib/pandoras/packs/golden-pack';

async function runBlueprintV15Packs() {
  console.log("==================================================");
  console.log("🚀 Pandora's OS - Sprint 15: The Golden Pack");
  console.log("==================================================\n");

  const runtime = createPandorasRuntime();

  console.log("[Boot] Registrando Golden Pack vía su Manifest oficial...");
  
  // Aquí es donde el Kernel carga el PackManifest
  createPandorasApp({
    runtime,
    packs: [GoldenPack]
  });

  console.log("\n[Verificación] Inspeccionando Runtime...");
  const workflowCount = (runtime.workflowRegistry as any).registry.size;
  const capabilityCount = (runtime.capabilityRegistry as any).capabilities.size;
  const adapterCount = (runtime.capabilityRegistry as any).adapters.size;

  console.log(`- Workflows en el Registry: ${workflowCount}`);
  console.log(`- Capabilities en el Registry: ${capabilityCount}`);
  console.log(`- Adapters en el Registry: ${adapterCount}`);
  
  if (workflowCount > 0 && capabilityCount > 0 && adapterCount > 0) {
    console.log("\n✅ ¡El modelo de distribución por Manifest (Pack) funciona perfectamente!");
  } else {
    console.log("\n❌ Falló la inyección declarativa de componentes.");
  }
}

runBlueprintV15Packs().catch(console.error);
