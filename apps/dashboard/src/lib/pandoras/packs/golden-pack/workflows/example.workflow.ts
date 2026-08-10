import { defineWorkflow } from '../../../core/sdk/define-workflow';

export const ExampleWorkflow = defineWorkflow({
  id: 'golden.example.process.v1',
  version: '1.0.0',
  initialState: 'IDLE',
  terminalStates: ['COMPLETED', 'FAILED'],
  stages: ['IDLE', 'PROCESSING', 'COMPLETED', 'FAILED'],
  requiredCapabilities: ['golden.example.capability'],
  inputType: 'ExampleInput',
  outputType: 'ExampleOutput'
}, { tags: ['template'], owner: 'pandoras_core' });
