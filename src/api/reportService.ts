import { apiClient } from './apiClient';
import { Attendance } from '../types/attendance';
import { AccessLog, SecurityLog } from '../types/logs';

export const ReportService = {
    // --- Asistencias ---
    getAttendanceByDate: async (date: string) => {
        const response = await apiClient.get<any>(`/attendance/date/${date}`);
        return response.data.data as Attendance[];
    },

    getLateAttendanceByDate: async (date: string) => {
        const response = await apiClient.get<any>(`/attendance/date/${date}/late`);
        return response.data.data as Attendance[];
    },

    getWorkerAttendance: async (workerId: number, startDate: string, endDate: string) => {
        const response = await apiClient.get<any>(`/attendance/worker/${workerId}`, {
            params: { startDate, endDate }
        });
        return response.data.data as Attendance[];
    },

    // --- Accesos ---
    getRecentAccessLogs: async (startTime: string, endTime: string) => {
        const response = await apiClient.get<any>('/access/time-range', {
            params: { startTime, endTime }
        });
        return response.data.data as AccessLog[];
    },

    getDeniedAccessLogs: async (hours: number = 24) => {
        const response = await apiClient.get<any>('/access/denied', {
            params: { hours }
        });
        return response.data.data as AccessLog[];
    },

    getWorkerAccessLogs: async (workerId: number) => {
        const response = await apiClient.get<any>(`/access/worker/${workerId}`);
        return response.data.data as AccessLog[];
    },

    // --- Seguridad ---
    getSecurityLogs: async (startTime: string, endTime: string) => {
        const response = await apiClient.get<any>('/security/logs', {
            params: { startTime, endTime }
        });
        return response.data.data as SecurityLog[];
    },

    getCriticalSecurityEvents: async () => {
        const response = await apiClient.get<any>('/security/critical');
        return response.data.data as SecurityLog[];
    }
};