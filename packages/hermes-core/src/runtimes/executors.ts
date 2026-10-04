import { ExecutionTask } from './kernel-types';
import { eventBus } from './event-bus';

export interface IExecutor {
  readonly supportedCapability: string;
  execute(task: ExecutionTask, sharedContext: any): Promise<void>;
}

export class LanguageExecutor implements IExecutor {
  supportedCapability = 'language.generate';

  async execute(task: ExecutionTask, sharedContext: any): Promise<void> {
    console.log(`[LanguageExecutor] Generating language for task: ${task.type}`);
    
    // In a real system, this takes the `task.payload`, calls Ollama (or rules), 
    // and produces the final UI/text structure.
    
    if (task.type === 'explain_investment') {
      sharedContext.messages.push({
        role: 'assistant',
        content: 'La inversión está temporalmente bloqueada, pero aquí te explico cómo funciona el proceso...'
      });
    } else {
      sharedContext.messages.push({
        role: 'assistant',
        content: 'Hola, procesando tu solicitud...'
      });
    }

    eventBus.publish('LanguageGenerated', { taskId: task.id });
  }
}

export class RoutingExecutor implements IExecutor {
  supportedCapability = 'routing.navigate';

  async execute(task: ExecutionTask, sharedContext: any): Promise<void> {
    console.log(`[RoutingExecutor] Routing to: ${task.payload?.path}`);
    sharedContext.navigation.push(task.payload?.path);
  }
}

export class SecurityExecutor implements IExecutor {
  supportedCapability = 'security.authorize';

  async execute(task: ExecutionTask, sharedContext: any): Promise<void> {
    console.log(`[SecurityExecutor] Enforcing block: ${task.payload?.reason}`);
    sharedContext.actions.push({ block: true, reason: task.payload?.reason });
  }
}
