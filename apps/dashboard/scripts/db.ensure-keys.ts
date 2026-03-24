
import { IntegrationKeyService } from './src/lib/integrations/auth';

async function main() {
  try {
    const staging = await IntegrationKeyService.ensureKeyForProject(12, 'staging');
    console.log("Staging Key Status:", staging);
    
    const production = await IntegrationKeyService.ensureKeyForProject(12, 'production');
    console.log("Production Key Status:", production);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

main();
