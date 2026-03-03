export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
    level: LogLevel;
    event: string;
    correlationId?: string;
    protocolId?: number;
    timestamp: string;
    durationMs?: number;
    data?: any;
    message?: string;
}

/**
 * Institutional-grade Structured Logger for the AGORA Engine.
 * Outputs JSON for log aggregation (Datadog, ELK, etc.)
 */
export const logger = {
    log(level: LogLevel, event: string, params: Partial<LogEntry>) {
        const entry: LogEntry = {
            level,
            event,
            timestamp: new Date().toISOString(),
            ...params
        };

        // In production, this would be a real log aggregator stream
        // For staging, we use console to be captured by standard log drivers
        const output = JSON.stringify(entry);

        switch (level) {
            case 'ERROR':
            case 'CRITICAL':
                console.error(output);
                break;
            case 'WARN':
                console.warn(output);
                break;
            default:
                console.log(output);
                break;
        }
    },

    info(event: string, params: Partial<LogEntry> = {}) {
        this.log('INFO', event, params);
    },

    warn(event: string, params: Partial<LogEntry> = {}) {
        this.log('WARN', event, params);
    },

    error(event: string, params: Partial<LogEntry> = {}) {
        this.log('ERROR', event, params);
    },

    critical(event: string, params: Partial<LogEntry> = {}) {
        this.log('CRITICAL', event, params);
    }
};
