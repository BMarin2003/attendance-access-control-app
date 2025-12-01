export interface Attendance {
    id: number;
    workerId: number;
    workerFullName: string;
    rfidTag: string;
    attendanceDate: string;
    checkInTime: string;
    checkOutTime?: string;
    workedDuration?: string;
    isLate: boolean;
    latenessDuration?: string;
    status: 'CHECKED_IN' | 'CHECKED_OUT' | 'ABSENT' | 'ON_LEAVE';
}