import { CapabilityContext } from './capability-contracts';

export interface DispatchRequest {
  capabilityId: string;
  version: string;
  input: any;
  context: CapabilityContext;
}
