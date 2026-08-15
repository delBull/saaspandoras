import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Journey Production Safety Gate', () => {
  it('JOURNEY-SAFETY-001: HermesRuntime does not depend on the new Journeys domain', () => {
    // This test ensures that while the new Journeys domain is being built,
    // it is not accidentally wired into the production runtime before the safety gate is passed.

    const runtimePath = path.resolve(__dirname, '../../runtime/hermes-runtime.ts');
    const enginePath = path.resolve(__dirname, '../../runtime/journey-engine.ts');

    const runtimeContent = fs.existsSync(runtimePath) ? fs.readFileSync(runtimePath, 'utf-8') : '';
    const engineContent = fs.existsSync(enginePath) ? fs.readFileSync(enginePath, 'utf-8') : '';

    // Verify no imports from the new domain folder
    expect(runtimeContent).not.toMatch(/from\s+['"]\.\.\/journeys/);
    expect(engineContent).not.toMatch(/from\s+['"]\.\.\/journeys/);
    
    // Verify that the new tables are not imported
    expect(runtimeContent).not.toMatch(/hermesJourneys/);
    expect(engineContent).not.toMatch(/hermesJourneys/);
  });
});
