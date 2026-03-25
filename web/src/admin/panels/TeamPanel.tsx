import { useEffect, useMemo, useState } from 'react';
import {
    Crown, Loader2, MoreVertical, RefreshCcw, Search, Shield,
    UserPlus, Users, Wallet, X,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { platformApi } from '@/api/platform.api';

/* ═══════════════════ Types ═══════════════════ */
interface Props { T: Theme; isDesktop: boolean; }

interface TeamMember {
    id: number;
    name: string;
    email: string;
    platform_role: string;
    status: string;
    created_at: string;
}

interface TeamStats {
    total: number; admins: number; staff: number; finance: number;
    active: number; suspended: number;
}

/* ═══════════════════ Helpers ═══════════════════ */
function roleMeta(role: string, T: Theme) {
    switch (role) {
        case 'super_admin': return { label: 'Super Admin', bg: `${T.gold}14`, color: T.gold, border: `${T.gold}35`, icon: Crown };
        case 'platform_staff': return { label: 'Staff', bg: `${T.primary}14`, color: T.primary, border: `${T.primary}35`, icon: Shield };
        case 'platform_finance': return { label: 'Finance', bg: `${T.info}14`, color: T.info, border: `${T.info}35`, icon: Wallet };
        default: return { label: role, bg: `${T.textMuted}10`, color: T.textMuted, border: T.border, icon: Users };
    }
}

function statusMeta(status: string, T: Theme) {
    return status === 'active'
        ? { label: 'Active', bg: `${T.success}14`, color: T.success }
        : { label: 'Suspended', bg: `${T.danger}12`, color: T.danger };
}

/* ═══════════════════ Component ═══════════════════ */
export function TeamPanel({ T, isDesktop }: Props) {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [stats, setStats] = useState<TeamStats>({ total: 0, admins: 0, staff: 0, finance: 0, active: 0, suspended: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Invite modal
    const [showInvite, setShowInvite] = useState(false);
    const [invName, setInvName] = useState('');
    const [invEmail, setInvEmail] = useState('');
    const [invRole, setInvRole] = useState('platform_staff');
    const [invLoading, setInvLoading] = useState(false);
    const [invError, setInvError] = useState('');
    const [inviteCredentials, setInviteCredentials] = useState<{ email: string; temporary_password: string } | null>(null);

    // Action menu
    const [activeMenu, setActiveMenu] = useState<number | null>(null);
    const [editModal, setEditModal] = useState<TeamMember | null>(null);
    const [editRole, setEditRole] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    const loadTeam = async () => {
        setLoading(true);
        try {
            const res = await platformApi.getTeam();
            const data = res.data?.data ?? {};
            setMembers(data.members ?? []);
            setStats(data.stats ?? stats);
        } catch { setMembers([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadTeam(); }, []);

    const filtered = useMemo(() => {
        let list = members;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
        }
        if (roleFilter !== 'all') list = list.filter(m => m.platform_role === roleFilter);
        return list;
    }, [members, search, roleFilter]);

    /* ── Invite ── */
    const handleInvite = async () => {
        if (!invName.trim() || !invEmail.trim()) return;
        setInvLoading(true);
        setInvError('');
        try {
            const response = await platformApi.inviteTeamMember({ name: invName, email: invEmail, platform_role: invRole });
            const credentials = response.data?.data?.credentials;
            setShowInvite(false); setInvName(''); setInvEmail(''); setInvRole('platform_staff');
            if (credentials?.email && credentials?.temporary_password) {
                setInviteCredentials(credentials);
            }
            loadTeam();
        } catch (e: any) {
            setInvError(e.response?.data?.message || 'Gagal invite member.');
        } finally { setInvLoading(false); }
    };

    /* ── Edit ── */
    const openEdit = (m: TeamMember) => {
        setEditModal(m); setEditRole(m.platform_role); setEditStatus(m.status); setActiveMenu(null);
    };
    const handleUpdate = async () => {
        if (!editModal) return;
        setEditLoading(true);
        try {
            await platformApi.updateTeamMember(editModal.id, { platform_role: editRole, status: editStatus });
            setEditModal(null);
            loadTeam();
        } catch { }
        finally { setEditLoading(false); }
    };

    /* ── Remove ── */
    const handleRemove = async (id: number) => {
        if (!confirm('Remove member ini dari team?')) return;
        try { await platformApi.removeTeamMember(id); loadTeam(); } catch { }
        setActiveMenu(null);
    };

    /* ═══ Styles ═══ */
    const s = {
        statCard: { background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: '12px 14px' } as React.CSSProperties,
        statVal: { fontSize: 22, fontWeight: 900, color: T.text, marginTop: 6, fontFamily: "'Sora', sans-serif" } as React.CSSProperties,
        section: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: isDesktop ? 16 : 12 } as React.CSSProperties,
        sectionIcon: { width: 30, height: 30, borderRadius: 10, background: `${T.primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties,
        searchWrap: { flex: 1, minWidth: isDesktop ? 240 : '100%', display: 'flex', alignItems: 'center', gap: 8, height: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, padding: '0 10px' } as React.CSSProperties,
        thCell: { textAlign: 'left' as const, padding: '11px 12px', fontSize: 11, letterSpacing: '.02em', textTransform: 'uppercase' as const, color: T.textMuted, borderBottom: `1px solid ${T.border}` } as React.CSSProperties,
        tdCell: { padding: '12px 12px', borderBottom: `1px solid ${T.border}` } as React.CSSProperties,
        mCard: { borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgAlt, padding: 14 } as React.CSSProperties,
        pill: (bg: string, color: string, border?: string) => ({
            fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
            background: bg, color, border: `1px solid ${border || bg}`,
            display: 'inline-flex', alignItems: 'center', gap: 4,
        } as React.CSSProperties),
        btn: (bg: string, color: string) => ({
            height: 40, padding: '0 16px', borderRadius: 11, background: bg, color,
            fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6,
        } as React.CSSProperties),
        modal: {
            position: 'fixed' as const, inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        } as React.CSSProperties,
        modalBox: {
            background: T.card, borderRadius: 18, border: `1px solid ${T.border}`,
            padding: isDesktop ? 28 : 20, width: '100%', maxWidth: 440,
        } as React.CSSProperties,
        input: {
            width: '100%', height: 42, borderRadius: 10, border: `1px solid ${T.border}`,
            background: T.bgAlt, color: T.text, fontSize: 13, padding: '0 12px',
        } as React.CSSProperties,
    };

    /* ── Avatar ── */
    const Av = ({ name, size = 34, tone }: { name: string; size?: number; tone: string }) => (
        <div style={{
            width: size, height: size, borderRadius: 10, background: `${tone}14`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            fontSize: size * 0.36, fontWeight: 900, color: tone,
        }}>
            {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
    );

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {/* ── Stats Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, minmax(0,1fr))' : '1fr 1fr', gap: 10 }}>
                {[
                    { label: 'Total Team', value: stats.total, icon: Users, tone: T.primary },
                    { label: 'Super Admin', value: stats.admins, icon: Crown, tone: T.gold },
                    { label: 'Staff', value: stats.staff, icon: Shield, tone: T.info },
                    { label: 'Finance', value: stats.finance, icon: Wallet, tone: T.success },
                ].map(c => (
                    <div key={c.label} style={s.statCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: T.textMuted }}>{c.label}</span>
                            <c.icon size={14} color={c.tone} />
                        </div>
                        <div style={s.statVal}>{c.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Main Section ── */}
            <section style={s.section}>
                <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 10, flexDirection: isDesktop ? 'row' : 'column' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={s.sectionIcon}><Shield size={14} color={T.primary} /></div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Team Corextor</div>
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12, color: T.textMuted }}>{filtered.length} anggota tim internal</div>
                    </div>
                    <button onClick={() => setShowInvite(true)} style={s.btn(T.primary, '#fff')}>
                        <UserPlus size={14} /> Invite
                    </button>
                </div>

                {/* Search + Filter */}
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <div style={s.searchWrap}>
                        <Search size={14} color={T.textMuted} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau email..."
                            style={{ flex: 1, color: T.text, fontSize: 13 }} />
                        {search && <button onClick={() => setSearch('')} style={{ color: T.textMuted }}><X size={12} /></button>}
                    </div>
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                        style={{ height: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, fontSize: 12, padding: '0 10px', minWidth: 120 }}>
                        <option value="all">Semua Role</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="platform_staff">Staff</option>
                        <option value="platform_finance">Finance</option>
                    </select>
                    <button onClick={loadTeam} style={{ height: 40, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textSub, padding: '0 10px', display: 'inline-flex', alignItems: 'center' }} title="Refresh"><RefreshCcw size={14} /></button>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Loader2 size={22} color={T.primary} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }} />
                        <span style={{ fontSize: 12, color: T.textMuted }}>Memuat data team...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Users size={28} color={T.textMuted} style={{ margin: '0 auto 8px', display: 'block' }} />
                        <p style={{ fontSize: 13, color: T.textMuted }}>{search ? 'Tidak ditemukan.' : 'Belum ada team member.'}</p>
                    </div>
                ) : isDesktop ? (
                    /* Desktop Table */
                    <div style={{ marginTop: 12, border: `1px solid ${T.border}`, borderRadius: 14, overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 600 }}>
                            <thead><tr style={{ background: T.bgAlt }}>
                                {['Member', 'Email', 'Role', 'Status', ''].map(h => <th key={h} style={s.thCell}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {filtered.map(m => {
                                    const rm = roleMeta(m.platform_role, T);
                                    const sm = statusMeta(m.status, T);
                                    const Icon = rm.icon;
                                    return (
                                        <tr key={m.id} style={{ background: T.card, transition: 'background .15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = T.bgAlt}
                                            onMouseLeave={e => e.currentTarget.style.background = T.card}>
                                            <td style={s.tdCell}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <Av name={m.name} tone={rm.color} />
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{m.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ ...s.tdCell, fontSize: 12, color: T.textSub }}>{m.email}</td>
                                            <td style={s.tdCell}>
                                                <span style={s.pill(rm.bg, rm.color, rm.border)}>
                                                    <Icon size={10} /> {rm.label}
                                                </span>
                                            </td>
                                            <td style={s.tdCell}>
                                                <span style={s.pill(sm.bg, sm.color)}>{sm.label}</span>
                                            </td>
                                            <td style={{ ...s.tdCell, textAlign: 'right', position: 'relative' }}>
                                                {m.platform_role !== 'super_admin' && (
                                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                                        <button onClick={() => setActiveMenu(activeMenu === m.id ? null : m.id)}
                                                            style={{ color: T.textMuted, padding: 6, borderRadius: 8 }}>
                                                            <MoreVertical size={14} />
                                                        </button>
                                                        {activeMenu === m.id && (
                                                            <div style={{
                                                                position: 'absolute', right: 0, top: '100%', zIndex: 20,
                                                                background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
                                                                boxShadow: T.shadow, minWidth: 140, overflow: 'hidden',
                                                            }}>
                                                                <button onClick={() => openEdit(m)} style={{
                                                                    display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                                                                    fontSize: 12, color: T.text, borderBottom: `1px solid ${T.border}`,
                                                                }}>Edit Role/Status</button>
                                                                <button onClick={() => handleRemove(m.id)} style={{
                                                                    display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                                                                    fontSize: 12, color: T.danger,
                                                                }}>Remove</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Mobile Cards */
                    <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                        {filtered.map(m => {
                            const rm = roleMeta(m.platform_role, T);
                            const sm = statusMeta(m.status, T);
                            const Icon = rm.icon;
                            return (
                                <div key={m.id} style={s.mCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Av name={m.name} size={38} tone={rm.color} />
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{m.name}</div>
                                                <div style={{ fontSize: 11, color: T.textMuted }}>{m.email}</div>
                                            </div>
                                        </div>
                                        {m.platform_role !== 'super_admin' && (
                                            <button onClick={() => openEdit(m)} style={{ color: T.textMuted, padding: 4 }}>
                                                <MoreVertical size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                                        <span style={s.pill(rm.bg, rm.color, rm.border)}><Icon size={10} /> {rm.label}</span>
                                        <span style={s.pill(sm.bg, sm.color)}>{sm.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ═══ Invite Modal ═══ */}
            {showInvite && (
                <div style={s.modal} onClick={() => setShowInvite(false)}>
                    <div style={s.modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text }}>Invite Team Member</h3>
                            <button onClick={() => setShowInvite(false)} style={{ color: T.textMuted }}><X size={18} /></button>
                        </div>

                        <div style={{ display: 'grid', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6 }}>NAMA</label>
                                <input value={invName} onChange={e => setInvName(e.target.value)} placeholder="Nama lengkap" style={s.input} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6 }}>EMAIL</label>
                                <input value={invEmail} onChange={e => setInvEmail(e.target.value)} placeholder="email@corextor.com" style={s.input} type="email" />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6 }}>ROLE</label>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    {[
                                        { value: 'platform_staff', label: 'Platform Staff', desc: 'Kelola companies, support, report', icon: Shield, tone: T.primary },
                                        { value: 'platform_finance', label: 'Platform Finance', desc: 'Invoice, subscription, billing', icon: Wallet, tone: T.info },
                                    ].map(r => (
                                        <label key={r.value} style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px 14px', borderRadius: 12,
                                            border: `1.5px solid ${invRole === r.value ? `${r.tone}80` : T.border}`,
                                            background: invRole === r.value ? `${r.tone}08` : T.bgAlt,
                                            cursor: 'pointer', transition: 'all .15s',
                                        }}>
                                            <input type="radio" name="role" value={r.value} checked={invRole === r.value}
                                                onChange={() => setInvRole(r.value)} style={{ display: 'none' }} />
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 10, background: `${r.tone}14`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            }}>
                                                <r.icon size={16} color={r.tone} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{r.label}</div>
                                                <div style={{ fontSize: 11, color: T.textMuted }}>{r.desc}</div>
                                            </div>
                                            <div style={{
                                                marginLeft: 'auto', width: 16, height: 16, borderRadius: '50%',
                                                border: `2px solid ${invRole === r.value ? r.tone : T.border}`,
                                                background: invRole === r.value ? r.tone : 'transparent',
                                            }} />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {invError && <div style={{ fontSize: 12, color: T.danger, padding: '8px 12px', borderRadius: 8, background: `${T.danger}10` }}>{invError}</div>}

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                                <button onClick={() => setShowInvite(false)} style={{
                                    height: 40, padding: '0 18px', borderRadius: 10, border: `1px solid ${T.border}`,
                                    background: T.bgAlt, color: T.textSub, fontSize: 12, fontWeight: 700,
                                }}>Batal</button>
                                <button onClick={handleInvite} disabled={invLoading || !invName.trim() || !invEmail.trim()} style={{
                                    height: 40, padding: '0 20px', borderRadius: 10, background: T.primary,
                                    color: '#fff', fontSize: 12, fontWeight: 700, opacity: invLoading ? .6 : 1,
                                }}>
                                    {invLoading ? 'Sending...' : 'Invite Member'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Edit Modal ═══ */}
            {editModal && (
                <div style={s.modal} onClick={() => setEditModal(null)}>
                    <div style={s.modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text }}>Edit: {editModal.name}</h3>
                            <button onClick={() => setEditModal(null)} style={{ color: T.textMuted }}><X size={18} /></button>
                        </div>

                        <div style={{ display: 'grid', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6 }}>ROLE</label>
                                <select value={editRole} onChange={e => setEditRole(e.target.value)} style={s.input}>
                                    <option value="platform_staff">Platform Staff</option>
                                    <option value="platform_finance">Platform Finance</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6 }}>STATUS</label>
                                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={s.input}>
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 4 }}>
                                <button onClick={() => handleRemove(editModal.id)} style={{
                                    height: 40, padding: '0 14px', borderRadius: 10, border: `1px solid ${T.danger}30`,
                                    background: `${T.danger}08`, color: T.danger, fontSize: 12, fontWeight: 700,
                                }}>Remove</button>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => setEditModal(null)} style={{
                                        height: 40, padding: '0 18px', borderRadius: 10, border: `1px solid ${T.border}`,
                                        background: T.bgAlt, color: T.textSub, fontSize: 12, fontWeight: 700,
                                    }}>Batal</button>
                                    <button onClick={handleUpdate} disabled={editLoading} style={{
                                        height: 40, padding: '0 18px', borderRadius: 10, background: T.primary,
                                        color: '#fff', fontSize: 12, fontWeight: 700, opacity: editLoading ? .6 : 1,
                                    }}>
                                        {editLoading ? 'Saving...' : 'Simpan'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {inviteCredentials && (
                <div style={s.modal} onClick={() => setInviteCredentials(null)}>
                    <div style={s.modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text }}>Kredensial Team Member</h3>
                            <button onClick={() => setInviteCredentials(null)} style={{ color: T.textMuted }}><X size={18} /></button>
                        </div>

                        <div style={{ display: 'grid', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6 }}>EMAIL</label>
                                <div style={{ ...s.input, display: 'flex', alignItems: 'center' }}>{inviteCredentials.email}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6 }}>PASSWORD SEMENTARA</label>
                                <div style={{ ...s.input, display: 'flex', alignItems: 'center', fontWeight: 800, letterSpacing: '.05em' }}>{inviteCredentials.temporary_password}</div>
                            </div>
                            <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7, padding: '10px 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgAlt }}>
                                Password ini hanya tampil sekali. Bagikan ke staff yang diundang lalu minta mereka menggantinya segera.
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => setInviteCredentials(null)} style={{
                                    height: 40, padding: '0 18px', borderRadius: 10, background: T.primary,
                                    color: '#fff', fontSize: 12, fontWeight: 700,
                                }}>
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
