import { apiClient } from './apiClient';
import { SystemConfig, UpdateSystemConfig } from '../types/config';

export const ConfigService = {
    getConfig: async () => {
        const response = await apiClient.get<any>('/system/config');
        return response.data.data as SystemConfig;
    },

    updateConfig: async (config: UpdateSystemConfig) => {
        const response = await apiClient.put<any>('/system/config', config);
        return response.data.data as SystemConfig;
    },

    initializeConfig: async () => {
        const response = await apiClient.post<any>('/system/config/initialize');
        return response.data.data as SystemConfig;
    },

    enableSimulation: async (dateTime: string) => {
        const response = await apiClient.post<any>('/system/config/simulation/enable', {
            simulatedDateTime: dateTime,
            simulationMode: true
        });
        return response.data.data as SystemConfig;
    },

    disableSimulation: async () => {
        const response = await apiClient.post<any>('/system/config/simulation/disable');
        return response.data.data as SystemConfig;
    }
};