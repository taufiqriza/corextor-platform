import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft, Building2, CheckCircle2, ChevronRight, Loader2, MapPin,
    Package, PencilLine, Plus, RefreshCcw, Search, Users, X,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { platformApi } from '@/api/platform.api';

/* ═══════════════════ Types ═══════════════════ */
interface Props { T: Theme; isDesktop: boolean; }

interface Company {
    id: number;
    name: string;
    code: string;
    status: 'active' | 'inactive' | 'suspended';
    created_at: string;
    updated_at: string;
    memberships_count?: number;
    subscriptions_count?: number;
}

interface Subscription {
    id: number;
    plan_id: number;
    product_id: number;
    status: string;
    starts_at: string;
    billing_cycle: string;
    product?: { name: string; code: string };
    plan?: { name: string; code: string; price: number };
}

interface Membership {
    id: number;
    user_id: number;
    role: string;
    status: string;
    user?: { id: number; name: string; email: string };
}

type ViewMode = 'list' | 'detail';
type DetailTab = 'overview' | 'members' | 'subscriptions';

/* ═══════════════════ Helpers ═══════════════════ */
function getErrorMsg(err: unknown): string {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return e?.response?.data?.message ?? e?.message ?? 'Terjadi kesalahan';
}

function formatDate(v?: string): string {
    if (!v) return '-';
    try {
        return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '-'; }
}

const currencyFmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

