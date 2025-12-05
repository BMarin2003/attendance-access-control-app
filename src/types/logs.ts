export interface AccessLog {
    id: number;
    workerId?: number;
    workerFullName?: string;
    fingerprintId?: number;
    accessGranted: boolean;
    status: string;
    location?: string;
    accessTime: string;
}

export interface SecurityLog {
    id: number;
    eventType: string;
    description: string;
    fingerprintAttempt?: string;
    attemptCount?: number;
    severity: string;
    eventTime: string;
}