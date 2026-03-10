import { Loader2, Users, KeyRound, Check, X } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useEffect, useState } from 'react';
import { attendanceApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

export function AttendanceUserPanel({ T, isDesktop }: Props) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [resetId, setResetId] = useState<number | null>(null);
    const [newPin, setNewPin] = useState('');
    const [resetting, setResetting] = useState(false);
    const [resetMsg, setResetMsg] = useState('');

    useEffect(() => {
        attendanceApi.getUsers().then(res => setUsers(res.data?.data ?? [])).finally(() => setLoading(false));
    }, []);

    const handleResetPin = async (id: number) => {
        if (!newPin || newPin.length < 4) return;
        setResetting(true);
        setResetMsg('');
        try {
            await attendanceApi.resetPin(id, newPin);
            setResetMsg('PIN berhasil direset!');
            setTimeout(() => { setResetId(null); setNewPin(''); setResetMsg(''); }, 1500);
        } catch (err: any) {
            setResetMsg(err?.response?.data?.message || 'Gagal reset PIN');
        } finally { setResetting(false); }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 12 }}>
            <Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, color: T.textMuted }}>Memuat users...</span>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div>
            <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>{users.length} attendance users</div>

            {users.length === 0 ? (
                <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${T.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <Users size={22} color={T.textMuted} />
                    </div>
                    <p style={{ fontSize: 13, color: T.textMuted }}>Belum ada attendance user.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr', gap: 12 }}>
                    {users.map((u: any) => (
                        <div key={u.id} style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: resetId === u.id ? 12 : 0 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 12,
                                    background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 900, fontSize: 14, flexShrink: 0,
                                }}>
                                    {(u.employee_name ?? 'U').slice(0, 1).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{u.employee_name ?? `User #${u.platform_user_id}`}</div>
                                    <div style={{ fontSize: 11, color: T.textMuted }}>ID: {u.employee_id ?? u.id}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                        background: u.status === 'active' ? `${T.success}15` : `${T.danger}15`,
                                        color: u.status === 'active' ? T.success : T.danger,
                                    }}>{u.status}</span>
                                    <button onClick={() => { setResetId(resetId === u.id ? null : u.id); setNewPin(''); setResetMsg(''); }}
                                        style={{ fontSize: 10, fontWeight: 700, color: T.info, display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <KeyRound size={10} /> Reset PIN
                                    </button>
                                </div>
                            </div>

                            {resetId === u.id && (
                                <div style={{ background: T.surface, borderRadius: 10, padding: 12, animation: 'fadeIn .2s ease' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textSub, marginBottom: 8 }}>PIN Baru (min. 4 digit)</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="••••" inputMode="numeric" maxLength={6} autoFocus
                                            style={{
                                                flex: 1, height: 36, borderRadius: 8, border: `1px solid ${T.border}`,
                                                background: T.card, padding: '0 10px', fontSize: 14, color: T.text,
                                                letterSpacing: 6, fontWeight: 700, textAlign: 'center',
                                            }} />
                                        <button onClick={() => handleResetPin(u.id)} disabled={resetting || newPin.length < 4}
                                            style={{ height: 36, padding: '0 12px', borderRadius: 8, background: T.primary, color: '#fff', fontSize: 11, fontWeight: 700, opacity: resetting || newPin.length < 4 ? .5 : 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Check size={12} /> Set
                                        </button>
                                        <button onClick={() => { setResetId(null); setNewPin(''); setResetMsg(''); }}
                                            style={{ height: 36, padding: '0 8px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.textSub }}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                    {resetMsg && (
                                        <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: resetMsg.includes('berhasil') ? T.success : T.danger }}>
                                            {resetMsg}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
