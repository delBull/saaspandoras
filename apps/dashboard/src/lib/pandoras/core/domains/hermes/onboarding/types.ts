import { OnboardingStage } from '../onboarding-workflow';

export type OnboardingActionType = 'ASK_FOLLOW_UP' | 'STAGE_READY' | 'KNOWLEDGE_DISCOVERED' | 'CHANNEL_SETUP_REQUIRED';

export interface OnboardingActionProposal {
  type: OnboardingActionType;
  stage: OnboardingStage;
  confidence?: number;
  missingInformation?: string[];
  discoveredKnowledge?: Record<string, string>;
  replyText: string;
}

export interface StageCompletionPolicy {
  stage: OnboardingStage;
  objective: string;
  requiredFacts: string[];
  optionalFacts: string[];
  systemInstruction: string;
}

export interface ExtractedFacts {
  [key: string]: string;
}
