import { Loader2, Users } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useEffect, useState } from 'react';
import { attendanceApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

export function AttendanceUserPanel({ T, isDesktop }: Props) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        attendanceApi.getUsers().then(res => setUsers(res.data?.data ?? [])).finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} /></div>;

    return (
        <div>
            <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>{users.length} attendance users</div>
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr', gap: 12 }}>
                {users.map((u: any) => (
                    <div key={u.id} style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 900, fontSize: 14,
                            }}>
                                {(u.employee_name ?? 'U').slice(0, 1).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{u.employee_name}</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>ID: {u.employee_id}</div>
                            </div>
                            <span style={{
                                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                background: u.status === 'active' ? `${T.success}15` : `${T.danger}15`,
                                color: u.status === 'active' ? T.success : T.danger,
                            }}>{u.status}</span>
                        </div>
                    </div>
                ))}
                {users.length === 0 && (
                    <div style={{ padding: 24, color: T.textMuted, fontSize: 13 }}>Belum ada attendance user.</div>
                )}
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
