import { useState, useRef } from 'react';
import {
    FileText, Plus, Send, Loader2, Image, File, X, CheckCircle2,
    Calendar, Clock, Paperclip, Trash2,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';

interface Props { T: Theme; isDesktop: boolean; }

type ReportEntry = {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    attachments: { name: string; type: string; size: string; preview?: string }[];
    status: 'draft' | 'sent';
};

export function EmployeeReportTab({ T }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [sending, setSending] = useState(false);
    const [reports, setReports] = useState<ReportEntry[]>([]);
    const [successMsg, setSuccessMsg] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const now = new Date();
    const todayStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        setAttachments(prev => [...prev, ...files].slice(0, 5)); // Max 5 files
        if (fileRef.current) fileRef.current.value = '';
    };

    const removeFile = (idx: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== idx));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return Image;
        return File;
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) return;
        setSending(true);
        // Simulate send (TODO: connect real API)
        await new Promise(r => setTimeout(r, 1200));

        const entry: ReportEntry = {
            id: Date.now().toString(),
            title: title.trim(),
            description: description.trim(),
            date: now.toISOString().split('T')[0],
            time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            attachments: attachments.map(f => ({
                name: f.name,
                type: f.type,
                size: formatFileSize(f.size),
                preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
            })),
            status: 'sent',
        };

        setReports(prev => [entry, ...prev]);
        setTitle('');
        setDescription('');
        setAttachments([]);
        setShowForm(false);
        setSending(false);
        setSuccessMsg('Laporan berhasil dikirim! ✅');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const card = (extra?: React.CSSProperties): React.CSSProperties => ({
        background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, ...extra,
    });

    const inputStyle: React.CSSProperties = {
        width: '100%', borderRadius: 14, border: `1px solid ${T.border}`,
        background: T.bgAlt ?? T.surface, padding: '12px 14px',
        fontSize: 13, color: T.text, boxSizing: 'border-box',
        fontFamily: 'inherit',
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                        Laporan Kerja
                    </h2>
                    <p style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                        Catat pekerjaan yang sudah diselesaikan hari ini.
                    </p>
                </div>
                {!showForm && (
                    <button onClick={() => setShowForm(true)} style={{
                        height: 40, padding: '0 16px', borderRadius: 14,
                        background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark ?? T.primary})`,
                        color: '#fff', fontSize: 12, fontWeight: 800,
                        display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: `0 4px 16px ${T.primary}30`,
                    }}>
                        <Plus size={15} /> Buat Laporan
                    </button>
                )}
            </div>

            {/* Success Toast */}
            {successMsg && (
                <div style={{
                    padding: '12px 16px', borderRadius: 14, marginBottom: 14,
                    background: `${T.success}10`, border: `1px solid ${T.success}25`,
                    color: T.success, fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 8,
                    animation: 'fadeUp .3s ease',
                }}>
                    <CheckCircle2 size={16} /> {successMsg}
                </div>
            )}

            {/* ═══ Create Report Form ═══ */}
            {showForm && (
                <div style={{ ...card({ padding: 20, marginBottom: 16 }), animation: 'fadeUp .3s ease' }}>
                    {/* Form Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 12,
                                background: `${T.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <FileText size={16} color={T.primary} />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Laporan Baru</div>
                                <div style={{ fontSize: 10, color: T.textMuted }}>{todayStr}</div>
                            </div>
                        </div>
                        <button onClick={() => setShowForm(false)} style={{
                            width: 32, height: 32, borderRadius: 10,
                            border: `1px solid ${T.border}`, background: T.bgAlt ?? T.surface,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted,
                        }}>
                            <X size={14} />
                        </button>
                    </div>

                    {/* Title */}
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6 }}>
                            Judul Laporan *
                        </label>
                        <input value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="Contoh: Penyelesaian proyek modul absensi"
                            style={{ ...inputStyle, height: 44 }} />
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6 }}>
                            Detail Pekerjaan *
                        </label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)}
                            placeholder="Jelaskan pekerjaan yang sudah diselesaikan, progres, kendala, dll..."
                            rows={5}
                            style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }} />
                    </div>

                    {/* File Upload */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6 }}>
                            Lampiran (opsional)
                        </label>
                        <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileSelect} style={{ display: 'none' }} />

                        {/* Upload Area */}
                        <button onClick={() => fileRef.current?.click()} style={{
                            width: '100%', padding: '18px 14px', borderRadius: 14,
                            border: `2px dashed ${T.border}`, background: `${T.primary}04`,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                            cursor: 'pointer', transition: 'all .15s',
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: `${T.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Paperclip size={18} color={T.primary} />
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
                                    Pilih file atau foto
                                </div>
                                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                                    JPG, PNG, PDF, DOC, XLS • Maks 5 file
                                </div>
                            </div>
                        </button>

                        {/* Attached Files */}
                        {attachments.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                                {attachments.map((file, i) => {
                                    const FileIcon = getFileIcon(file.type);
                                    const isImage = file.type.startsWith('image/');
                                    return (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '8px 12px', borderRadius: 12,
                                            background: T.bgAlt ?? T.surface, border: `1px solid ${T.border}`,
                                        }}>
                                            {isImage ? (
                                                <img src={URL.createObjectURL(file)} alt=""
                                                    style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 8,
                                                    background: `${T.info}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <FileIcon size={16} color={T.info} />
                                                </div>
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {file.name}
                                                </div>
                                                <div style={{ fontSize: 10, color: T.textMuted }}>{formatFileSize(file.size)}</div>
                                            </div>
                                            <button onClick={() => removeFile(i)} style={{
                                                width: 28, height: 28, borderRadius: 8,
                                                background: `${T.danger}08`, border: `1px solid ${T.danger}20`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.danger,
                                            }}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setShowForm(false)} style={{
                            flex: 1, height: 46, borderRadius: 14, border: `1px solid ${T.border}`,
                            background: T.surface, color: T.textSub, fontWeight: 700, fontSize: 13,
                        }}>Batal</button>
                        <button onClick={handleSubmit} disabled={!title.trim() || !description.trim() || sending}
                            style={{
                                flex: 2, height: 46, borderRadius: 14,
                                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark ?? T.primary})`,
                                color: '#fff', fontWeight: 800, fontSize: 13,
                                opacity: sending || !title.trim() || !description.trim() ? .6 : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: `0 4px 16px ${T.primary}25`,
                            }}>
                            {sending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                            {sending ? 'Mengirim...' : 'Kirim Laporan'}
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ Report History ═══ */}
            {reports.length > 0 && (
                <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: .5 }}>
                        Riwayat Laporan
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {reports.map(report => (
                            <div key={report.id} style={card({ padding: 16 })}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 4 }}>
                                            {report.title}
                                        </div>
                                        <p style={{
                                            fontSize: 12, color: T.textMuted, lineHeight: 1.6,
                                            display: '-webkit-box', WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                        } as React.CSSProperties}>
                                            {report.description}
                                        </p>
                                    </div>
                                    <span style={{
                                        fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 8, flexShrink: 0,
                                        background: `${T.success}12`, color: T.success, border: `1px solid ${T.success}25`,
                                    }}>
                                        Terkirim
                                    </span>
                                </div>

                                {/* Attachments preview */}
                                {report.attachments.length > 0 && (
                                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                                        {report.attachments.map((att, i) => (
                                            <div key={i} style={{
                                                display: 'flex', alignItems: 'center', gap: 5,
                                                padding: '4px 10px', borderRadius: 8,
                                                background: T.bgAlt ?? T.surface, border: `1px solid ${T.border}`,
                                                fontSize: 10, color: T.textMuted, fontWeight: 600,
                                            }}>
                                                <Paperclip size={9} /> {att.name.length > 20 ? att.name.slice(0, 17) + '...' : att.name}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 12, marginTop: 10,
                                    fontSize: 10, color: T.textMuted,
                                }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Calendar size={9} /> {report.date}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Clock size={9} /> {report.time}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!showForm && reports.length === 0 && (
                <div style={{ ...card({ padding: 48 }), textAlign: 'center' }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
                        background: `${T.primary}08`, border: `1px solid ${T.primary}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <FileText size={28} color={T.primary} style={{ opacity: .4 }} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 6 }}>
                        Belum ada laporan
                    </div>
                    <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
                        Buat laporan harian untuk mencatat pekerjaan<br />yang sudah diselesaikan.
                    </div>
                    <button onClick={() => setShowForm(true)} style={{
                        height: 42, padding: '0 20px', borderRadius: 14, marginTop: 18,
                        background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark ?? T.primary})`,
                        color: '#fff', fontSize: 12, fontWeight: 800,
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        boxShadow: `0 4px 16px ${T.primary}30`,
                    }}>
                        <Plus size={15} /> Buat Laporan Pertama
                    </button>
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
