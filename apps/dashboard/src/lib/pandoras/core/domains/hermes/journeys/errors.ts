export class JourneyDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JourneyDomainError';
  }
}

export class InvalidTransitionError extends JourneyDomainError {
  constructor(reason: string) {
    super(`Invalid journey transition: ${reason}`);
    this.name = 'InvalidTransitionError';
  }
}

export class JourneyNotFoundError extends JourneyDomainError {
  constructor(organizationId: string, journeyId: string) {
    super(`Journey ${journeyId} not found for organization ${organizationId}`);
    this.name = 'JourneyNotFoundError';
  }
}

export class ActorJourneyNotFoundError extends JourneyDomainError {
  constructor(organizationId: string, actorId: string) {
    super(`Actor journey not found for actor ${actorId} in organization ${organizationId}`);
    this.name = 'ActorJourneyNotFoundError';
  }
}

export class TenantIsolationError extends JourneyDomainError {
  constructor(resourceId: string, organizationId: string) {
    super(`Resource ${resourceId} does not belong to organization ${organizationId}`);
    this.name = 'TenantIsolationError';
  }
}
