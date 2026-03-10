import { useEffect, useState } from 'react';
import { Building2, Plus, Loader2, ArrowLeft, Package, ChevronRight, Search, X } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { platformApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

type ViewMode = 'list' | 'detail' | 'create';

export function CompanyPanel({ T, isDesktop }: Props) {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<ViewMode>('list');
    const [selectedCompany, setSelectedCompany] = useState<any>(null);
    const [subs, setSubs] = useState<any[]>([]);
    const [subsLoading, setSubsLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Create form
    const [createName, setCreateName] = useState('');
    const [createCode, setCreateCode] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    const load = () => {
        setLoading(true);
        platformApi.getCompanies().then(res => {
            setCompanies(res.data?.data?.data ?? []);
        }).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const viewDetail = async (company: any) => {
        setSelectedCompany(company);
        setView('detail');
        setSubsLoading(true);
        try {
            const res = await platformApi.getCompanySubscriptions(company.id);
            setSubs(res.data?.data ?? []);
        } catch { setSubs([]); }
        finally { setSubsLoading(false); }
    };

    const handleCreate = async () => {
        if (!createName.trim() || !createCode.trim()) return;
        setCreating(true);
        setCreateError('');
        try {
            await platformApi.createCompany({ name: createName.trim(), code: createCode.trim().toUpperCase() });
            setCreateName(''); setCreateCode(''); setView('list');
            load();
        } catch (err: any) {
            setCreateError(err?.response?.data?.message || 'Gagal membuat company');
        } finally { setCreating(false); }
    };

    const filtered = companies.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.code?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <LoadingState T={T} />;

    // Create view
    if (view === 'create') return (
        <div>
            <button onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.primary, fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
                <ArrowLeft size={14} /> Kembali
            </button>
            <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: isDesktop ? 28 : 20, maxWidth: 480 }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text, marginBottom: 4 }}>Tambah Company</h3>
                <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Buat tenant baru di platform.</p>

                {createError && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: `${T.danger}12`, border: `1px solid ${T.danger}30`, color: T.danger, fontSize: 12, fontWeight: 600 }}>
                        {createError}
                    </div>
                )}

                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 6 }}>Nama Company</label>
                <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="PT Contoh Sejahtera" style={{
                    width: '100%', height: 44, borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface,
                    padding: '0 14px', fontSize: 13, color: T.text, marginBottom: 16,
                }} />

                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 6 }}>Kode (Unique)</label>
                <input value={createCode} onChange={e => setCreateCode(e.target.value.toUpperCase())} placeholder="CONTOH" style={{
                    width: '100%', height: 44, borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface,
                    padding: '0 14px', fontSize: 13, color: T.text, marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1.5,
                }} />

                <button onClick={handleCreate} disabled={creating} style={{
                    width: '100%', height: 46, borderRadius: 12,
                    background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                    color: '#fff', fontSize: 13, fontWeight: 800, opacity: creating ? .6 : 1,
                }}>
                    {creating ? 'Menyimpan...' : 'Simpan Company'}
                </button>
            </div>
        </div>
    );

    // Detail view
    if (view === 'detail' && selectedCompany) return (
        <div>
            <button onClick={() => { setView('list'); setSelectedCompany(null); }} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.primary, fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
                <ArrowLeft size={14} /> Kembali
            </button>

            <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: isDesktop ? 24 : 18, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={24} color="#fff" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: T.text }}>{selectedCompany.name}</h3>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${T.primary}15`, color: T.primary }}>{selectedCompany.code}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: selectedCompany.status === 'active' ? `${T.success}15` : `${T.danger}15`, color: selectedCompany.status === 'active' ? T.success : T.danger }}>{selectedCompany.status}</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    <InfoCard T={T} label="ID" value={`#${selectedCompany.id}`} />
                    <InfoCard T={T} label="Created" value={selectedCompany.created_at?.split('T')[0] ?? '-'} />
                </div>
            </div>

            <h4 style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 12 }}>Subscriptions</h4>
            {subsLoading ? <LoadingState T={T} /> : subs.length === 0 ? (
                <EmptyState T={T} message="Belum ada subscription aktif." />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {subs.map((sub: any) => (
                        <div key={sub.id} style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.success}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Package size={16} color={T.success} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Plan #{sub.plan_id}</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>Start: {sub.starts_at ?? sub.start_date ?? '-'}</div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: sub.status === 'active' ? `${T.success}15` : `${T.danger}15`, color: sub.status === 'active' ? T.success : T.danger }}>{sub.status}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // List view
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 180 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 280,
                        background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '0 12px', height: 38,
                    }}>
                        <Search size={14} color={T.textMuted} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari company..."
                            style={{ flex: 1, height: '100%', fontSize: 12, color: T.text }} />
                        {search && <button onClick={() => setSearch('')} style={{ color: T.textMuted }}><X size={12} /></button>}
                    </div>
                    <span style={{ fontSize: 11, color: T.textMuted, whiteSpace: 'nowrap' }}>{filtered.length} results</span>
                </div>
                <button onClick={() => setView('create')} style={{
                    height: 36, padding: '0 14px', borderRadius: 10,
                    background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                    color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <Plus size={14} /> Tambah
                </button>
            </div>

            {filtered.length === 0 ? (
                <EmptyState T={T} message={search ? 'Tidak ditemukan.' : 'Belum ada company.'} />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr', gap: 12 }}>
                    {filtered.map((c: any) => (
                        <button key={c.id} onClick={() => viewDetail(c)} style={{
                            background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 18, textAlign: 'left',
                            transition: 'all .15s ease', cursor: 'pointer',
                        }} onMouseEnter={e => e.currentTarget.style.borderColor = `${T.primary}50`} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${T.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Building2 size={18} color={T.primary} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{c.name}</div>
                                    <div style={{ fontSize: 11, color: T.textMuted }}>{c.code}</div>
                                </div>
                                <ChevronRight size={14} color={T.textMuted} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                    background: c.status === 'active' ? `${T.success}15` : `${T.danger}15`,
                                    color: c.status === 'active' ? T.success : T.danger,
                                }}>{c.status}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function LoadingState({ T }: { T: Theme }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 12 }}>
            <Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, color: T.textMuted }}>Memuat data...</span>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function EmptyState({ T, message }: { T: Theme; message: string }) {
    return (
        <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 40, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${T.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Building2 size={22} color={T.textMuted} />
            </div>
            <p style={{ fontSize: 13, color: T.textMuted }}>{message}</p>
        </div>
    );
}

function InfoCard({ T, label, value }: { T: Theme; label: string; value: string }) {
    return (
        <div style={{ background: T.surface, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: .5 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginTop: 2 }}>{value}</div>
        </div>
    );
}
