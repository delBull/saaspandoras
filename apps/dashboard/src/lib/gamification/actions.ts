"use server";

import { trackGamificationEvent } from "./service";

export async function trackEventAction(userId: string, eventType: string, eventData?: any) {
  return await trackGamificationEvent(userId, eventType, eventData);
}
