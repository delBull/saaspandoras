import { Mission } from '../../core/contracts/mission-contracts';

export interface MissionRepository {
  /**
   * Persiste una nueva misión.
   */
  create(mission: Mission): Promise<Mission>;

  /**
   * Obtiene la misión activa para una organización.
   */
  getActiveMission(organizationId: string): Promise<Mission | null>;

  /**
   * Obtiene una misión por su ID.
   */
  getById(missionId: string): Promise<Mission | null>;

  /**
   * Actualiza el estado estratégico y operativo de una misión.
   */
  update(mission: Mission): Promise<Mission>;

  /**
   * Marca un milestone como completado.
   */
  completeMilestone(missionId: string, milestoneKey: string): Promise<void>;

  /**
   * Registra un evento de auditoría/trazabilidad en la misión.
   */
  logEvent(missionId: string, eventType: string, payload: Record<string, any>): Promise<void>;
}
