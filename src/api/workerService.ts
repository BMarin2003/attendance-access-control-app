import { apiClient } from './apiClient';
import { Worker, CreateWorkerRequest, UpdateWorkerRequest } from '../types/worker';

export const WorkerService = {
    // --- CRUD Básico ---
    getAll: async () => {
        const response = await apiClient.get<any>('/workers');
        return response.data.data as Worker[];
    },

    getById: async (id: number) => {
        const response = await apiClient.get<any>(`/workers/${id}`);
        return response.data.data as Worker;
    },

    create: async (data: CreateWorkerRequest) => {
        // Este endpoint inicia la espera síncrona de la huella (hasta 40s)
        const response = await apiClient.post<any>('/workers', data);
        return response.data.data as Worker;
    },

    update: async (id: number, data: UpdateWorkerRequest) => {
        const response = await apiClient.put<any>(`/workers/${id}`, data);
        return response.data.data as Worker;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/workers/${id}`);
    },

    // --- Gestión de Estado y Permisos ---
    activate: async (id: number) => {
        const response = await apiClient.post<any>(`/workers/${id}/activate`);
        return response.data.data as Worker;
    },

    deactivate: async (id: number) => {
        const response = await apiClient.post<any>(`/workers/${id}/deactivate`);
        return response.data.data as Worker;
    },

    grantAccess: async (id: number) => {
        const response = await apiClient.post<any>(`/workers/${id}/grant-access`);
        return response.data.data as Worker;
    },

    revokeAccess: async (id: number) => {
        const response = await apiClient.post<any>(`/workers/${id}/revoke-access`);
        return response.data.data as Worker;
    },

    // --- Biometría Manual ---
    assignManualFingerprint: async (id: number, fingerprintId: number) => {
        const response = await apiClient.post<any>(`/workers/${id}/fingerprint`, { fingerprintId });
        return response.data.data as Worker;
    },

    // --- Gestión de RFID ---
    getUnassignedTags: async () => {
        const response = await apiClient.get<any>('/workers/rfid/unassigned');
        return response.data.data as string[];
    },

    assignRfid: async (workerId: number, rfidTag: string) => {
        const response = await apiClient.post<any>(`/workers/${workerId}/rfid-tags`, { rfidTag });
        return response.data.data as Worker;
    },

    // ESTE ES EL MÉTODO QUE FALTABA O SE PERDIÓ
    removeRfid: async (workerId: number, rfidTag: string) => {
        // Se envía como query param: DELETE /workers/{id}/rfid-tags?rfidTag=XY
        const response = await apiClient.delete<any>(`/workers/${workerId}/rfid-tags`, {
            params: { rfidTag }
        });
        return response.data.data as Worker;
    }
};