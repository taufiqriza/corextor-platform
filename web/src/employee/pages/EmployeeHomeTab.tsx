import { useState } from 'react';
import { Fingerprint, Clock, CheckCircle2, MapPin, Loader2 } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';
import { attendanceApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; greeting: string; }

export function EmployeeHomeTab({ T, isDesktop, greeting }: Props) {
    const user = useAuthStore(s => s.user);
    const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
    const [statusMsg, setStatusMsg] = useState('');
    const [lastAction, setLastAction] = useState<string | null>(null);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const handleCheckIn = async () => {
        setStatus('checking');
        try {
            await attendanceApi.checkIn();
            setStatus('success');
            setStatusMsg('Check-in berhasil!');
            setLastAction(`Check-in: ${timeStr}`);
        } catch (err: any) {
            setStatus('error');
            setStatusMsg(err?.response?.data?.message || 'Gagal check-in');
        }
        setTimeout(() => setStatus('idle'), 3000);
    };

    const handleCheckOut = async () => {
        setStatus('checking');
        try {
            await attendanceApi.checkOut();
            setStatus('success');
            setStatusMsg('Check-out berhasil!');
            setLastAction(`Check-out: ${timeStr}`);
        } catch (err: any) {
            setStatus('error');
            setStatusMsg(err?.response?.data?.message || 'Gagal check-out');
        }
        setTimeout(() => setStatus('idle'), 3000);
    };

    return (
        <div>
            {/* Welcome banner */}
            <div style={{
                background: 'linear-gradient(135deg, #1E3A5F, #0F2341)',
                borderRadius: 20, padding: isDesktop ? 28 : 22,
                marginBottom: 20, position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 130, height: 130, borderRadius: '50%', background: 'rgba(59,130,246,.1)' }} />
                <div style={{ position: 'absolute', bottom: -20, right: 50, width: 80, height: 80, borderRadius: '50%', background: 'rgba(96,165,250,.06)' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#93C5FD', marginBottom: 6 }}>{greeting}</div>
                    <h2 style={{ fontSize: isDesktop ? 22 : 20, fontWeight: 900, color: '#fff', fontFamily: "'Sora', sans-serif", marginBottom: 6 }}>
                        {user?.name ?? 'Karyawan'}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={10} /> {user?.role ?? 'Employee'}
                        </span>
                        {user?.active_products?.map(p => (
                            <span key={p} style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(59,130,246,.15)', color: '#60A5FA', textTransform: 'capitalize' }}>{p}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Time display */}
            <div style={{
                background: T.card, borderRadius: 18, border: `1px solid ${T.border}`,
                padding: 24, textAlign: 'center', marginBottom: 20,
            }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif", letterSpacing: -2 }}>
                    {timeStr}
                </div>
                <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{dateStr}</div>
                {lastAction && (
                    <div style={{ marginTop: 10, fontSize: 11, fontWeight: 600, color: T.success, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} /> {lastAction}
                    </div>
                )}
            </div>

            {/* Status message */}
            {status !== 'idle' && status !== 'checking' && (
                <div style={{
                    padding: '12px 16px', borderRadius: 14, marginBottom: 16, textAlign: 'center',
                    background: status === 'success' ? `${T.success}12` : `${T.danger}12`,
                    border: `1px solid ${status === 'success' ? `${T.success}30` : `${T.danger}30`}`,
                    color: status === 'success' ? T.success : T.danger,
                    fontSize: 13, fontWeight: 700,
                    animation: 'fadeIn .3s ease',
                }}>
                    {statusMsg}
                </div>
            )}

            {/* Check-in / Check-out buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <button onClick={handleCheckIn} disabled={status === 'checking'} style={{
                    height: 100, borderRadius: 18, border: 'none',
                    background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                    color: '#fff', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 8px 28px rgba(34,197,94,.3)',
                    transition: 'all .2s', opacity: status === 'checking' ? .7 : 1,
                    cursor: status === 'checking' ? 'not-allowed' : 'pointer',
                }}>
                    {status === 'checking' ? <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /> : <Fingerprint size={28} strokeWidth={1.5} />}
                    <span style={{ fontSize: 14, fontWeight: 800 }}>Check-in</span>
                </button>

                <button onClick={handleCheckOut} disabled={status === 'checking'} style={{
                    height: 100, borderRadius: 18, border: 'none',
                    background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                    color: '#fff', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 8px 28px rgba(59,130,246,.3)',
                    transition: 'all .2s', opacity: status === 'checking' ? .7 : 1,
                    cursor: status === 'checking' ? 'not-allowed' : 'pointer',
                }}>
                    {status === 'checking' ? <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /> : <Clock size={28} strokeWidth={1.5} />}
                    <span style={{ fontSize: 14, fontWeight: 800 }}>Check-out</span>
                </button>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                    { label: 'Bulan Ini', value: '—', color: T.primary },
                    { label: 'Tepat Waktu', value: '—', color: T.success },
                    { label: 'Terlambat', value: '—', color: T.danger },
                ].map(stat => (
                    <div key={stat.label} style={{
                        background: T.card, borderRadius: 14, border: `1px solid ${T.border}`,
                        padding: 14, textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: stat.color, fontFamily: "'Sora', sans-serif" }}>{stat.value}</div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4, fontWeight: 600 }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