/* ═══════════════════ Component ═══════════════════ */
export function CompanyPanel({ T, isDesktop }: Props) {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    // Detail
    const [view, setView] = useState<ViewMode>('list');
    const [selected, setSelected] = useState<Company | null>(null);
    const [detailTab, setDetailTab] = useState<DetailTab>('overview');
    const [subs, setSubs] = useState<Subscription[]>([]);
    const [members, setMembers] = useState<Membership[]>([]);
    const [subsLoading, setSubsLoading] = useState(false);
    const [membersLoading, setMembersLoading] = useState(false);

    // Create modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createCode, setCreateCode] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Add Subscription modal
    const [showAddSubModal, setShowAddSubModal] = useState(false);
    const [plans, setPlans] = useState<{ id: number; name: string; code: string; price: number; billing_cycle: string; product?: { name: string; code: string } }[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [selectedPlanCode, setSelectedPlanCode] = useState('');
    const [addingSubscription, setAddingSubscription] = useState(false);
    const [addSubError, setAddSubError] = useState('');

    // Feedback
    const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);

    /* ── Load ── */
    const loadCompanies = async () => {
        setLoading(true);
        try {
            const res = await platformApi.getCompanies();
            setCompanies(res.data?.data?.data ?? []);
        } catch { setCompanies([]); }
        finally { setLoading(false); }
    };
    useEffect(() => { loadCompanies(); }, []);

    /* ── Filtered + Stats ── */
    const filtered = useMemo(() => {
        let list = companies;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(c => c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q));
        }
        if (statusFilter !== 'all') {
            list = list.filter(c => statusFilter === 'active' ? c.status === 'active' : c.status !== 'active');
        }
        return list;
    }, [companies, search, statusFilter]);

    const stats = useMemo(() => ({
        total: companies.length,
        active: companies.filter(c => c.status === 'active').length,
        inactive: companies.filter(c => c.status !== 'active').length,
        products: companies.reduce((n, c) => n + (c.subscriptions_count ?? 0), 0),
    }), [companies]);

    /* ── Detail ── */
    const openDetail = async (company: Company) => {
        setSelected(company);
        setView('detail');
        setDetailTab('overview');
        setSubs([]);
        setMembers([]);

        // Load subs
        setSubsLoading(true);
        try {
            const res = await platformApi.getCompanySubscriptions(company.id);
            setSubs(res.data?.data ?? []);
        } catch { setSubs([]); }
        finally { setSubsLoading(false); }

        // Load members
        setMembersLoading(true);
        try {
            const res = await platformApi.getCompanyMembers(company.id);
            setMembers(res.data?.data ?? []);
        } catch { setMembers([]); }
        finally { setMembersLoading(false); }
    };

    const closeDetail = () => { setView('list'); setSelected(null); };

    /* ── Create ── */
    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        if (!createName.trim() || !createCode.trim()) return;
        setCreating(true);
        setCreateError('');
        try {
            await platformApi.createCompany({ name: createName.trim(), code: createCode.trim().toUpperCase() });
            setShowCreateModal(false);
            setCreateName('');
            setCreateCode('');
            setFeedback({ kind: 'success', msg: 'Company berhasil dibuat!' });
            loadCompanies();
        } catch (err) {
            setCreateError(getErrorMsg(err));
        } finally { setCreating(false); }
    };

    /* ── Add Subscription ── */
    const openAddSubModal = async () => {
        setShowAddSubModal(true);
        setAddSubError('');
        setSelectedPlanCode('');
        if (plans.length === 0) {
            setPlansLoading(true);
            try {
                const res = await platformApi.getPlans();
                setPlans(res.data?.data ?? []);
            } catch { setPlans([]); }
            finally { setPlansLoading(false); }
        }
    };

    const handleAddSubscription = async () => {
        if (!selectedPlanCode || !selected) return;
        const plan = plans.find(p => p.code === selectedPlanCode);
        if (!plan) return;

        setAddingSubscription(true);
        setAddSubError('');
        try {
            await platformApi.addSubscription(selected.id, {
                product_code: plan.product?.code ?? 'attendance',
                plan_code: plan.code,
                starts_at: new Date().toISOString().split('T')[0],
            });
            setShowAddSubModal(false);
            setFeedback({ kind: 'success', msg: 'Subscription berhasil ditambahkan!' });
            // Reload subs
            const res = await platformApi.getCompanySubscriptions(selected.id);
            setSubs(res.data?.data ?? []);
        } catch (err) {
            setAddSubError(getErrorMsg(err));
        } finally { setAddingSubscription(false); }
    };

    /* ═══ Styles ═══ */
    const s = {
        statCard: {
            background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: '12px 14px',
        } as React.CSSProperties,
        statLabel: { fontSize: 11, color: T.textMuted } as React.CSSProperties,
        statValue: { fontSize: 22, fontWeight: 900, color: T.text, marginTop: 6, fontFamily: "'Sora', sans-serif" } as React.CSSProperties,
        section: {
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: isDesktop ? 16 : 12,
        } as React.CSSProperties,
        sectionIcon: {
            width: 30, height: 30, borderRadius: 10, background: `${T.primary}18`, color: T.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        } as React.CSSProperties,
        sectionTitle: {
            fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif",
        } as React.CSSProperties,
        sectionMeta: { marginTop: 4, fontSize: 12, color: T.textMuted } as React.CSSProperties,
        searchWrap: {
            flex: 1, minWidth: isDesktop ? 240 : '100%', display: 'flex', alignItems: 'center', gap: 8,
            height: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, padding: '0 10px',
        } as React.CSSProperties,
        searchInput: { flex: 1, color: T.text, fontSize: 13 } as React.CSSProperties,
        filterSelect: {
            height: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt,
            color: T.text, fontSize: 12, padding: '0 10px', minWidth: 110,
        } as React.CSSProperties,
        neutralBtn: {
            height: 40, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgAlt,
            color: T.textSub, padding: '0 10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        } as React.CSSProperties,
        primaryBtn: {
            height: 36, borderRadius: 10, border: 'none',
            background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`, color: '#fff',
            fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 14px',
        } as React.CSSProperties,
        pill: (active: boolean) => ({
            fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
            background: active ? `${T.success}16` : `${T.danger}12`,
            color: active ? T.success : T.danger,
        } as React.CSSProperties),
        // Table
        thCell: {
            textAlign: 'left' as const, padding: '11px 12px', fontSize: 11, letterSpacing: '.02em',
            textTransform: 'uppercase' as const, color: T.textMuted, borderBottom: `1px solid ${T.border}`,
        } as React.CSSProperties,
        tdCell: { padding: '12px 12px', borderBottom: `1px solid ${T.border}` } as React.CSSProperties,
        rowTitle: { fontSize: 13, fontWeight: 800, color: T.text } as React.CSSProperties,
        rowSub: { fontSize: 10, color: T.textMuted, marginTop: 3 } as React.CSSProperties,
        // Mobile card
        mCard: {
            borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgAlt, padding: 14,
        } as React.CSSProperties,
        // Modal
        overlay: {
            position: 'fixed' as const, inset: 0, zIndex: 140, background: 'rgba(2,10,7,.56)', backdropFilter: 'blur(4px)',
        } as React.CSSProperties,
        modalFrame: {
            position: 'fixed' as const, inset: 0, zIndex: 141, display: 'flex',
            alignItems: isDesktop ? 'center' : 'stretch', justifyContent: 'center',
            padding: isDesktop ? 16 : 0,
        } as React.CSSProperties,
        modalDialog: (maxW: number) => ({
            width: '100%', maxWidth: maxW, maxHeight: isDesktop ? '92vh' : '100vh',
            background: T.card, border: `1px solid ${T.border}`, borderRadius: isDesktop ? 18 : 0,
            boxShadow: T.shadow, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden',
        } as React.CSSProperties),
        modalHeader: {
            padding: isDesktop ? '14px 18px' : '12px 14px', borderBottom: `1px solid ${T.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
        } as React.CSSProperties,
        modalBody: { padding: isDesktop ? 18 : 14, overflowY: 'auto' as const, flex: 1, display: 'grid', gap: 14 } as React.CSSProperties,
        modalClose: {
            width: 32, height: 32, borderRadius: 9, border: `1px solid ${T.border}`, background: T.bgAlt,
            color: T.textSub, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        } as React.CSSProperties,
        // Detail tabs
        detailTab: (active: boolean) => ({
            display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: active ? 800 : 600,
            padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: active ? `${T.primary}14` : 'transparent', color: active ? T.primary : T.textMuted,
            transition: 'all .15s ease',
        } as React.CSSProperties),
    };

    /* ═══ DETAIL VIEW ═══ */
    if (view === 'detail' && selected) {
        const activeSubs = subs.filter(sub => sub.status === 'active').length;
        const adminCount = members.filter(m => m.role === 'company_admin').length;
        const employeeCount = members.filter(m => m.role === 'employee').length;

        return (
            <div style={{ display: 'grid', gap: 14 }}>
                {/* Back */}
                <button onClick={closeDetail} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.primary, fontSize: 12, fontWeight: 700, width: 'fit-content' }}>
                    <ArrowLeft size={14} /> Kembali ke Daftar
                </button>

                {/* Company Hero */}
                <div style={s.section}>
                    <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', gap: 16, flexDirection: isDesktop ? 'row' : 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 18, flexShrink: 0,
                                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: `0 8px 24px ${T.primaryGlow}`,
                            }}>
                                <Building2 size={26} color="#fff" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                    {selected.name}
                                </h2>
                                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 8, background: `${T.primary}14`, color: T.primary, border: `1px solid ${T.primary}30` }}>
                                        {selected.code}
                                    </span>
                                    <span style={s.pill(selected.status === 'active')}>
                                        {selected.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ ...s.neutralBtn, height: 34, fontSize: 11, fontWeight: 700, gap: 5, padding: '0 12px' }}>
                                <PencilLine size={12} /> Edit
                            </button>
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 10, marginTop: 16 }}>
                        {[
                            { label: 'ID', value: `#${selected.id}` },
                            { label: 'Dibuat', value: formatDate(selected.created_at) },
                            { label: 'Admin', value: String(adminCount) },
                            { label: 'Employee', value: String(employeeCount) },
                        ].map(item => (
                            <div key={item.label} style={{ background: T.bgAlt, borderRadius: 11, padding: '10px 12px', border: `1px solid ${T.border}` }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: .5 }}>{item.label}</div>
                                <div style={{ fontSize: 15, fontWeight: 900, color: T.text, marginTop: 3 }}>{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detail Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: T.card, padding: 5, borderRadius: 12, border: `1px solid ${T.border}` }}>
                    {[
                        { key: 'overview' as DetailTab, label: 'Overview', icon: Building2 },
                        { key: 'members' as DetailTab, label: `Members (${members.length})`, icon: Users },
                        { key: 'subscriptions' as DetailTab, label: `Subscriptions (${subs.length})`, icon: Package },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setDetailTab(tab.key)} style={s.detailTab(detailTab === tab.key)}>
                            <tab.icon size={13} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {detailTab === 'overview' && (
                    <div style={s.section}>
                        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr', gap: 12 }}>
                            <div style={{ ...s.statCard, borderLeft: `3px solid ${T.primary}` }}>
                                <div style={s.statLabel}>Active Subscriptions</div>
                                <div style={s.statValue}>{activeSubs}</div>
                            </div>
                            <div style={{ ...s.statCard, borderLeft: `3px solid ${T.info}` }}>
                                <div style={s.statLabel}>Total Members</div>
                                <div style={s.statValue}>{members.length}</div>
                            </div>
                            <div style={{ ...s.statCard, borderLeft: `3px solid ${T.gold}` }}>
                                <div style={s.statLabel}>Last Updated</div>
                                <div style={{ ...s.statValue, fontSize: 14 }}>{formatDate(selected.updated_at)}</div>
                            </div>
                        </div>
                    </div>
                )}

                {detailTab === 'members' && (
                    <div style={s.section}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={s.sectionIcon}><Users size={14} /></div>
                                <span style={s.sectionTitle}>Members</span>
                            </div>
                        </div>
                        {membersLoading ? (
                            <div style={{ padding: 28, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>
                                <Loader2 size={18} color={T.primary} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', display: 'block' }} />
                                Memuat members...
                            </div>
                        ) : members.length === 0 ? (
                            <div style={{ padding: 28, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>Belum ada member.</div>
                        ) : isDesktop ? (
                            <div style={{ border: `1px solid ${T.border}`, borderRadius: 14, overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 500 }}>
                                    <thead><tr style={{ background: T.bgAlt }}>
                                        {['Member', 'Email', 'Role', 'Status'].map(h => (
                                            <th key={h} style={s.thCell}>{h}</th>
                                        ))}
                                    </tr></thead>
                                    <tbody>
                                        {members.map(m => (
                                            <tr key={m.id} style={{ background: T.card }}>
                                                <td style={s.tdCell}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{
                                                            width: 32, height: 32, borderRadius: 10,
                                                            background: m.role === 'company_admin' ? `${T.gold}18` : `${T.info}14`,
                                                            color: m.role === 'company_admin' ? T.gold : T.info,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: 12, fontWeight: 900,
                                                        }}>
                                                            {(m.user?.name ?? 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span style={s.rowTitle}>{m.user?.name ?? `User #${m.user_id}`}</span>
                                                    </div>
                                                </td>
                                                <td style={{ ...s.tdCell, fontSize: 12, color: T.textSub }}>{m.user?.email ?? '-'}</td>
                                                <td style={s.tdCell}>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
                                                        background: m.role === 'company_admin' ? `${T.gold}16` : `${T.info}14`,
                                                        color: m.role === 'company_admin' ? T.gold : T.info,
                                                        border: `1px solid ${m.role === 'company_admin' ? `${T.gold}40` : `${T.info}35`}`,
                                                    }}>
                                                        {m.role === 'company_admin' ? 'Admin' : 'Employee'}
                                                    </span>
                                                </td>
                                                <td style={s.tdCell}><span style={s.pill(m.status === 'active')}>{m.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 8 }}>
                                {members.map(m => (
                                    <div key={m.id} style={s.mCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 34, height: 34, borderRadius: 10,
                                                    background: m.role === 'company_admin' ? `${T.gold}18` : `${T.info}14`,
                                                    color: m.role === 'company_admin' ? T.gold : T.info,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 13, fontWeight: 900,
                                                }}>
                                                    {(m.user?.name ?? 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{m.user?.name ?? `User #${m.user_id}`}</div>
                                                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{m.user?.email ?? '-'}</div>
                                                </div>
                                            </div>
                                            <span style={s.pill(m.status === 'active')}>{m.status}</span>
                                        </div>
                                        <div style={{ marginTop: 8 }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
                                                background: m.role === 'company_admin' ? `${T.gold}16` : `${T.info}14`,
                                                color: m.role === 'company_admin' ? T.gold : T.info,
                                            }}>
                                                {m.role === 'company_admin' ? 'Admin' : 'Employee'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {detailTab === 'subscriptions' && (
                    <div style={s.section}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ ...s.sectionIcon, background: `${T.success}16`, color: T.success }}><Package size={14} /></div>
                                <span style={s.sectionTitle}>Subscriptions</span>
                            </div>
                            <button onClick={openAddSubModal} style={s.primaryBtn}>
                                <Plus size={13} /> Tambah
                            </button>
                        </div>
                        {subsLoading ? (
                            <div style={{ padding: 28, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>
                                <Loader2 size={18} color={T.primary} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', display: 'block' }} />
                                Memuat subscriptions...
                            </div>
                        ) : subs.length === 0 ? (
                            <div style={{ padding: 28, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 14, background: `${T.success}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                                    <Package size={20} color={T.textMuted} />
                                </div>
                                Belum ada subscription. Klik "Tambah" untuk menambahkan.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 10 }}>
                                {subs.map(sub => (
                                    <div key={sub.id} style={{
                                        borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgAlt,
                                        padding: 14, display: 'flex', alignItems: 'center', gap: 12,
                                    }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                            background: sub.status === 'active' ? `${T.success}14` : `${T.danger}12`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {sub.status === 'active'
                                                ? <CheckCircle2 size={18} color={T.success} />
                                                : <Package size={18} color={T.danger} />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>
                                                {sub.plan?.name ?? sub.product?.name ?? `Plan #${sub.plan_id}`}
                                            </div>
                                            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                                                {sub.billing_cycle} • Start: {formatDate(sub.starts_at)}
                                                {sub.plan?.price != null && ` • ${currencyFmt.format(sub.plan.price)}`}
                                            </div>
                                        </div>
                                        <span style={s.pill(sub.status === 'active')}>{sub.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Add Subscription Modal ── */}
                        {showAddSubModal && (
                            <>
                                <div onClick={() => setShowAddSubModal(false)} style={s.overlay} />
                                <div style={s.modalFrame}>
                                    <div style={s.modalDialog(520)} onClick={e => e.stopPropagation()}>
                                        <div style={s.modalHeader}>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                                    Tambah Subscription
                                                </div>
                                                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>
                                                    Pilih plan untuk {selected?.name}
                                                </div>
                                            </div>
                                            <button onClick={() => setShowAddSubModal(false)} style={s.modalClose}><X size={14} /></button>
                                        </div>
                                        <div style={s.modalBody}>
                                            {addSubError && (
                                                <div style={{ padding: '10px 14px', borderRadius: 12, background: `${T.danger}12`, border: `1px solid ${T.danger}30`, color: T.danger, fontSize: 12, fontWeight: 600 }}>
                                                    {addSubError}
                                                </div>
                                            )}
                                            {plansLoading ? (
                                                <div style={{ padding: 20, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>
                                                    <Loader2 size={18} color={T.primary} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', display: 'block' }} />
                                                    Memuat plans...
                                                </div>
                                            ) : plans.length === 0 ? (
                                                <div style={{ padding: 20, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>
                                                    Tidak ada plan tersedia.
                                                </div>
                                            ) : (
                                                <div style={{ display: 'grid', gap: 8 }}>
                                                    {plans.map(plan => {
                                                        const isSelected = selectedPlanCode === plan.code;
                                                        return (
                                                            <button key={plan.id}
                                                                onClick={() => setSelectedPlanCode(plan.code)}
                                                                style={{
                                                                    padding: 14, borderRadius: 14, textAlign: 'left',
                                                                    background: isSelected ? `${T.primary}10` : T.bgAlt,
                                                                    border: `2px solid ${isSelected ? T.primary : T.border}`,
                                                                    cursor: 'pointer', transition: 'all .15s ease',
                                                                    display: 'flex', alignItems: 'center', gap: 12,
                                                                }}>
                                                                <div style={{
                                                                    width: 20, height: 20, borderRadius: '50%',
                                                                    border: `2px solid ${isSelected ? T.primary : T.border}`,
                                                                    background: isSelected ? T.primary : 'transparent',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    flexShrink: 0,
                                                                }}>
                                                                    {isSelected && <CheckCircle2 size={12} color="#fff" />}
                                                                </div>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{plan.name}</div>
                                                                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                                                                        {plan.product?.name ?? 'Attendance'} • {plan.billing_cycle}
                                                                    </div>
                                                                </div>
                                                                <div style={{ fontSize: 14, fontWeight: 900, color: T.primary }}>
                                                                    {currencyFmt.format(plan.price)}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                                                <button onClick={() => setShowAddSubModal(false)} style={{ height: 38, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textSub, fontSize: 12, fontWeight: 700, padding: '0 14px' }}>
                                                    Batal
                                                </button>
                                                <button onClick={handleAddSubscription} disabled={!selectedPlanCode || addingSubscription}
                                                    style={{ ...s.primaryBtn, height: 38, opacity: (!selectedPlanCode || addingSubscription) ? .5 : 1 }}>
                                                    {addingSubscription ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />}
                                                    {addingSubscription ? 'Menyimpan...' : 'Tambah Subscription'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    }

    /* ═══ LIST VIEW ═══ */
    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, minmax(0, 1fr))' : '1fr 1fr', gap: 10 }}>
                {[
                    { label: 'Total Company', value: stats.total, icon: Building2, tone: T.primary },
                    { label: 'Aktif', value: stats.active, icon: CheckCircle2, tone: T.success },
                    { label: 'Nonaktif', value: stats.inactive, icon: MapPin, tone: T.danger },
                    { label: 'Total Products', value: stats.products, icon: Package, tone: T.info },
                ].map(item => (
                    <div key={item.label} style={s.statCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={s.statLabel}>{item.label}</div>
                            <item.icon size={14} color={item.tone} />
                        </div>
                        <div style={s.statValue}>{item.value}</div>
                    </div>
                ))}
            </div>

            {/* Main section */}
            <section style={s.section}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 10, flexDirection: isDesktop ? 'row' : 'column' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={s.sectionIcon}><Building2 size={14} /></div>
                            <div style={s.sectionTitle}>Daftar Company</div>
                        </div>
                        <div style={s.sectionMeta}>{filtered.length} company • filter {statusFilter === 'all' ? 'Semua' : statusFilter}</div>
                    </div>
                    <button onClick={() => { setShowCreateModal(true); setCreateError(''); setCreateName(''); setCreateCode(''); }} style={s.primaryBtn}>
                        <Plus size={13} /> Tambah Company
                    </button>
                </div>

                {/* Search + Filter */}
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <div style={s.searchWrap}>
                        <Search size={14} color={T.textMuted} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau kode company..."
                            style={s.searchInput} />
                        {search && <button onClick={() => setSearch('')} style={{ color: T.textMuted }}><X size={12} /></button>}
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                        style={s.filterSelect}>
                        <option value="all">Semua</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                    </select>
                    <button onClick={loadCompanies} style={s.neutralBtn} title="Refresh"><RefreshCcw size={14} /></button>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Loader2 size={22} color={T.primary} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', display: 'block' }} />
                        <span style={{ fontSize: 12, color: T.textMuted }}>Memuat data company...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${T.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <Building2 size={22} color={T.textMuted} />
                        </div>
                        <p style={{ fontSize: 13, color: T.textMuted }}>{search ? 'Tidak ditemukan.' : 'Belum ada company.'}</p>
                    </div>
                ) : isDesktop ? (
                    /* Desktop table */
                    <div style={{ marginTop: 12, border: `1px solid ${T.border}`, borderRadius: 14, overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 700 }}>
                            <thead><tr style={{ background: T.bgAlt }}>
                                {['Company', 'Kode', 'Status', 'Dibuat', 'Aksi'].map(h => (
                                    <th key={h} style={s.thCell}>{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {filtered.map(c => (
                                    <tr key={c.id} style={{ background: T.card, cursor: 'pointer', transition: 'background .15s' }}
                                        onClick={() => openDetail(c)}
                                        onMouseEnter={e => (e.currentTarget.style.background = T.bgAlt)}
                                        onMouseLeave={e => (e.currentTarget.style.background = T.card)}>
                                        <td style={s.tdCell}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 11, background: `${T.primary}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Building2 size={16} color={T.primary} />
                                                </div>
                                                <span style={s.rowTitle}>{c.name}</span>
                                            </div>
                                        </td>
                                        <td style={s.tdCell}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: T.textSub, letterSpacing: 1 }}>{c.code}</span>
                                        </td>
                                        <td style={s.tdCell}><span style={s.pill(c.status === 'active')}>{c.status}</span></td>
                                        <td style={{ ...s.tdCell, fontSize: 11, color: T.textSub }}>{formatDate(c.created_at)}</td>
                                        <td style={s.tdCell}>
                                            <button onClick={e => { e.stopPropagation(); openDetail(c); }} style={{ ...s.neutralBtn, height: 30, width: 30, padding: 0 }}>
                                                <ChevronRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Mobile cards */
                    <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                        {filtered.map(c => (
                            <button key={c.id} onClick={() => openDetail(c)} style={{ ...s.mCard, textAlign: 'left', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${T.primary}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Building2 size={18} color={T.primary} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{c.name}</div>
                                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{c.code} • {formatDate(c.created_at)}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                        <span style={s.pill(c.status === 'active')}>{c.status}</span>
                                        <ChevronRight size={13} color={T.textMuted} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Create Modal ── */}
            {showCreateModal && (
                <>
                    <div onClick={() => setShowCreateModal(false)} style={s.overlay} />
                    <div style={s.modalFrame}>
                        <div style={s.modalDialog(480)} onClick={e => e.stopPropagation()}>
                            <div style={s.modalHeader}>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Tambah Company</div>
                                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>Buat tenant baru di platform.</div>
                                </div>
                                <button onClick={() => setShowCreateModal(false)} style={s.modalClose}><X size={14} /></button>
                            </div>
                            <form onSubmit={handleCreate} style={s.modalBody}>
                                {createError && (
                                    <div style={{ padding: '10px 14px', borderRadius: 12, background: `${T.danger}12`, border: `1px solid ${T.danger}30`, color: T.danger, fontSize: 12, fontWeight: 600 }}>
                                        {createError}
                                    </div>
                                )}
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 6 }}>Nama Company</label>
                                    <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="PT Contoh Sejahtera" required autoFocus
                                        style={{ width: '100%', height: 44, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, padding: '0 14px', fontSize: 13, color: T.text, boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 6 }}>Kode (Unique)</label>
                                    <input value={createCode} onChange={e => setCreateCode(e.target.value.toUpperCase())} placeholder="CONTOH" required
                                        style={{ width: '100%', height: 44, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, padding: '0 14px', fontSize: 13, color: T.text, textTransform: 'uppercase', letterSpacing: 2, boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                                    <button type="button" onClick={() => setShowCreateModal(false)} style={{ height: 38, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textSub, fontSize: 12, fontWeight: 700, padding: '0 14px' }}>
                                        Batal
                                    </button>
                                    <button type="submit" disabled={creating} style={{ ...s.primaryBtn, height: 38, opacity: creating ? .6 : 1 }}>
                                        {creating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />}
                                        {creating ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}

            {/* Feedback toast */}
            {feedback && (
                <>
                    <div onClick={() => setFeedback(null)} style={{ ...s.overlay, background: 'rgba(2,10,7,.3)' }} />
                    <div style={{ ...s.modalFrame, zIndex: 145 }}>
                        <div style={{ ...s.modalDialog(400), padding: 18 }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 14,
                                    background: feedback.kind === 'success' ? `${T.success}16` : `${T.danger}12`,
                                    color: feedback.kind === 'success' ? T.success : T.danger,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: `1px solid ${feedback.kind === 'success' ? `${T.success}40` : `${T.danger}40`}`,
                                }}>
                                    {feedback.kind === 'success' ? <CheckCircle2 size={20} /> : <X size={20} />}
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 900, color: T.text }}>{feedback.kind === 'success' ? 'Berhasil' : 'Error'}</div>
                                    <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>{feedback.msg}</div>
                                </div>
                            </div>
                            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => setFeedback(null)} style={{ ...s.primaryBtn, height: 34 }}>OK</button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
