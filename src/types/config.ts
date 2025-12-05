export interface SystemConfig {
    id: number;
    workStartTime: string;
    workEndTime: string;
    lateThresholdMinutes: number;
    maxFailedAccessAttempts: number;
    alertCooldownMinutes: number;
    simulationMode: boolean;
    simulatedDateTime?: string;
}

export interface UpdateSystemConfig {
    workStartTime?: string;
    workEndTime?: string;
    lateThresholdMinutes?: number;
    maxFailedAccessAttempts?: number;
    simulationMode?: boolean;
}