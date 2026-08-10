import { definePack } from '../../core/sdk/define-pack';
import { ExampleWorkflow } from './workflows/example.workflow';
import { ExampleCapability } from './capabilities/example.capability';
import { ExampleAdapter } from './adapters/example.adapter';

/**
 * Manifest del Golden Pack.
 * Esta es la fuente única de verdad para el ciclo de vida de la aplicación.
 */
export const GoldenPack = definePack({
  id: "pandoras.golden-pack",
  version: "1.0.0",
  sdkVersion: "^1.0.0",
  name: "Golden Reference Pack",
  author: "Pandoras Core Team",
  categories: ["template", "reference"],
  tags: ["golden", "example"],
  
  workflows: [ExampleWorkflow],
  capabilities: [ExampleCapability],
  adapters: [ExampleAdapter],
  
  knowledge: [],
  prompts: [],
  assets: []
});

export default GoldenPack;
