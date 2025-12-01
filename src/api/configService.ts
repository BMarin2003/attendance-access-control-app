import { apiClient } from './apiClient';
import { SystemConfig, UpdateConfigRequest } from '../types/config';

export const ConfigService = {
    get: async () => {
        const response = await apiClient.get<any>('/system/config');
        return response.data.data as SystemConfig;
    },

    update: async (data: UpdateConfigRequest) => {
        const response = await apiClient.put<any>('/system/config', data);
        return response.data.data as SystemConfig;
    },

    initialize: async () => {
        const response = await apiClient.post<any>('/system/config/initialize');
        return response.data.data as SystemConfig;
    },

    // --- Simulación ---
    enableSimulation: async (simulatedDateTime: string) => {
        // simulatedDateTime formato: yyyy-MM-dd'T'HH:mm:ss
        const response = await apiClient.post<any>('/system/config/simulation/enable', {
            simulationMode: true,
            simulatedDateTime
        });
        return response.data.data as SystemConfig;
    },

    disableSimulation: async () => {
        const response = await apiClient.post<any>('/system/config/simulation/disable');
        return response.data.data as SystemConfig;
    },

    // --- Firebase Admin ---
    diagnose: async () => {
        const response = await apiClient.get<any>('/firebase/admin/diagnose');
        return response.data;
    },

    formatSensor: async () => {
        const response = await apiClient.post<any>('/firebase/admin/command/format');
        return response.data;
    },

    clearCommand: async () => {
        const response = await apiClient.post<any>('/firebase/admin/command/clear');
        return response.data;
    }
};