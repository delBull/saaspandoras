import { PackActionDefinition } from '../../core/contracts';

export const SNARAI_ACTIONS: PackActionDefinition[] = [
  {
    id: 'launch_product',
    execution: {
      workflow: 'commercial.product_launch.v1'
    }
  }
];
