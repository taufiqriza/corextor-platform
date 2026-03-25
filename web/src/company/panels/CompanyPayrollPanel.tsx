import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import {
    Banknote,
    CalendarClock,
    CircleDollarSign,
    ClipboardCheck,
    Coins,
    Landmark,
    Loader2,
    NotebookTabs,
    Plus,
    ReceiptText,
    RefreshCcw,
    Settings2,
    Sparkles,
    UserCircle2,
    Wallet,
    X,
} from 'lucide-react';
import { payrollApi } from '@/api/platform.api';
import type {
    PayrollComponent,
    PayrollDashboardPayload,
    PayrollDirectoryMember,
    PayrollProfile,
    PayrollRunDetail,
    PayrollRunListPayload,
    PayrollSchedule,
} from '@/types/payroll.types';
import type { Theme } from '@/theme/tokens';

interface Props {
    T: Theme;
    isDesktop: boolean;
    companyContextId?: number;
}

type ViewTab = 'overview' | 'profiles' | 'components' | 'schedules' | 'runs';

type ProfileComponentDraft = {
    payroll_component_id: number;
    label: string;
    type: 'earning' | 'deduction';
    enabled: boolean;
    amount: string;
};

const PER_PAGE = 15;

function getErrorMsg(error: unknown): string {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return err?.response?.data?.message ?? err?.message ?? 'Terjadi kesalahan';
}

function formatCurrency(value?: number | null): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value ?? 0);
}

function formatDate(value?: string | null): string {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return value;
    }
}

function statusTone(T: Theme, status?: string) {
    if (status === 'active' || status === 'finalized') {
        return { background: `${T.success}14`, color: T.success };
    }
    if (status === 'draft') {
        return { background: `${T.info}14`, color: T.info };
    }
    if (status === 'paid') {
        return { background: `${T.primary}14`, color: T.primary };
    }
    return { background: `${T.textMuted}16`, color: T.textMuted };
}

function createProfileComponentDrafts(
    components: PayrollComponent[],
    profile?: PayrollProfile | null,
): ProfileComponentDraft[] {
    return components
        .filter(component => component.status === 'active')
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
        .map(component => {
            const existing = profile?.components.find(item => item.component?.id === component.id);
            return {
                payroll_component_id: component.id,
                label: component.name,
                type: component.type,
                enabled: Boolean(existing),
                amount: String(existing?.amount ?? component.default_amount ?? 0),
            };
        });
}

