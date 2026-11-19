/**
 * Regla única del lobby de Sovereign Meet.
 *
 * Se separa del componente para que la decisión sea testeable y para que
 * `?lobby=1` (vista previa del host) no se confunda con el rol real:
 *
 *   - El host NUNCA espera, salvo que pida explícitamente la vista previa.
 *   - El invitado espera solo si sabemos que el host NO está (`false`).
 *   - Si no se pudo determinar (`null`), se deja pasar: nunca encerrar por duda.
 *
 * `previewLobby` es puramente visual; no cambia el rol ni la autorización, que
 * vienen firmados en el token del servidor.
 */
export interface LobbyGateInput {
  hasMeeting: boolean;
  isHost: boolean;
  hostPresent: boolean | null;
  entered: boolean;
  previewLobby?: boolean;
}

export function shouldShowLobby({
  hasMeeting,
  isHost,
  hostPresent,
  entered,
  previewLobby = false,
}: LobbyGateInput): boolean {
  if (!hasMeeting || entered) return false;
  if (isHost) return previewLobby;
  return hostPresent === false;
}
