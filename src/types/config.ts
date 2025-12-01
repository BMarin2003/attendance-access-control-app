export interface SystemConfig {
    simulatedDateTime: string;
    id: number;
    workStartTime: string;
    workEndTime: string;
    lateThresholdMinutes: number;
    maxFailedAccessAttempts: number;
    alertCooldownMinutes: number;
    simulationMode: boolean;
}

export interface UpdateConfigRequest {
    workStartTime?: string;
    workEndTime?: string;
    lateThresholdMinutes?: number;
    maxFailedAccessAttempts?: number;
}