import { defineCapability } from '../../../core/sdk/define-capability';

export const ExampleCapability = defineCapability({
  id: 'golden.example.capability',
  name: 'Golden Example Capability',
  version: '1.0.0',
  inputType: 'String',
  outputType: 'String'
});
