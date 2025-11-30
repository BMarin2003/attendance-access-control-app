export interface Worker {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    documentNumber: string;
    email?: string;
    phoneNumber?: string;
    fingerprintId?: number;
    rfidTags: string[];
    hasRestrictedAreaAccess: boolean;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED';
    createdAt: string;
    updatedAt: string;
}

export interface CreateWorkerRequest {
    firstName: string;
    lastName: string;
    documentNumber: string;
    email?: string;
    phoneNumber?: string;
    hasRestrictedAreaAccess?: boolean;
}

export interface UpdateWorkerRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    hasRestrictedAreaAccess?: boolean;
}

export interface AddRfidRequest {
    rfidTag: string;
}