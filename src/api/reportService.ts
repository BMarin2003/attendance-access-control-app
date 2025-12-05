import { apiClient } from './apiClient';
import { Attendance } from '../types/attendance';
import { AccessLog, SecurityLog } from '../types/logs';

export const ReportService = {
    getAttendanceHistory: async (startDate: string, endDate: string, status: string = 'ALL', sort: string = 'DESC') => {
        const response = await apiClient.get<any>('/attendance/history', {
            params: { startDate, endDate, status, sort }
        });
        return response.data.data as Attendance[];
    },

    getRecentAccessLogs: async (startTime: string, endTime: string, status: string = 'ALL', sort: string = 'DESC') => {
        const response = await apiClient.get<any>('/access-audit/time-range', {
            params: { startTime, endTime, status, sort }
        });
        return response.data.data as AccessLog[];
    },

    getSecurityLogs: async (
        startTime: string,
        endTime: string,
        severity: string = 'ALL',
        sort: string = 'DESC'
    ) => {
        const response = await apiClient.get<any>('/security/logs', {
            params: { startTime, endTime, severity, sort }
        });
        return response.data.data as SecurityLog[];
    },
};