import { db } from '@/db';
import { 
  hermesJourneys, 
  hermesJourneyStages, 
  hermesJourneyTransitions, 
  hermesActorJourneys 
} from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { 
  ActorJourneyState, 
  JourneyDefinition, 
  JourneyStage, 
  JourneyTransition 
} from './contracts';
import { ActorJourneyNotFoundError, JourneyNotFoundError } from './errors';

export class JourneyRepository {
  public async getActiveJourney(organizationId: string, journeyId: string): Promise<JourneyDefinition> {
    const records = await db
      .select()
      .from(hermesJourneys)
      .where(
        and(
          eq(hermesJourneys.id, journeyId),
          eq(hermesJourneys.organizationId, organizationId),
          eq(hermesJourneys.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (records.length === 0) {
      throw new JourneyNotFoundError(organizationId, journeyId);
    }

    return records[0] as JourneyDefinition;
  }

  public async getJourneyStages(journeyId: string): Promise<JourneyStage[]> {
    const records = await db
      .select()
      .from(hermesJourneyStages)
      .where(eq(hermesJourneyStages.journeyId, journeyId))
      .orderBy(hermesJourneyStages.orderIndex);

    return records as JourneyStage[];
  }

  public async getJourneyTransitions(journeyId: string): Promise<JourneyTransition[]> {
    const records = await db
      .select()
      .from(hermesJourneyTransitions)
      .where(
        and(
          eq(hermesJourneyTransitions.journeyId, journeyId),
          eq(hermesJourneyTransitions.status, 'ACTIVE')
        )
      )
      .orderBy(hermesJourneyTransitions.priority);

    return records as JourneyTransition[];
  }
}

export class ActorJourneyRepository {
  public async getActorJourney(organizationId: string, actorId: string): Promise<ActorJourneyState | null> {
    const records = await db
      .select()
      .from(hermesActorJourneys)
      .where(
        and(
          eq(hermesActorJourneys.organizationId, organizationId),
          eq(hermesActorJourneys.actorId, actorId),
          eq(hermesActorJourneys.status, 'IN_PROGRESS')
        )
      )
      .limit(1);

    if (records.length === 0) {
      return null;
    }

    return records[0] as unknown as ActorJourneyState; // Drizzle types might need slight adjustment for dates
  }

  public async createActorJourney(state: Omit<ActorJourneyState, 'id' | 'lastAdvancedAt'>): Promise<void> {
    await db.insert(hermesActorJourneys).values({
      organizationId: state.organizationId,
      actorId: state.actorId,
      journeyId: state.journeyId,
      journeyVersion: state.journeyVersion,
      currentStageId: state.currentStageId,
      status: state.status,
      startedAt: state.startedAt,
      lastAdvancedAt: new Date(),
    });
  }

  public async advanceActorJourney(organizationId: string, actorId: string, newState: ActorJourneyState): Promise<void> {
    const result = await db
      .update(hermesActorJourneys)
      .set({
        currentStageId: newState.currentStageId,
        status: newState.status,
        lastAdvancedAt: newState.lastAdvancedAt,
        completedAt: newState.completedAt,
      })
      .where(
        and(
          eq(hermesActorJourneys.organizationId, organizationId),
          eq(hermesActorJourneys.actorId, actorId),
          eq(hermesActorJourneys.status, 'IN_PROGRESS')
        )
      )
      .returning({ id: hermesActorJourneys.id });
      
    if (result.length === 0) {
      throw new ActorJourneyNotFoundError(organizationId, actorId);
    }
  }
}
