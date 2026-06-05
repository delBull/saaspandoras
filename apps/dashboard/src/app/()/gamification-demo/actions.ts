"use server";

import { getUserGamificationProfile, getAvailableGamificationRewards, getGamificationLeaderboard, trackGamificationEvent } from '@/lib/gamification/service';

export async function getProfile(userId: string) {
  return await getUserGamificationProfile(userId);
}

export async function getRewards(userId: string) {
  return await getAvailableGamificationRewards(userId);
}

export async function getLeaderboard() {
  return await getGamificationLeaderboard('points', 10);
}

export async function trackEvent(userId: string, eventType: string) {
  return await trackGamificationEvent(userId, eventType);
}
