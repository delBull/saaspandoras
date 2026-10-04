import { CompiledCognitiveRequest } from './prompt-compiler';

export class CognitiveParseException extends Error {
  constructor(message: string) {
    super(`[COGNITIVE_PARSE_EXCEPTION] ${message}`);
    this.name = 'CognitiveParseException';
  }
}

/**
 * Output exactly as expected from the LLM.
 */
export interface CognitiveDecision {
  thoughtProcess: string;
  action: 'SEND_MESSAGE' | 'ESCALATE' | 'TRIGGER_JOURNEY_TRANSITION' | 'NO_OP';
  payload: Record<string, unknown>;
  confidenceScore: number;
}

export interface LLMResponse {
  rawContent: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class CognitiveResponseParser {
  /**
   * Safely parses the raw LLM response into a structured CognitiveDecision.
   * Defends against hallucinations, malformed JSON, and markdown wrappers.
   */
  public static parse(request: CompiledCognitiveRequest, response: LLMResponse): CognitiveDecision {
    const cleanContent = this.stripMarkdown(response.rawContent);
    
    let parsed: any;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (err: any) {
      throw new CognitiveParseException(`Failed to parse LLM response as JSON: ${err.message}. Raw: ${response.rawContent}`);
    }

    this.validateDecision(parsed);
    return parsed as CognitiveDecision;
  }

  private static stripMarkdown(raw: string): string {
    let clean = raw.trim();
    if (clean.startsWith('```json')) {
      clean = clean.substring(7);
    } else if (clean.startsWith('```')) {
      clean = clean.substring(3);
    }
    
    if (clean.endsWith('```')) {
      clean = clean.substring(0, clean.length - 3);
    }
    return clean.trim();
  }

  private static validateDecision(parsed: any): void {
    if (!parsed || typeof parsed !== 'object') {
      throw new CognitiveParseException('Parsed response is not a valid object');
    }

    if (typeof parsed.thoughtProcess !== 'string') {
      throw new CognitiveParseException('Missing or invalid "thoughtProcess" field');
    }

    const validActions = ['SEND_MESSAGE', 'ESCALATE', 'TRIGGER_JOURNEY_TRANSITION', 'NO_OP'];
    if (!validActions.includes(parsed.action)) {
      throw new CognitiveParseException(`Invalid action: ${parsed.action}`);
    }

    if (typeof parsed.payload !== 'object' || parsed.payload === null) {
      throw new CognitiveParseException('Missing or invalid "payload" field');
    }

    if (typeof parsed.confidenceScore !== 'number' || parsed.confidenceScore < 0 || parsed.confidenceScore > 1) {
      throw new CognitiveParseException('Missing or invalid "confidenceScore" field (must be 0-1)');
    }
  }
}
