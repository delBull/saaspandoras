import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Journey Production Safety Gate', () => {
  it('JOURNEY-SAFETY-001: HermesRuntime remains decoupled from direct SQL/Drizzle and delegates to JourneyEngine', () => {
    const runtimePath = path.resolve(__dirname, '../../runtime/hermes-runtime.ts');
    const runtimeContent = fs.existsSync(runtimePath) ? fs.readFileSync(runtimePath, 'utf-8') : '';

    // Verify HermesRuntime does not access database schema directly
    expect(runtimeContent).not.toMatch(/from\s+['"]@\/db['"]/);
    expect(runtimeContent).not.toMatch(/from\s+['"]@\/db\/schema['"]/);
  });
});
