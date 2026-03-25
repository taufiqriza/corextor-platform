import type {
    AttendanceHistoryPayload,
    AttendanceRecordItem,
} from '@/types/attendance.types';

export function unwrapAttendanceRecords(
    payload?: AttendanceHistoryPayload | AttendanceRecordItem[] | null,
): AttendanceRecordItem[] {
    if (!payload) return [];
    return Array.isArray(payload) ? payload : payload.data ?? [];
}

export function calculateDistanceMeters(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
): number {
    const earthRadius = 6371000;
    const dLat = degToRad(lat2 - lat1);
    const dLng = degToRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2
        + Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * Math.sin(dLng / 2) ** 2;

    return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceMeters(distance?: number | null): string {
    if (distance == null || Number.isNaN(distance)) return '—';
    if (distance < 1000) return `${Math.round(distance)} m`;
    return `${(distance / 1000).toFixed(2)} km`;
}

export function calculateAttendanceStreak(records: AttendanceRecordItem[]): number {
    const uniqueDays = [...new Set(
        records
            .filter(record => record.time_in && record.time_out)
            .map(record => record.date),
    )].sort((a, b) => b.localeCompare(a));

    if (uniqueDays.length === 0) return 0;

    let streak = 1;
    let cursor = new Date(`${uniqueDays[0]}T00:00:00`);

    for (let index = 1; index < uniqueDays.length; index += 1) {
        cursor.setDate(cursor.getDate() - 1);
        const expected = cursor.toISOString().slice(0, 10);

        if (uniqueDays[index] !== expected) {
            break;
        }

        streak += 1;
    }

    return streak;
}

function degToRad(value: number): number {
    return value * (Math.PI / 180);
}
