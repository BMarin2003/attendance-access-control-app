export interface AccessLog {
    id: number;
    workerId?: number;
    workerFullName?: string;
    fingerprintId?: number;
    status: 'GRANTED' | 'DENIED' | 'UNAUTHORIZED' | 'FINGERPRINT_NOT_RECOGNIZED';
    location?: string;
    denialReason?: string;
    accessTime: string;
}

export interface SecurityLog {
    id: number;
    eventType: string;
    description: string;
    fingerprintAttempt?: string;
    attemptCount?: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    eventTime: string;
}