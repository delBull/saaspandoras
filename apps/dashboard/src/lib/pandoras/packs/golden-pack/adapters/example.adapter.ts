import { defineAdapter } from '../../../core/sdk/define-adapter';
import { CapabilityAdapter } from '../../../core/capabilities/capability-runtime';
import { ExecutionContext } from '../../../core/execution/execution-context';

class ExampleMockAdapter implements CapabilityAdapter<string, string> {
  readonly adapterId = 'golden_mock_adapter';

  async execute(input: string, context: ExecutionContext): Promise<string> {
    console.log(`[GoldenPack] Executing with tenant: ${context.identity.organization?.name}`);
    return `Processed: ${input}`;
  }
}

export const ExampleAdapter = defineAdapter('golden.example.capability', new ExampleMockAdapter());