export function CompanyPayrollPanel({ T, isDesktop, companyContextId }: Props) {
    const [tab, setTab] = useState<ViewTab>('overview');
    const [loadingBase, setLoadingBase] = useState(true);
    const [loadingRuns, setLoadingRuns] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

    const [dashboard, setDashboard] = useState<PayrollDashboardPayload | null>(null);
    const [directory, setDirectory] = useState<PayrollDirectoryMember[]>([]);
    const [schedules, setSchedules] = useState<PayrollSchedule[]>([]);
    const [components, setComponents] = useState<PayrollComponent[]>([]);
    const [profiles, setProfiles] = useState<PayrollProfile[]>([]);
    const [runsPayload, setRunsPayload] = useState<PayrollRunListPayload | null>(null);
    const [runPage, setRunPage] = useState(1);
    const [runStatus, setRunStatus] = useState<'all' | 'draft' | 'finalized' | 'paid' | 'cancelled'>('all');

    const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<PayrollSchedule | null>(null);
    const [scheduleName, setScheduleName] = useState('');
    const [scheduleCutoffDay, setScheduleCutoffDay] = useState('');
    const [schedulePayoutDay, setSchedulePayoutDay] = useState('');
    const [scheduleStatus, setScheduleStatus] = useState<'active' | 'inactive'>('active');
    const [scheduleSaving, setScheduleSaving] = useState(false);

    const [componentFormOpen, setComponentFormOpen] = useState(false);
    const [editingComponent, setEditingComponent] = useState<PayrollComponent | null>(null);
    const [componentName, setComponentName] = useState('');
    const [componentType, setComponentType] = useState<'earning' | 'deduction'>('earning');
    const [componentAmountType, setComponentAmountType] = useState<'fixed' | 'manual'>('fixed');
    const [componentDefaultAmount, setComponentDefaultAmount] = useState('');
    const [componentRecurring, setComponentRecurring] = useState(true);
    const [componentTaxable, setComponentTaxable] = useState(false);
    const [componentSortOrder, setComponentSortOrder] = useState('0');
    const [componentStatus, setComponentStatus] = useState<'active' | 'inactive'>('active');
    const [componentSaving, setComponentSaving] = useState(false);

    const [profileFormOpen, setProfileFormOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<PayrollProfile | null>(null);
    const [profileUserId, setProfileUserId] = useState('');
    const [profileScheduleId, setProfileScheduleId] = useState('');
    const [profileEmploymentType, setProfileEmploymentType] = useState<'monthly' | 'daily' | 'contract'>('monthly');
    const [profileBaseSalary, setProfileBaseSalary] = useState('');
    const [profileBankName, setProfileBankName] = useState('');
    const [profileBankAccountName, setProfileBankAccountName] = useState('');
    const [profileBankAccountNumber, setProfileBankAccountNumber] = useState('');
    const [profileNotes, setProfileNotes] = useState('');
    const [profileStatus, setProfileStatus] = useState<'active' | 'inactive'>('active');
    const [profileComponents, setProfileComponents] = useState<ProfileComponentDraft[]>([]);
    const [profileSaving, setProfileSaving] = useState(false);

    const [runFormOpen, setRunFormOpen] = useState(false);
    const [runScheduleId, setRunScheduleId] = useState('');
    const [runPeriodStart, setRunPeriodStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [runPeriodEnd, setRunPeriodEnd] = useState(new Date().toISOString().split('T')[0]);
    const [runPayoutDate, setRunPayoutDate] = useState('');
    const [runSaving, setRunSaving] = useState(false);

    const [runDetailId, setRunDetailId] = useState<number | null>(null);
    const [runDetailLoading, setRunDetailLoading] = useState(false);
    const [runDetail, setRunDetail] = useState<PayrollRunDetail | null>(null);
    const [runFinalizing, setRunFinalizing] = useState(false);

    const resetScheduleForm = () => {
        setEditingSchedule(null);
        setScheduleName('');
        setScheduleCutoffDay('');
        setSchedulePayoutDay('');
        setScheduleStatus('active');
        setScheduleFormOpen(false);
    };

    const resetComponentForm = () => {
        setEditingComponent(null);
        setComponentName('');
        setComponentType('earning');
        setComponentAmountType('fixed');
        setComponentDefaultAmount('');
        setComponentRecurring(true);
        setComponentTaxable(false);
        setComponentSortOrder('0');
        setComponentStatus('active');
        setComponentFormOpen(false);
    };

    const resetProfileForm = () => {
        setEditingProfile(null);
        setProfileUserId('');
        setProfileScheduleId('');
        setProfileEmploymentType('monthly');
        setProfileBaseSalary('');
        setProfileBankName('');
        setProfileBankAccountName('');
        setProfileBankAccountNumber('');
        setProfileNotes('');
        setProfileStatus('active');
        setProfileComponents(createProfileComponentDrafts(components));
        setProfileFormOpen(false);
    };

    const resetRunForm = () => {
        setRunScheduleId('');
        setRunPeriodStart(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
        setRunPeriodEnd(new Date().toISOString().split('T')[0]);
        setRunPayoutDate('');
        setRunFormOpen(false);
    };

    const loadBase = async (silent = false) => {
        if (silent) setRefreshing(true);
        else setLoadingBase(true);

        try {
            const [dashboardRes, directoryRes, schedulesRes, componentsRes, profilesRes] = await Promise.all([
                payrollApi.getDashboard(companyContextId),
                payrollApi.getDirectory(companyContextId),
                payrollApi.getSchedules(companyContextId),
                payrollApi.getComponents(companyContextId),
                payrollApi.getProfiles(companyContextId),
            ]);

            setDashboard(dashboardRes.data?.data ?? null);
            setDirectory(directoryRes.data?.data ?? []);
            setSchedules(schedulesRes.data?.data ?? []);
            const nextComponents = componentsRes.data?.data ?? [];
            setComponents(nextComponents);
            const nextProfiles = profilesRes.data?.data ?? [];
            setProfiles(nextProfiles);

            if (!profileFormOpen) {
                setProfileComponents(createProfileComponentDrafts(nextComponents));
            }
        } catch (error) {
            setMessage({ kind: 'error', text: getErrorMsg(error) });
        } finally {
            setLoadingBase(false);
            setRefreshing(false);
        }
    };

    const loadRuns = async () => {
        setLoadingRuns(true);
        try {
            const response = await payrollApi.getRuns({
                status: runStatus === 'all' ? undefined : runStatus,
                page: runPage,
                per_page: PER_PAGE,
            }, companyContextId);
            setRunsPayload(response.data?.data ?? null);
        } catch (error) {
            setMessage({ kind: 'error', text: getErrorMsg(error) });
            setRunsPayload(null);
        } finally {
            setLoadingRuns(false);
        }
    };

    useEffect(() => { void loadBase(); }, [companyContextId]);
    useEffect(() => { void loadRuns(); }, [companyContextId, runPage, runStatus]);

    const activeDirectory = useMemo(
        () => directory.filter(item => !item.has_payroll_profile || String(item.platform_user_id) === profileUserId),
        [directory, profileUserId],
    );

    const latestRun = dashboard?.latest_run;
    const stats = dashboard?.stats ?? {
        schedules: 0,
        active_schedules: 0,
        components: 0,
        profiles: 0,
        active_profiles: 0,
        runs: 0,
        draft_runs: 0,
    };
    const runPagination = runsPayload?.pagination ?? { current_page: 1, per_page: PER_PAGE, last_page: 1, total: 0, data: [] };

    const styles = {
        hero: {
            borderRadius: 24,
            background: 'linear-gradient(135deg, #0F3F73 0%, #0C2C50 58%, #081A31 100%)',
            padding: isDesktop ? 22 : 16,
            color: '#fff',
            boxShadow: '0 18px 40px rgba(9,31,59,.22)',
            overflow: 'hidden',
            position: 'relative' as const,
        },
        heroMeta: {
            display: 'flex',
            alignItems: isDesktop ? 'center' : 'flex-start',
            justifyContent: 'space-between',
            gap: 14,
            flexDirection: isDesktop ? 'row' : 'column',
        } as CSSProperties,
        statCard: {
            borderRadius: 18,
            border: `1px solid ${T.border}`,
            background: T.card,
            padding: isDesktop ? '14px 15px' : '12px 13px',
        } as CSSProperties,
        card: {
            borderRadius: 20,
            border: `1px solid ${T.border}`,
            background: T.card,
            padding: isDesktop ? 18 : 14,
            boxShadow: T.shadowSm,
        } as CSSProperties,
        softCard: {
            borderRadius: 16,
            border: `1px solid ${T.border}`,
            background: T.bgAlt,
            padding: 14,
        } as CSSProperties,
        tab: (active: boolean) => ({
            height: 38,
            padding: '0 14px',
            borderRadius: 11,
            border: 'none',
            background: active ? `${T.primary}14` : 'transparent',
            color: active ? T.primary : T.textMuted,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 12,
            fontWeight: active ? 800 : 700,
        } as CSSProperties),
        input: {
            width: '100%',
            height: 42,
            borderRadius: 12,
            border: `1px solid ${T.border}`,
            background: T.bgAlt,
            color: T.text,
            fontSize: 13,
            padding: '0 12px',
            boxSizing: 'border-box' as const,
        } as CSSProperties,
        textarea: {
            width: '100%',
            minHeight: 88,
            borderRadius: 12,
            border: `1px solid ${T.border}`,
            background: T.bgAlt,
            color: T.text,
            fontSize: 13,
            padding: '12px',
            boxSizing: 'border-box' as const,
            resize: 'vertical' as const,
        } as CSSProperties,
        button: {
            height: 40,
            padding: '0 14px',
            borderRadius: 12,
            border: 'none',
            background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            fontWeight: 800,
            width: 'fit-content',
        } as CSSProperties,
        subtleButton: {
            height: 38,
            padding: '0 12px',
            borderRadius: 11,
            border: `1px solid ${T.border}`,
            background: T.bgAlt,
            color: T.textSub,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 12,
            fontWeight: 700,
        } as CSSProperties,
        overlay: {
            position: 'fixed' as const,
            inset: 0,
            background: 'rgba(6,18,38,.48)',
            backdropFilter: 'blur(5px)',
            zIndex: 140,
        } as CSSProperties,
        dialogFrame: {
            position: 'fixed' as const,
            inset: 0,
            display: 'flex',
            alignItems: isDesktop ? 'center' : 'stretch',
            justifyContent: 'center',
            zIndex: 141,
            padding: isDesktop ? 18 : 0,
        } as CSSProperties,
        dialog: {
            width: '100%',
            maxWidth: 840,
            maxHeight: isDesktop ? '90vh' : '100vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column' as const,
            borderRadius: isDesktop ? 24 : 0,
            background: T.card,
            border: `1px solid ${T.border}`,
            boxShadow: T.shadow,
        } as CSSProperties,
        dialogHeader: {
            padding: isDesktop ? '16px 18px' : '14px 14px 12px',
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
        } as CSSProperties,
        dialogBody: {
            padding: isDesktop ? 18 : 14,
            overflowY: 'auto' as const,
            display: 'grid',
            gap: 16,
        } as CSSProperties,
        closeBtn: {
            width: 34,
            height: 34,
            borderRadius: 11,
            border: `1px solid ${T.border}`,
            background: T.bgAlt,
            color: T.textMuted,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
        } as CSSProperties,
    };

    const openScheduleModal = (schedule?: PayrollSchedule) => {
        setEditingSchedule(schedule ?? null);
        setScheduleName(schedule?.name ?? '');
        setScheduleCutoffDay(schedule?.cutoff_day ? String(schedule.cutoff_day) : '');
        setSchedulePayoutDay(schedule?.payout_day ? String(schedule.payout_day) : '');
        setScheduleStatus(schedule?.status ?? 'active');
        setScheduleFormOpen(true);
    };

    const openComponentModal = (component?: PayrollComponent) => {
        setEditingComponent(component ?? null);
        setComponentName(component?.name ?? '');
        setComponentType(component?.type ?? 'earning');
        setComponentAmountType(component?.amount_type ?? 'fixed');
        setComponentDefaultAmount(component ? String(component.default_amount) : '');
        setComponentRecurring(component?.is_recurring ?? true);
        setComponentTaxable(component?.taxable ?? false);
        setComponentSortOrder(component ? String(component.sort_order) : '0');
        setComponentStatus(component?.status ?? 'active');
        setComponentFormOpen(true);
    };

    const openProfileModal = (profile?: PayrollProfile) => {
        setEditingProfile(profile ?? null);
        setProfileUserId(profile ? String(profile.platform_user_id) : '');
        setProfileScheduleId(profile?.schedule?.id ? String(profile.schedule.id) : '');
        setProfileEmploymentType(profile?.employment_type ?? 'monthly');
        setProfileBaseSalary(profile ? String(profile.base_salary) : '');
        setProfileBankName(profile?.bank_name ?? '');
        setProfileBankAccountName(profile?.bank_account_name ?? '');
        setProfileBankAccountNumber(profile?.bank_account_number ?? '');
        setProfileNotes(profile?.notes ?? '');
        setProfileStatus(profile?.status ?? 'active');
        setProfileComponents(createProfileComponentDrafts(components, profile));
        setProfileFormOpen(true);
    };

    const openRunDetail = async (runId: number) => {
        setRunDetailId(runId);
        setRunDetailLoading(true);
        setRunDetail(null);
        try {
            const response = await payrollApi.getRun(runId, companyContextId);
            setRunDetail(response.data?.data ?? null);
        } catch (error) {
            setMessage({ kind: 'error', text: getErrorMsg(error) });
        } finally {
            setRunDetailLoading(false);
        }
    };

    const handleScheduleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setScheduleSaving(true);
        try {
            const payload = {
                name: scheduleName,
                cutoff_day: scheduleCutoffDay ? Number(scheduleCutoffDay) : null,
                payout_day: schedulePayoutDay ? Number(schedulePayoutDay) : null,
                status: scheduleStatus,
            };

            if (editingSchedule) {
                await payrollApi.updateSchedule(editingSchedule.id, payload, companyContextId);
            } else {
                await payrollApi.createSchedule(payload, companyContextId);
            }

            setMessage({ kind: 'success', text: `Jadwal payroll ${editingSchedule ? 'diperbarui' : 'dibuat'}.` });
            resetScheduleForm();
            await loadBase(true);
        } catch (error) {
            setMessage({ kind: 'error', text: getErrorMsg(error) });
        } finally {
            setScheduleSaving(false);
        }
    };

    const handleComponentSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setComponentSaving(true);
        try {
            const payload = {
                name: componentName,
                type: componentType,
                amount_type: componentAmountType,
                default_amount: componentDefaultAmount ? Number(componentDefaultAmount) : 0,
                is_recurring: componentRecurring,
                taxable: componentTaxable,
                sort_order: Number(componentSortOrder || 0),
                status: componentStatus,
            };

            if (editingComponent) {
                await payrollApi.updateComponent(editingComponent.id, payload, companyContextId);
            } else {
                await payrollApi.createComponent(payload, companyContextId);
            }

            setMessage({ kind: 'success', text: `Komponen payroll ${editingComponent ? 'diperbarui' : 'ditambahkan'}.` });
            resetComponentForm();
            await loadBase(true);
        } catch (error) {
            setMessage({ kind: 'error', text: getErrorMsg(error) });
        } finally {
            setComponentSaving(false);
        }
    };

    const handleProfileSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setProfileSaving(true);
        try {
            const payload = {
                platform_user_id: Number(profileUserId),
                pay_schedule_id: profileScheduleId ? Number(profileScheduleId) : null,
                employment_type: profileEmploymentType,
                base_salary: Number(profileBaseSalary || 0),
                bank_name: profileBankName || null,
                bank_account_name: profileBankAccountName || null,
                bank_account_number: profileBankAccountNumber || null,
                notes: profileNotes || null,
                status: profileStatus,
                components: profileComponents
                    .filter(item => item.enabled)
                    .map(item => ({
                        payroll_component_id: item.payroll_component_id,
                        amount: Number(item.amount || 0),
                        status: 'active' as const,
                    })),
            };

            if (editingProfile) {
                await payrollApi.updateProfile(editingProfile.id, payload, companyContextId);
            } else {
                await payrollApi.createProfile(payload, companyContextId);
            }

            setMessage({ kind: 'success', text: `Payroll profile ${editingProfile ? 'diperbarui' : 'dibuat'}.` });
            resetProfileForm();
            await loadBase(true);
            if (tab !== 'profiles') setTab('profiles');
        } catch (error) {
            setMessage({ kind: 'error', text: getErrorMsg(error) });
        } finally {
            setProfileSaving(false);
        }
    };

    const handleRunSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setRunSaving(true);
        try {
            await payrollApi.createRun({
                pay_schedule_id: runScheduleId ? Number(runScheduleId) : null,
                period_start: runPeriodStart,
                period_end: runPeriodEnd,
                payout_date: runPayoutDate || null,
            }, companyContextId);

            setMessage({ kind: 'success', text: 'Payroll run draft berhasil dibuat.' });
            resetRunForm();
            await Promise.all([loadRuns(), loadBase(true)]);
            setTab('runs');
        } catch (error) {
            setMessage({ kind: 'error', text: getErrorMsg(error) });
        } finally {
            setRunSaving(false);
        }
    };

    const handleFinalizeRun = async () => {
        if (!runDetailId) return;
        setRunFinalizing(true);
        try {
            await payrollApi.finalizeRun(runDetailId, companyContextId);
            setMessage({ kind: 'success', text: 'Payroll run berhasil difinalisasi.' });
            await Promise.all([openRunDetail(runDetailId), loadRuns(), loadBase(true)]);
        } catch (error) {
            setMessage({ kind: 'error', text: getErrorMsg(error) });
        } finally {
            setRunFinalizing(false);
        }
    };

    const tabs = [
        { key: 'overview' as ViewTab, label: 'Overview', icon: Sparkles },
        { key: 'profiles' as ViewTab, label: 'Profiles', icon: UserCircle2 },
        { key: 'components' as ViewTab, label: 'Komponen', icon: Coins },
        { key: 'schedules' as ViewTab, label: 'Jadwal', icon: CalendarClock },
        { key: 'runs' as ViewTab, label: 'Payroll Run', icon: ReceiptText },
    ];

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            <section style={styles.hero}>
                <div aria-hidden style={{
                    position: 'absolute',
                    inset: 'auto -60px -80px auto',
                    width: 240,
                    height: 240,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,.16), transparent 70%)',
                }} />

                <div style={styles.heroMeta}>
                    <div style={{ display: 'grid', gap: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.12)', borderRadius: 999, padding: '7px 12px', width: 'fit-content' }}>
                            <Wallet size={14} />
                            <span style={{ fontSize: 11, fontWeight: 800 }}>Payroll Workspace</span>
                        </div>
                        <div>
                            <div style={{ fontSize: isDesktop ? 28 : 22, fontWeight: 900, fontFamily: "'Sora', sans-serif", lineHeight: 1.05 }}>
                                Compensation, payroll run, dan snapshot attendance
                            </div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.76)', marginTop: 7, maxWidth: 720, lineHeight: 1.6 }}>
                                Payroll dibangun sebagai produk terpisah. Setup gaji tetap, allowance/deduction, lalu generate payroll run dengan snapshot attendance yang immutable.
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => void loadBase(true)} style={{ ...styles.subtleButton, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)', color: '#fff' }}>
                            {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                            Refresh
                        </button>
                        <button type="button" onClick={() => setRunFormOpen(true)} style={styles.button}>
                            <Plus size={14} />
                            Buat Payroll Run
                        </button>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isDesktop ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
                    gap: 10,
                    marginTop: 16,
                }}>
                    {[
                        { label: 'Payroll Profiles', value: stats.active_profiles, icon: UserCircle2 },
                        { label: 'Komponen Aktif', value: components.filter(component => component.status === 'active').length, icon: Coins },
                        { label: 'Jadwal Aktif', value: stats.active_schedules, icon: CalendarClock },
                        { label: 'Draft Runs', value: stats.draft_runs, icon: ReceiptText },
                    ].map(item => (
                        <div key={item.label} style={{ borderRadius: 18, background: 'rgba(255,255,255,.10)', padding: '12px 13px', border: '1px solid rgba(255,255,255,.14)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.72)' }}>{item.label}</span>
                                <item.icon size={14} />
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 10, fontFamily: "'Sora', sans-serif" }}>{item.value}</div>
                        </div>
                    ))}
                </div>
            </section>

            {message && (
                <div style={{
                    ...styles.card,
                    padding: '12px 14px',
                    borderColor: message.kind === 'success' ? `${T.success}40` : `${T.danger}40`,
                    background: message.kind === 'success' ? `${T.success}10` : `${T.danger}10`,
                    color: message.kind === 'success' ? T.success : T.danger,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{message.text}</div>
                    <button type="button" onClick={() => setMessage(null)} style={{ color: 'inherit' }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            <section style={styles.card}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: T.bgAlt, padding: 6, borderRadius: 14, border: `1px solid ${T.border}` }}>
                    {tabs.map(item => (
                        <button key={item.key} type="button" onClick={() => setTab(item.key)} style={styles.tab(tab === item.key)}>
                            <item.icon size={14} />
                            {item.label}
                        </button>
                    ))}
                </div>
            </section>

            {loadingBase ? (
                <section style={{ ...styles.card, display: 'grid', placeItems: 'center', minHeight: 260 }}>
                    <Loader2 size={22} className="animate-spin" color={T.primary} />
                </section>
            ) : (
                <>
                    {tab === 'overview' && (
                        <div style={{ display: 'grid', gap: 14 }}>
                            <section style={styles.card}>
                                <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 14, flexDirection: isDesktop ? 'row' : 'column' }}>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Payroll Control Center</div>
                                        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
                                            Attendance integration: {dashboard?.integrations.attendance ? 'aktif' : 'belum aktif'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <button type="button" onClick={() => setTab('profiles')} style={styles.subtleButton}>
                                            <UserCircle2 size={14} />
                                            Payroll Profiles
                                        </button>
                                        <button type="button" onClick={() => setTab('components')} style={styles.subtleButton}>
                                            <Settings2 size={14} />
                                            Komponen
                                        </button>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isDesktop ? '1.3fr .7fr' : '1fr',
                                    gap: 14,
                                    marginTop: 16,
                                }}>
                                    <div style={styles.softCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Run Terakhir</div>
                                                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>
                                                    Snapshot payroll terakhir yang tersimpan di database payroll.
                                                </div>
                                            </div>
                                            <div style={{
                                                ...statusTone(T, latestRun?.status),
                                                borderRadius: 999,
                                                padding: '6px 10px',
                                                fontSize: 10,
                                                fontWeight: 800,
                                            }}>
                                                {latestRun?.status ?? 'Belum ada'}
                                            </div>
                                        </div>

                                        {latestRun ? (
                                            <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                                                <div style={{ fontSize: 18, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                                    {latestRun.reference_code}
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                                                    <div style={styles.statCard}>
                                                        <div style={{ fontSize: 11, color: T.textMuted }}>Periode</div>
                                                        <div style={{ marginTop: 7, fontSize: 12, fontWeight: 800, color: T.text }}>{formatDate(latestRun.period_start)} - {formatDate(latestRun.period_end)}</div>
                                                    </div>
                                                    <div style={styles.statCard}>
                                                        <div style={{ fontSize: 11, color: T.textMuted }}>Karyawan</div>
                                                        <div style={{ marginTop: 7, fontSize: 20, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>{latestRun.employees_count}</div>
                                                    </div>
                                                    <div style={styles.statCard}>
                                                        <div style={{ fontSize: 11, color: T.textMuted }}>Net Total</div>
                                                        <div style={{ marginTop: 7, fontSize: 14, fontWeight: 900, color: T.text }}>{formatCurrency(latestRun.net_total)}</div>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => void openRunDetail(latestRun.id)} style={styles.button}>
                                                    <ClipboardCheck size={14} />
                                                    Lihat Detail Run
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 14, lineHeight: 1.7 }}>
                                                Belum ada payroll run. Setup schedule dan payroll profile lebih dulu, lalu generate draft run pertama.
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ ...styles.softCard, display: 'grid', gap: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Landmark size={15} color={T.primary} />
                                            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Setup Health</div>
                                        </div>
                                        {[
                                            { label: 'Jadwal aktif', value: `${stats.active_schedules}/${stats.schedules}` },
                                            { label: 'Komponen aktif', value: `${components.filter(component => component.status === 'active').length}/${components.length}` },
                                            { label: 'Profile aktif', value: `${stats.active_profiles}/${stats.profiles}` },
                                            { label: 'Directory siap', value: `${directory.filter(item => !item.has_payroll_profile).length} tersisa` },
                                        ].map(item => (
                                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                                                <span style={{ color: T.textMuted }}>{item.label}</span>
                                                <strong style={{ color: T.text }}>{item.value}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {tab === 'schedules' && (
                        <section style={styles.card}>
                            <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 12, flexDirection: isDesktop ? 'row' : 'column' }}>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Jadwal Payroll</div>
                                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Tentukan cut-off dan payout date untuk proses payroll bulanan.</div>
                                </div>
                                <button type="button" onClick={() => openScheduleModal()} style={styles.button}>
                                    <Plus size={14} />
                                    Tambah Jadwal
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                                {schedules.map(schedule => (
                                    <div key={schedule.id} style={{ ...styles.softCard, display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 12, flexDirection: isDesktop ? 'row' : 'column' }}>
                                        <div style={{ display: 'grid', gap: 5 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{schedule.name}</div>
                                                <span style={{ ...statusTone(T, schedule.status), fontSize: 10, fontWeight: 800, padding: '5px 9px', borderRadius: 999 }}>{schedule.status}</span>
                                            </div>
                                            <div style={{ fontSize: 12, color: T.textMuted }}>
                                                Cut-off: {schedule.cutoff_day ? `Tanggal ${schedule.cutoff_day}` : 'Belum diatur'} • Payout: {schedule.payout_day ? `Tanggal ${schedule.payout_day}` : 'Belum diatur'}
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => openScheduleModal(schedule)} style={styles.subtleButton}>
                                            <NotebookTabs size={14} />
                                            Edit Jadwal
                                        </button>
                                    </div>
                                ))}
                                {schedules.length === 0 && (
                                    <div style={{ ...styles.softCard, fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
                                        Belum ada jadwal payroll. Tambahkan minimal satu jadwal agar payroll profile bisa dikaitkan ke siklus pembayaran.
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {tab === 'components' && (
                        <section style={styles.card}>
                            <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 12, flexDirection: isDesktop ? 'row' : 'column' }}>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Komponen Gaji</div>
                                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Allowance dan deduction reusable yang dipasang ke payroll profile.</div>
                                </div>
                                <button type="button" onClick={() => openComponentModal()} style={styles.button}>
                                    <Plus size={14} />
                                    Tambah Komponen
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                                {components.map(component => (
                                    <div key={component.id} style={{ ...styles.softCard, display: 'grid', gap: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                            <div style={{ display: 'grid', gap: 4 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{component.name}</div>
                                                    <span style={{ ...statusTone(T, component.status), fontSize: 10, fontWeight: 800, padding: '5px 9px', borderRadius: 999 }}>{component.status}</span>
                                                    <span style={{ fontSize: 10, fontWeight: 800, color: component.type === 'earning' ? T.success : T.danger }}>
                                                        {component.type === 'earning' ? 'Earning' : 'Deduction'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 12, color: T.textMuted }}>
                                                    {component.amount_type === 'fixed' ? 'Fixed' : 'Manual'} • {component.is_recurring ? 'Recurring' : 'One-off'} • Default {formatCurrency(component.default_amount)}
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => openComponentModal(component)} style={styles.subtleButton}>
                                                <Settings2 size={14} />
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {components.length === 0 && (
                                    <div style={{ ...styles.softCard, fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
                                        Belum ada komponen payroll. Mulai dari allowance tetap atau deduction sederhana agar payroll run bisa menghasilkan breakdown yang jelas.
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {tab === 'profiles' && (
                        <section style={styles.card}>
                            <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 12, flexDirection: isDesktop ? 'row' : 'column' }}>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Payroll Profiles</div>
                                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Mapping karyawan ke base salary, schedule, bank detail, dan recurring components.</div>
                                </div>
                                <button type="button" onClick={() => openProfileModal()} style={styles.button}>
                                    <Plus size={14} />
                                    Tambah Profile
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                                {profiles.map(profile => (
                                    <div key={profile.id} style={{ ...styles.softCard, display: 'grid', gap: 10 }}>
                                        <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 12, flexDirection: isDesktop ? 'row' : 'column' }}>
                                            <div style={{ display: 'grid', gap: 6 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{profile.user.name}</div>
                                                    <span style={{ ...statusTone(T, profile.status), fontSize: 10, fontWeight: 800, padding: '5px 9px', borderRadius: 999 }}>{profile.status}</span>
                                                </div>
                                                <div style={{ fontSize: 12, color: T.textMuted }}>
                                                    {profile.user.email ?? 'Tanpa email'} • {profile.schedule?.name ?? 'Tanpa jadwal'} • {profile.components.length} komponen
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ fontSize: 15, fontWeight: 900, color: T.text }}>{formatCurrency(profile.base_salary)}</div>
                                                <button type="button" onClick={() => openProfileModal(profile)} style={styles.subtleButton}>
                                                    <UserCircle2 size={14} />
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {profiles.length === 0 && (
                                    <div style={{ ...styles.softCard, fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
                                        Belum ada payroll profile. Setup karyawan payroll dulu supaya payroll run bisa dibuat.
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {tab === 'runs' && (
                        <section style={styles.card}>
                            <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 12, flexDirection: isDesktop ? 'row' : 'column' }}>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Payroll Runs</div>
                                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Draft dan final payroll runs. Default pagination mengikuti standar 15 item.</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <select value={runStatus} onChange={event => { setRunPage(1); setRunStatus(event.target.value as typeof runStatus); }} style={styles.input}>
                                        <option value="all">Semua Status</option>
                                        <option value="draft">Draft</option>
                                        <option value="finalized">Finalized</option>
                                        <option value="paid">Paid</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <button type="button" onClick={() => setRunFormOpen(true)} style={styles.button}>
                                        <Plus size={14} />
                                        Buat Run
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                                {loadingRuns ? (
                                    <div style={{ ...styles.softCard, display: 'grid', placeItems: 'center', minHeight: 160 }}>
                                        <Loader2 size={22} className="animate-spin" color={T.primary} />
                                    </div>
                                ) : runPagination.data.length === 0 ? (
                                    <div style={{ ...styles.softCard, fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
                                        Belum ada payroll run untuk filter ini.
                                    </div>
                                ) : (
                                    runPagination.data.map(run => (
                                        <div key={run.id} style={{ ...styles.softCard, display: 'grid', gap: 10 }}>
                                            <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 12, flexDirection: isDesktop ? 'row' : 'column' }}>
                                                <div style={{ display: 'grid', gap: 6 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                        <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{run.reference_code}</div>
                                                        <span style={{ ...statusTone(T, run.status), fontSize: 10, fontWeight: 800, padding: '5px 9px', borderRadius: 999 }}>{run.status}</span>
                                                    </div>
                                                    <div style={{ fontSize: 12, color: T.textMuted }}>
                                                        {formatDate(run.period_start)} - {formatDate(run.period_end)} • {run.schedule?.name ?? 'Semua profile aktif'} • {run.employees_count} karyawan
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ fontSize: 15, fontWeight: 900, color: T.text }}>{formatCurrency(run.net_total)}</div>
                                                    <button type="button" onClick={() => void openRunDetail(run.id)} style={styles.subtleButton}>
                                                        <ReceiptText size={14} />
                                                        Detail
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {runPagination.last_page > 1 && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14 }}>
                                    <div style={{ fontSize: 12, color: T.textMuted }}>
                                        Halaman {runPagination.current_page} dari {runPagination.last_page} • {runPagination.total} run
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button type="button" disabled={runPagination.current_page <= 1} onClick={() => setRunPage(page => Math.max(1, page - 1))} style={styles.subtleButton}>
                                            Prev
                                        </button>
                                        <button type="button" disabled={runPagination.current_page >= runPagination.last_page} onClick={() => setRunPage(page => Math.min(runPagination.last_page, page + 1))} style={styles.subtleButton}>
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}

            {scheduleFormOpen && (
                <>
                    <div style={styles.overlay} onClick={resetScheduleForm} />
                    <div style={styles.dialogFrame}>
                        <form onSubmit={handleScheduleSubmit} style={{ ...styles.dialog, maxWidth: 560 }}>
                            <div style={styles.dialogHeader}>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>{editingSchedule ? 'Edit Jadwal Payroll' : 'Tambah Jadwal Payroll'}</div>
                                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Setup cut-off dan payout date.</div>
                                </div>
                                <button type="button" onClick={resetScheduleForm} style={styles.closeBtn}><X size={15} /></button>
                            </div>
                            <div style={styles.dialogBody}>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Nama Jadwal</div>
                                        <input value={scheduleName} onChange={event => setScheduleName(event.target.value)} style={styles.input} placeholder="Contoh: Payroll Bulanan" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: 12 }}>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Tanggal Cut-off</div>
                                            <input value={scheduleCutoffDay} onChange={event => setScheduleCutoffDay(event.target.value)} style={styles.input} placeholder="25" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Tanggal Payout</div>
                                            <input value={schedulePayoutDay} onChange={event => setSchedulePayoutDay(event.target.value)} style={styles.input} placeholder="28" />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Status</div>
                                        <select value={scheduleStatus} onChange={event => setScheduleStatus(event.target.value as typeof scheduleStatus)} style={styles.input}>
                                            <option value="active">Aktif</option>
                                            <option value="inactive">Nonaktif</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" disabled={scheduleSaving || !scheduleName.trim()} style={{ ...styles.button, width: '100%', justifyContent: 'center' }}>
                                    {scheduleSaving ? <Loader2 size={14} className="animate-spin" /> : <CalendarClock size={14} />}
                                    Simpan Jadwal
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {componentFormOpen && (
                <>
                    <div style={styles.overlay} onClick={resetComponentForm} />
                    <div style={styles.dialogFrame}>
                        <form onSubmit={handleComponentSubmit} style={{ ...styles.dialog, maxWidth: 620 }}>
                            <div style={styles.dialogHeader}>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>{editingComponent ? 'Edit Komponen Payroll' : 'Tambah Komponen Payroll'}</div>
                                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Komponen reusable untuk earning dan deduction.</div>
                                </div>
                                <button type="button" onClick={resetComponentForm} style={styles.closeBtn}><X size={15} /></button>
                            </div>
                            <div style={styles.dialogBody}>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Nama Komponen</div>
                                        <input value={componentName} onChange={event => setComponentName(event.target.value)} style={styles.input} placeholder="Contoh: Tunjangan Transport" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: 12 }}>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Tipe</div>
                                            <select value={componentType} onChange={event => setComponentType(event.target.value as typeof componentType)} style={styles.input}>
                                                <option value="earning">Earning</option>
                                                <option value="deduction">Deduction</option>
                                            </select>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Amount Type</div>
                                            <select value={componentAmountType} onChange={event => setComponentAmountType(event.target.value as typeof componentAmountType)} style={styles.input}>
                                                <option value="fixed">Fixed</option>
                                                <option value="manual">Manual</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: 12 }}>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Default Amount</div>
                                            <input value={componentDefaultAmount} onChange={event => setComponentDefaultAmount(event.target.value)} style={styles.input} placeholder="150000" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Sort Order</div>
                                            <input value={componentSortOrder} onChange={event => setComponentSortOrder(event.target.value)} style={styles.input} placeholder="0" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, minmax(0, 1fr))' : '1fr', gap: 12 }}>
                                        <label style={{ ...styles.softCard, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input type="checkbox" checked={componentRecurring} onChange={event => setComponentRecurring(event.target.checked)} />
                                            <span style={{ fontSize: 12, color: T.text }}>Recurring</span>
                                        </label>
                                        <label style={{ ...styles.softCard, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input type="checkbox" checked={componentTaxable} onChange={event => setComponentTaxable(event.target.checked)} />
                                            <span style={{ fontSize: 12, color: T.text }}>Taxable</span>
                                        </label>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Status</div>
                                            <select value={componentStatus} onChange={event => setComponentStatus(event.target.value as typeof componentStatus)} style={styles.input}>
                                                <option value="active">Aktif</option>
                                                <option value="inactive">Nonaktif</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" disabled={componentSaving || !componentName.trim()} style={{ ...styles.button, width: '100%', justifyContent: 'center' }}>
                                    {componentSaving ? <Loader2 size={14} className="animate-spin" /> : <Coins size={14} />}
                                    Simpan Komponen
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {profileFormOpen && (
                <>
                    <div style={styles.overlay} onClick={resetProfileForm} />
                    <div style={styles.dialogFrame}>
                        <form onSubmit={handleProfileSubmit} style={styles.dialog}>
                            <div style={styles.dialogHeader}>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>{editingProfile ? 'Edit Payroll Profile' : 'Tambah Payroll Profile'}</div>
                                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Hubungkan karyawan dengan salary setup dan recurring components.</div>
                                </div>
                                <button type="button" onClick={resetProfileForm} style={styles.closeBtn}><X size={15} /></button>
                            </div>
                            <div style={styles.dialogBody}>
                                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 14 }}>
                                    <div style={{ display: 'grid', gap: 12 }}>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Karyawan</div>
                                            <select value={profileUserId} onChange={event => setProfileUserId(event.target.value)} style={styles.input} disabled={Boolean(editingProfile)}>
                                                <option value="">Pilih karyawan</option>
                                                {activeDirectory.map(item => (
                                                    <option key={item.platform_user_id} value={item.platform_user_id}>
                                                        {item.name} • {item.role}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: 12 }}>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Jadwal</div>
                                                <select value={profileScheduleId} onChange={event => setProfileScheduleId(event.target.value)} style={styles.input}>
                                                    <option value="">Tanpa jadwal</option>
                                                    {schedules.map(schedule => (
                                                        <option key={schedule.id} value={schedule.id}>{schedule.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Employment Type</div>
                                                <select value={profileEmploymentType} onChange={event => setProfileEmploymentType(event.target.value as typeof profileEmploymentType)} style={styles.input}>
                                                    <option value="monthly">Monthly</option>
                                                    <option value="daily">Daily</option>
                                                    <option value="contract">Contract</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Base Salary</div>
                                            <input value={profileBaseSalary} onChange={event => setProfileBaseSalary(event.target.value)} style={styles.input} placeholder="4000000" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: 12 }}>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Bank</div>
                                                <input value={profileBankName} onChange={event => setProfileBankName(event.target.value)} style={styles.input} placeholder="BCA" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Status</div>
                                                <select value={profileStatus} onChange={event => setProfileStatus(event.target.value as typeof profileStatus)} style={styles.input}>
                                                    <option value="active">Aktif</option>
                                                    <option value="inactive">Nonaktif</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: 12 }}>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Nama Rekening</div>
                                                <input value={profileBankAccountName} onChange={event => setProfileBankAccountName(event.target.value)} style={styles.input} placeholder="Nama sesuai bank" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>No Rekening</div>
                                                <input value={profileBankAccountNumber} onChange={event => setProfileBankAccountNumber(event.target.value)} style={styles.input} placeholder="1234567890" />
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Catatan</div>
                                            <textarea value={profileNotes} onChange={event => setProfileNotes(event.target.value)} style={styles.textarea} placeholder="Catatan internal payroll" />
                                        </div>
                                    </div>

                                    <div style={{ ...styles.softCard, display: 'grid', gap: 10, alignContent: 'start' }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Recurring Components</div>
                                            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Aktifkan komponen yang harus ikut ke payroll profile ini.</div>
                                        </div>
                                        <div style={{ display: 'grid', gap: 8 }}>
                                            {profileComponents.map(item => (
                                                <div key={item.payroll_component_id} style={{ ...styles.card, padding: '10px 12px', display: 'grid', gap: 8 }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={item.enabled}
                                                                onChange={event => setProfileComponents(current =>
                                                                    current.map(entry => entry.payroll_component_id === item.payroll_component_id
                                                                        ? { ...entry, enabled: event.target.checked }
                                                                        : entry))
                                                                }
                                                            />
                                                            <div>
                                                                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{item.label}</div>
                                                                <div style={{ fontSize: 10, color: item.type === 'earning' ? T.success : T.danger }}>
                                                                    {item.type === 'earning' ? 'Earning' : 'Deduction'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ minWidth: 120 }}>
                                                            <input
                                                                value={item.amount}
                                                                onChange={event => setProfileComponents(current =>
                                                                    current.map(entry => entry.payroll_component_id === item.payroll_component_id
                                                                        ? { ...entry, amount: event.target.value }
                                                                        : entry))
                                                                }
                                                                style={styles.input}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </label>
                                                </div>
                                            ))}
                                            {profileComponents.length === 0 && (
                                                <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
                                                    Belum ada komponen payroll aktif. Tambah komponen dulu dari tab Komponen.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={profileSaving || !profileUserId || !profileBaseSalary} style={{ ...styles.button, width: '100%', justifyContent: 'center' }}>
                                    {profileSaving ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
                                    Simpan Payroll Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {runFormOpen && (
                <>
                    <div style={styles.overlay} onClick={resetRunForm} />
                    <div style={styles.dialogFrame}>
                        <form onSubmit={handleRunSubmit} style={{ ...styles.dialog, maxWidth: 560 }}>
                            <div style={styles.dialogHeader}>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Buat Payroll Run</div>
                                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Generate draft payroll run dengan snapshot salary + attendance.</div>
                                </div>
                                <button type="button" onClick={resetRunForm} style={styles.closeBtn}><X size={15} /></button>
                            </div>
                            <div style={styles.dialogBody}>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Jadwal</div>
                                        <select value={runScheduleId} onChange={event => setRunScheduleId(event.target.value)} style={styles.input}>
                                            <option value="">Semua payroll profile aktif</option>
                                            {schedules.map(schedule => (
                                                <option key={schedule.id} value={schedule.id}>{schedule.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: 12 }}>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Periode Mulai</div>
                                            <input type="date" value={runPeriodStart} onChange={event => setRunPeriodStart(event.target.value)} style={styles.input} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Periode Selesai</div>
                                            <input type="date" value={runPeriodEnd} onChange={event => setRunPeriodEnd(event.target.value)} style={styles.input} />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 7 }}>Tanggal Pembayaran</div>
                                        <input type="date" value={runPayoutDate} onChange={event => setRunPayoutDate(event.target.value)} style={styles.input} />
                                    </div>
                                </div>
                                <button type="submit" disabled={runSaving || !runPeriodStart || !runPeriodEnd} style={{ ...styles.button, width: '100%', justifyContent: 'center' }}>
                                    {runSaving ? <Loader2 size={14} className="animate-spin" /> : <ReceiptText size={14} />}
                                    Generate Draft Run
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {runDetailId !== null && (
                <>
                    <div style={styles.overlay} onClick={() => { setRunDetailId(null); setRunDetail(null); }} />
                    <div style={styles.dialogFrame}>
                        <div style={styles.dialog}>
                            <div style={styles.dialogHeader}>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                        {runDetail?.reference_code ?? 'Payroll Run Detail'}
                                    </div>
                                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
                                        {runDetail ? `${formatDate(runDetail.period_start)} - ${formatDate(runDetail.period_end)}` : 'Memuat detail run'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {runDetail?.status === 'draft' && (
                                        <button type="button" onClick={handleFinalizeRun} disabled={runFinalizing} style={styles.button}>
                                            {runFinalizing ? <Loader2 size={14} className="animate-spin" /> : <ClipboardCheck size={14} />}
                                            Finalize
                                        </button>
                                    )}
                                    <button type="button" onClick={() => { setRunDetailId(null); setRunDetail(null); }} style={styles.closeBtn}><X size={15} /></button>
                                </div>
                            </div>
                            <div style={styles.dialogBody}>
                                {runDetailLoading || !runDetail ? (
                                    <div style={{ display: 'grid', placeItems: 'center', minHeight: 220 }}>
                                        <Loader2 size={22} className="animate-spin" color={T.primary} />
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                                            {[
                                                { label: 'Employees', value: runDetail.employees_count, icon: UserCircle2 },
                                                { label: 'Earnings', value: formatCurrency(runDetail.earnings_total), icon: CircleDollarSign },
                                                { label: 'Deductions', value: formatCurrency(runDetail.deductions_total), icon: Coins },
                                                { label: 'Net Total', value: formatCurrency(runDetail.net_total), icon: Wallet },
                                            ].map(item => (
                                                <div key={item.label} style={styles.statCard}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                        <div style={{ fontSize: 11, color: T.textMuted }}>{item.label}</div>
                                                        <item.icon size={14} color={T.primary} />
                                                    </div>
                                                    <div style={{ marginTop: 8, fontSize: 16, fontWeight: 900, color: T.text }}>{item.value}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: 'grid', gap: 10 }}>
                                            {runDetail.items.map(item => (
                                                <div key={item.id} style={{ ...styles.card, padding: 14, display: 'grid', gap: 12 }}>
                                                    <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 12, flexDirection: isDesktop ? 'row' : 'column' }}>
                                                        <div>
                                                            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{item.employee_name}</div>
                                                            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{item.user.email ?? 'Tanpa email'} • {item.attendance_summary?.integrated ? 'Attendance synced' : 'Attendance unavailable'}</div>
                                                        </div>
                                                        <div style={{ fontSize: 14, fontWeight: 900, color: T.text }}>{formatCurrency(item.net_total)}</div>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1.15fr .85fr' : '1fr', gap: 12 }}>
                                                        <div style={{ ...styles.softCard, display: 'grid', gap: 8 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <ReceiptText size={14} color={T.primary} />
                                                                <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>Komponen Snapshot</div>
                                                            </div>
                                                            {item.component_lines.map(line => (
                                                                <div key={`${item.id}-${line.code}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12 }}>
                                                                    <span style={{ color: T.text }}>
                                                                        {line.name}
                                                                        <span style={{ color: line.type === 'earning' ? T.success : T.danger, fontSize: 10, marginLeft: 6 }}>
                                                                            {line.type === 'earning' ? 'earning' : 'deduction'}
                                                                        </span>
                                                                    </span>
                                                                    <strong style={{ color: T.text }}>{formatCurrency(line.amount)}</strong>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div style={{ ...styles.softCard, display: 'grid', gap: 8 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <Landmark size={14} color={T.primary} />
                                                                <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>Attendance Snapshot</div>
                                                            </div>
                                                            {[
                                                                { label: 'Present', value: item.attendance_summary?.present_days ?? 0 },
                                                                { label: 'Office', value: item.attendance_summary?.office_days ?? 0 },
                                                                { label: 'Field', value: item.attendance_summary?.field_days ?? 0 },
                                                                { label: 'Complete', value: item.attendance_summary?.complete_days ?? 0 },
                                                            ].map(row => (
                                                                <div key={`${item.id}-${row.label}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12 }}>
                                                                    <span style={{ color: T.textMuted }}>{row.label}</span>
                                                                    <strong style={{ color: T.text }}>{row.value}</strong>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
