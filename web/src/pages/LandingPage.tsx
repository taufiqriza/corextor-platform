import { useState, useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import {
  ClipboardCheck,
  DollarSign,
  Globe,
  LayoutDashboard,
  ArrowRight,
  ChevronDown,
  Users,
  HardHat,
  Building2,
  Layers,
  Zap,
  Shield,
  CheckCircle2,
  Menu,
  X,
  ExternalLink,
  LogIn,
  Phone,
} from "lucide-react";
import { getLoginDestination } from "@/lib/appSurface";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type Lang = "id" | "en";
const EMPLOYEE_LOGIN_URL = getLoginDestination("employee");
const BRAND_ICON = "/corextor-icon.png";

// ─────────────────────────────────────────────
// COPY
// ─────────────────────────────────────────────
const copy = {
  nav: {
    products: { id: "Produk", en: "Products" },
    services: { id: "Layanan", en: "Services" },
    why: { id: "Mengapa Corextor", en: "Why Corextor" },
    model: { id: "Model Kerja", en: "Delivery" },
    loginAdmin: { id: "Login Admin", en: "Admin Login" },
    loginPin: { id: "Login Karyawan", en: "Employee Login" },
    consult: { id: "Konsultasi", en: "Consult" },
  },
  hero: {
    badge: { id: "Platform Operasional Perusahaan", en: "Enterprise Operations Platform" },
    h1a: { id: "Satu Platform.", en: "One Platform." },
    h1b: { id: "Seluruh Operasional.", en: "Total Operations." },
    sub: {
      id: "Corextor menggabungkan SaaS workforce management dengan pengembangan digital custom — dirancang untuk perusahaan yang bergerak cepat dan siap berkembang.",
      en: "Corextor unifies workforce SaaS with custom digital development — built for companies that move fast and scale further.",
    },
    cta1: { id: "Mulai Konsultasi", en: "Start Consulting" },
    cta2: { id: "Lihat Produk", en: "See Products" },
    stat1: { id: "Karyawan Terkelola", en: "Managed Employees" },
    stat2: { id: "Perusahaan Aktif", en: "Active Companies" },
    stat3: { id: "Uptime Platform", en: "Platform Uptime" },
  },
  products: {
    badge: { id: "Produk Aktif", en: "Active Products" },
    title: { id: "Workforce Tools yang Serius", en: "Serious Workforce Tools" },
    sub: {
      id: "Dirancang untuk perusahaan dengan karyawan kantor dan lapangan. Presisi, andal, dan siap skala.",
      en: "Built for companies with office and field teams. Precise, reliable, and scale-ready.",
    },
    att: {
      label: { id: "Absensi", en: "Attendance" },
      title: { id: "Kontrol Kehadiran Penuh", en: "Full Attendance Control" },
      desc: {
        id: "Pantau kehadiran real-time dengan GPS check-in, validasi lokasi, dan laporan otomatis. Cocok untuk tim kantor maupun tim lapangan.",
        en: "Monitor attendance in real-time with GPS check-in, location validation, and automated reports. Ideal for both office and field teams.",
      },
      points: {
        id: ["GPS & geofence check-in", "Shift & jadwal fleksibel", "Dashboard real-time", "Ekspor laporan otomatis"],
        en: ["GPS & geofence check-in", "Flexible shifts & schedules", "Real-time dashboard", "Auto report export"],
      },
    },
    pay: {
      label: { id: "Penggajian", en: "Payroll" },
      title: { id: "Penggajian Tanpa Error", en: "Zero-Error Payroll" },
      desc: {
        id: "Kalkulasi gaji otomatis terintegrasi dengan data absensi. Potongan, lembur, dan slip gaji digital — selesai dalam hitungan menit.",
        en: "Automated payroll calculation integrated with attendance data. Deductions, overtime, and digital pay slips — done in minutes.",
      },
      points: {
        id: ["Integrasi data absensi", "Kalkulasi otomatis PPh 21", "Slip gaji digital", "Multi-komponen gaji"],
        en: ["Attendance data integration", "Auto PPh 21 calculation", "Digital pay slips", "Multi-component salary"],
      },
    },
    more: {
      id: "Platform ini dirancang multi-product. Modul baru akan hadir secara bertahap.",
      en: "This platform is built multi-product ready. New modules are being added progressively.",
    },
  },
  services: {
    badge: { id: "Layanan Digital", en: "Digital Services" },
    title: { id: "Custom, Bukan Kompromi", en: "Custom, Not Compromise" },
    sub: {
      id: "Saat SaaS tidak cukup, kami bangun solusinya. Dari website korporat hingga sistem admin internal yang kompleks.",
      en: "When SaaS isn't enough, we build the solution. From corporate websites to complex internal admin systems.",
    },
    items: [
      {
        icon: Globe,
        title: { id: "Website Korporat", en: "Corporate Website" },
        desc: {
          id: "Bilingual (Indonesia / English), dioptimasi untuk konversi dan representasi brand yang kuat.",
          en: "Bilingual (Indonesian / English), optimized for conversion and strong brand representation.",
        },
      },
      {
        icon: LayoutDashboard,
        title: { id: "Custom Dashboard & Admin", en: "Custom Dashboard & Admin" },
        desc: {
          id: "Sistem admin internal yang dirancang sesuai alur kerja bisnis Anda — bukan template generik.",
          en: "Internal admin systems designed around your business workflow — not a generic template.",
        },
      },
      {
        icon: Layers,
        title: { id: "Sistem Terintegrasi", en: "Integrated Systems" },
        desc: {
          id: "Integrasi platform Corextor dengan sistem eksternal, API pihak ketiga, atau legacy system yang sudah berjalan.",
          en: "Integrate the Corextor platform with external systems, third-party APIs, or existing legacy systems.",
        },
      },
    ],
  },
  why: {
    badge: { id: "Mengapa Corextor", en: "Why Corextor" },
    title: { id: "Bukan Sekadar Aplikasi Absensi", en: "More Than an Attendance App" },
    sub: {
      id: "Corextor adalah fondasi operasional digital perusahaan Anda — platform yang tumbuh bersama bisnis.",
      en: "Corextor is the digital operational foundation of your company — a platform that grows with your business.",
    },
    items: [
      {
        icon: Building2,
        title: { id: "Untuk Perusahaan Nyata", en: "Built for Real Companies" },
        desc: {
          id: "Dirancang khusus untuk perusahaan operasional, kontraktor, dan bisnis dengan karyawan kantor dan lapangan.",
          en: "Specifically designed for operational companies, contractors, and businesses with office and field employees.",
        },
      },
      {
        icon: HardHat,
        title: { id: "Field-Ready", en: "Field-Ready" },
        desc: {
          id: "GPS check-in, validasi lokasi, dan laporan otomatis untuk tim yang tersebar di berbagai titik.",
          en: "GPS check-in, location validation, and automated reports for teams spread across multiple sites.",
        },
      },
      {
        icon: Zap,
        title: { id: "Platform, Bukan Produk Tunggal", en: "Platform, Not a Single Product" },
        desc: {
          id: "Dari absensi ke penggajian, ke sistem custom — semuanya dalam satu ekosistem yang terhubung.",
          en: "From attendance to payroll to custom systems — all within one connected ecosystem.",
        },
      },
      {
        icon: Shield,
        title: { id: "Data Aman, Proses Andal", en: "Secure Data, Reliable Process" },
        desc: {
          id: "Infrastruktur stabil dengan uptime tinggi, enkripsi data, dan akses berbasis role yang presisi.",
          en: "Stable infrastructure with high uptime, data encryption, and precise role-based access control.",
        },
      },
      {
        icon: Users,
        title: { id: "Multi-Role Access", en: "Multi-Role Access" },
        desc: {
          id: "Portal admin untuk HR, portal PIN untuk karyawan, dan dashboard eksekutif untuk manajemen.",
          en: "Admin portal for HR, PIN portal for employees, and executive dashboard for management.",
        },
      },
      {
        icon: Globe,
        title: { id: "Bilingual Native", en: "Bilingual Native" },
        desc: {
          id: "Platform dan layanan kami mendukung Indonesia dan English — untuk perusahaan lokal maupun multinasional.",
          en: "Our platform and services support Indonesian and English — for local and multinational companies alike.",
        },
      },
    ],
  },
  model: {
    badge: { id: "Model Kerja", en: "Delivery Model" },
    title: { id: "Pilih Cara Kerja yang Tepat", en: "Choose the Right Way to Work" },
    sub: {
      id: "Kami fleksibel. Mulai dari berlangganan SaaS, bangun custom, atau kombinasi keduanya.",
      en: "We're flexible. Start with SaaS subscription, build custom, or combine both.",
    },
    saas: {
      name: { id: "SaaS Subscription", en: "SaaS Subscription" },
      desc: {
        id: "Aktifkan Attendance dan Payroll langsung. Bayar bulanan, tidak ada biaya setup besar.",
        en: "Activate Attendance and Payroll immediately. Pay monthly, no large setup costs.",
      },
      points: {
        id: ["Aktivasi cepat", "Update otomatis", "Support termasuk", "Skalabel sesuai jumlah karyawan"],
        en: ["Fast activation", "Automatic updates", "Support included", "Scalable by headcount"],
      },
    },
    custom: {
      name: { id: "Custom Build", en: "Custom Build" },
      desc: {
        id: "Bangun sistem digital yang benar-benar sesuai kebutuhan bisnis Anda — dari nol, dengan standar produk.",
        en: "Build a digital system truly tailored to your business needs — from scratch, to product standards.",
      },
      points: {
        id: ["Konsultasi kebutuhan", "Desain & development", "Testing & deployment", "Handover & dokumentasi"],
        en: ["Requirements consulting", "Design & development", "Testing & deployment", "Handover & documentation"],
      },
    },
    hybrid: {
      name: { id: "Hybrid Partnership", en: "Hybrid Partnership" },
      desc: {
        id: "Gunakan platform SaaS Corextor sebagai inti, dan kami kembangkan ekstensi custom sesuai kebutuhan spesifik Anda.",
        en: "Use the Corextor SaaS platform as the core, and we build custom extensions for your specific needs.",
      },
      points: {
        id: ["Platform + custom extension", "Integrasi penuh", "Satu vendor, satu ekosistem", "Partnership jangka panjang"],
        en: ["Platform + custom extension", "Full integration", "One vendor, one ecosystem", "Long-term partnership"],
      },
    },
  },
  cta: {
    title: { id: "Siap Membangun Fondasi Operasional yang Kuat?", en: "Ready to Build a Strong Operational Foundation?" },
    sub: {
      id: "Bicara langsung dengan tim kami. Kami akan bantu Anda menemukan solusi yang tepat.",
      en: "Talk directly with our team. We'll help you find the right solution.",
    },
    btn1: { id: "Mulai Konsultasi Gratis", en: "Start Free Consultation" },
    btn2: { id: "Login Admin Portal", en: "Admin Portal Login" },
    btn3: { id: "Login Karyawan (PIN)", en: "Employee Login (PIN)" },
  },
  footer: {
    tagline: { id: "Platform Operasional Perusahaan Modern", en: "Modern Enterprise Operations Platform" },
    products: { id: "Produk", en: "Products" },
    services: { id: "Layanan", en: "Services" },
    company: { id: "Perusahaan", en: "Company" },
    rights: { id: "Hak cipta dilindungi.", en: "All rights reserved." },
  },
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const t = (obj: { id: string; en: string }, lang: Lang) => obj[lang];
const tArr = (obj: { id: string[]; en: string[] }, lang: Lang) => obj[lang];

// ─────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

function useInView(ref: RefObject<HTMLElement | null>, threshold = 0.15) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return inView;
}

// ─── Navbar ─────────────────────────────────
function Navbar({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const scrollY = useScrollY();
  const [open, setOpen] = useState(false);
  const scrolled = scrollY > 40;

  return (
    <header
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        transition: "all 0.4s cubic-bezier(.16,1,.3,1)",
        background: scrolled ? "rgba(5,10,20,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <nav style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(37,99,235,0.35)",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <img src={BRAND_ICON} alt="Corextor" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", letterSpacing: "-0.02em" }}>
            Corextor
          </span>
        </a>

        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }} className="nav-desktop">
          {[
            { label: t(copy.nav.products, lang), href: "#products" },
            { label: t(copy.nav.services, lang), href: "#services" },
            { label: t(copy.nav.why, lang), href: "#why" },
            { label: t(copy.nav.model, lang), href: "#model" },
          ].map((item) => (
            <a key={item.href} href={item.href} style={{
              color: "rgba(255,255,255,0.65)", textDecoration: "none", fontSize: 14,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              padding: "6px 14px", borderRadius: 8,
              transition: "all 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff", e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)", e.currentTarget.style.background = "transparent")}
            >{item.label}</a>
          ))}
        </div>

        {/* CTA + lang */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="nav-desktop">
          {/* Lang toggle */}
          <button
            onClick={() => setLang(lang === "id" ? "en" : "id")}
            style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 7, color: "rgba(255,255,255,0.7)", fontSize: 12,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              padding: "5px 10px", cursor: "pointer", letterSpacing: "0.05em",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff", e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)", e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
          >
            {lang === "id" ? "EN" : "ID"}
          </button>
          <a href="/login" style={{
            display: "flex", alignItems: "center", gap: 6,
            color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 13,
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            padding: "7px 14px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff", e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)", e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
          >
            <LogIn size={13} />
            {t(copy.nav.loginAdmin, lang)}
          </a>
          <a href="#consult" style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
            color: "#fff", textDecoration: "none", fontSize: 13,
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
            padding: "8px 16px", borderRadius: 9,
            boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 24px rgba(37,99,235,0.55)", e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,0.35)", e.currentTarget.style.transform = "translateY(0)")}
          >
            {t(copy.nav.consult, lang)}
            <ArrowRight size={13} />
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="nav-mobile-btn"
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          background: "rgba(5,10,20,0.97)", backdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "16px 24px 24px",
        }} className="nav-mobile-menu">
          {[
            { label: t(copy.nav.products, lang), href: "#products" },
            { label: t(copy.nav.services, lang), href: "#services" },
            { label: t(copy.nav.why, lang), href: "#why" },
            { label: t(copy.nav.model, lang), href: "#model" },
          ].map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)} style={{
              display: "block", color: "rgba(255,255,255,0.8)", textDecoration: "none",
              fontSize: 15, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>{item.label}</a>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <a href="/login" onClick={() => setOpen(false)} style={{
              flex: 1, textAlign: "center", color: "rgba(255,255,255,0.7)",
              textDecoration: "none", fontSize: 13,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              padding: "10px", borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.15)",
            }}>{t(copy.nav.loginAdmin, lang)}</a>
            <a href="#consult" onClick={() => setOpen(false)} style={{
              flex: 1, textAlign: "center",
              background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
              color: "#fff", textDecoration: "none", fontSize: 13,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              padding: "10px", borderRadius: 9,
            }}>{t(copy.nav.consult, lang)}</a>
          </div>
          <button
            onClick={() => setLang(lang === "id" ? "en" : "id")}
            style={{
              marginTop: 12, background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 7, color: "rgba(255,255,255,0.7)", fontSize: 12,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              padding: "6px 12px", cursor: "pointer",
            }}
          >
            {lang === "id" ? "Switch to English" : "Ganti ke Indonesia"}
          </button>
        </div>
      )}
    </header>
  );
}

// ─── Hero ────────────────────────────────────
function HeroSection({ lang }: { lang: Lang }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);

  return (
    <section ref={ref} id="hero" style={{
      minHeight: "100vh", position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center",
      background: "linear-gradient(160deg, #020818 0%, #050d1f 40%, #040b1a 100%)",
      paddingTop: 100,
    }}>
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)",
      }} />

      {/* Glow orbs */}
      <div style={{
        position: "absolute", top: "15%", left: "55%",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "10%", left: "10%",
        width: 350, height: 350, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(29,78,216,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px", width: "100%", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="hero-grid">

          {/* Left */}
          <div style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(32px)", transition: "all 0.9s cubic-bezier(.16,1,.3,1)" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)",
              borderRadius: 100, padding: "6px 14px", marginBottom: 28,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 8px #3b82f6" }} />
              <span style={{ color: "#93c5fd", fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {t(copy.hero.badge, lang)}
              </span>
            </div>

            <h1 style={{
              fontFamily: "'Sora', sans-serif", fontWeight: 800,
              fontSize: "clamp(40px, 5vw, 62px)", lineHeight: 1.08,
              letterSpacing: "-0.04em", color: "#fff", margin: "0 0 6px",
            }}>
              {t(copy.hero.h1a, lang)}
            </h1>
            <h1 style={{
              fontFamily: "'Sora', sans-serif", fontWeight: 800,
              fontSize: "clamp(40px, 5vw, 62px)", lineHeight: 1.08,
              letterSpacing: "-0.04em", margin: "0 0 28px",
              background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #93c5fd 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {t(copy.hero.h1b, lang)}
            </h1>

            <p style={{
              color: "rgba(255,255,255,0.55)", fontSize: 17, lineHeight: 1.7,
              fontFamily: "'DM Sans', sans-serif", maxWidth: 500, marginBottom: 40,
            }}>
              {t(copy.hero.sub, lang)}
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="#consult" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "linear-gradient(135deg, #2563EB, #1e40af)",
                color: "#fff", textDecoration: "none", fontSize: 15,
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                padding: "14px 28px", borderRadius: 12,
                boxShadow: "0 8px 32px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                transition: "all 0.25s",
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.boxShadow = "0 14px 40px rgba(37,99,235,0.55), inset 0 1px 0 rgba(255,255,255,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "0 8px 32px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.1)")}
              >
                {t(copy.hero.cta1, lang)}
                <ArrowRight size={16} />
              </a>
              <a href="#products" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: 15,
                fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                padding: "14px 24px", borderRadius: 12,
                transition: "all 0.25s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)", e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)", e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
              >
                {t(copy.hero.cta2, lang)}
                <ChevronDown size={16} />
              </a>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 32, marginTop: 52, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              {[
                { val: "10K+", label: t(copy.hero.stat1, lang) },
                { val: "200+", label: t(copy.hero.stat2, lang) },
                { val: "99.9%", label: t(copy.hero.stat3, lang) },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 26, color: "#fff", letterSpacing: "-0.03em" }}>{s.val}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right – mock dashboard cards */}
          <div style={{
            position: "relative", height: 480,
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(24px)",
            transition: "all 1.1s cubic-bezier(.16,1,.3,1) 0.15s",
          }} className="hero-visual">
            {/* Main card */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 320, background: "rgba(10,20,44,0.9)",
              border: "1px solid rgba(37,99,235,0.25)",
              borderRadius: 20, padding: "22px",
              backdropFilter: "blur(20px)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(37,99,235,0.1)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {lang === "id" ? "Kehadiran Hari Ini" : "Today's Attendance"}
                  </div>
                  <div style={{ color: "#fff", fontSize: 28, fontFamily: "'Sora', sans-serif", fontWeight: 700, letterSpacing: "-0.03em", marginTop: 2 }}>247 / 260</div>
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ClipboardCheck size={22} color="#60a5fa" />
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 100, height: 6, marginBottom: 16 }}>
                <div style={{ width: "95%", height: "100%", borderRadius: 100, background: "linear-gradient(90deg, #2563EB, #60a5fa)" }} />
              </div>
              {/* Mini list */}
              {[
                { name: "Ahmad R.", dept: lang === "id" ? "Lapangan" : "Field", time: "07:52", on: true },
                { name: "Siti M.", dept: lang === "id" ? "Kantor" : "Office", time: "08:01", on: true },
                { name: "Budi S.", dept: lang === "id" ? "Lapangan" : "Field", time: "—", on: false },
              ].map((e) => (
                <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 9,
                    background: e.on ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: e.on ? "#93c5fd" : "rgba(255,255,255,0.3)",
                    fontFamily: "'Sora', sans-serif", fontWeight: 700,
                  }}>
                    {e.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{e.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{e.dept}</div>
                  </div>
                  <div style={{
                    fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                    color: e.on ? "#4ade80" : "rgba(255,255,255,0.2)",
                    background: e.on ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)",
                    padding: "2px 8px", borderRadius: 6,
                  }}>{e.time}</div>
                </div>
              ))}
            </div>

            {/* Payroll floating card */}
            <div style={{
              position: "absolute", top: 30, right: -10,
              width: 188,
              background: "rgba(10,20,44,0.95)",
              border: "1px solid rgba(37,99,235,0.2)",
              borderRadius: 16, padding: "16px",
              backdropFilter: "blur(16px)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
              animation: "floatA 4s ease-in-out infinite",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <DollarSign size={14} color="#60a5fa" />
                </div>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {lang === "id" ? "Penggajian" : "Payroll"}
                </span>
              </div>
              <div style={{ color: "#fff", fontSize: 19, fontFamily: "'Sora', sans-serif", fontWeight: 700, letterSpacing: "-0.03em" }}>Rp 485M</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                {lang === "id" ? "Total bulan ini" : "This month total"}
              </div>
              <div style={{ marginTop: 12, padding: "6px 10px", background: "rgba(74,222,128,0.1)", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={12} color="#4ade80" />
                <span style={{ color: "#4ade80", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                  {lang === "id" ? "260 slip terkirim" : "260 slips sent"}
                </span>
              </div>
            </div>

            {/* GPS ping floating */}
            <div style={{
              position: "absolute", bottom: 60, left: -20,
              width: 170,
              background: "rgba(10,20,44,0.95)",
              border: "1px solid rgba(37,99,235,0.2)",
              borderRadius: 16, padding: "14px 16px",
              backdropFilter: "blur(16px)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
              animation: "floatB 5s ease-in-out infinite",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                  GPS Check-in
                </span>
              </div>
              <div style={{ color: "#fff", fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Site Proyek A</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>-6.2088, 106.8456</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Products ────────────────────────────────
function ProductsSection({ lang }: { lang: Lang }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  const [active, setActive] = useState<"att" | "pay">("att");

  const prod = {
    att: copy.products.att,
    pay: copy.products.pay,
  }[active];

  return (
    <section ref={ref} id="products" style={{ padding: "120px 0", background: "#030c1c", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent)",
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 64, opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)", transition: "all 0.8s cubic-bezier(.16,1,.3,1)" }}>
          <SectionBadge>{t(copy.products.badge, lang)}</SectionBadge>
          <h2 style={sectionTitle}>{t(copy.products.title, lang)}</h2>
          <p style={sectionSub}>{t(copy.products.sub, lang)}</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 48, gap: 8, opacity: inView ? 1 : 0, transition: "all 0.8s 0.1s cubic-bezier(.16,1,.3,1)" }}>
          {(["att", "pay"] as const).map((k) => (
            <button key={k} onClick={() => setActive(k)} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 22px", borderRadius: 11, border: "none", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14,
              transition: "all 0.25s",
              background: active === k ? "linear-gradient(135deg, #2563EB, #1d4ed8)" : "rgba(255,255,255,0.05)",
              color: active === k ? "#fff" : "rgba(255,255,255,0.45)",
              boxShadow: active === k ? "0 4px 20px rgba(37,99,235,0.35)" : "none",
            }}>
              {k === "att" ? <ClipboardCheck size={15} /> : <DollarSign size={15} />}
              {k === "att" ? t(copy.products.att.label, lang) : t(copy.products.pay.label, lang)}
            </button>
          ))}
        </div>

        {/* Product detail */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center",
          opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)",
          transition: "all 0.8s 0.2s cubic-bezier(.16,1,.3,1)",
        }} className="product-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 15,
                background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {active === "att" ? <ClipboardCheck size={24} color="#60a5fa" /> : <DollarSign size={24} color="#60a5fa" />}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {t(prod.label, lang)}
              </div>
            </div>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 32, color: "#fff", letterSpacing: "-0.03em", margin: "0 0 16px", lineHeight: 1.2 }}>
              {t(prod.title, lang)}
            </h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif", marginBottom: 32 }}>
              {t(prod.desc, lang)}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {tArr(prod.points, lang).map((pt) => (
                <li key={pt} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle2 size={16} color="#3b82f6" />
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual panel */}
          <div style={{
            background: "rgba(8,16,36,0.8)",
            border: "1px solid rgba(37,99,235,0.2)",
            borderRadius: 20, padding: 28,
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          }}>
            {active === "att" ? <AttendanceMockup lang={lang} /> : <PayrollMockup lang={lang} />}
          </div>
        </div>

        {/* Multi-product note */}
        <div style={{
          marginTop: 64, padding: "20px 28px",
          background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)",
          borderRadius: 14, display: "flex", alignItems: "center", gap: 14,
          opacity: inView ? 1 : 0, transition: "all 0.8s 0.35s cubic-bezier(.16,1,.3,1)",
        }}>
          <Layers size={20} color="#60a5fa" style={{ flexShrink: 0 }} />
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
            {t(copy.products.more, lang)}
          </p>
        </div>
      </div>
    </section>
  );
}

function AttendanceMockup({ lang }: { lang: Lang }) {
  const days = lang === "id"
    ? ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const vals = [94, 98, 91, 96, 88, 72];
  return (
    <div>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
        {lang === "id" ? "Kehadiran Minggu Ini" : "This Week Attendance"}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 120, marginBottom: 20 }}>
        {days.map((d, i) => (
          <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", borderRadius: 6, background: "linear-gradient(180deg, #2563EB, #1d4ed8)", height: `${vals[i]}%`, transition: "height 0.6s cubic-bezier(.16,1,.3,1)" }} />
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: lang === "id" ? "Hadir" : "Present", val: "247", color: "#4ade80" },
          { label: lang === "id" ? "Izin/Cuti" : "Leave", val: "8", color: "#fbbf24" },
          { label: lang === "id" ? "Terlambat" : "Late", val: "5", color: "#f87171" },
          { label: lang === "id" ? "Lokasi Terverif." : "GPS Verified", val: "100%", color: "#60a5fa" },
        ].map((m) => (
          <div key={m.label} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
            <div style={{ color: m.color, fontSize: 18, fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>{m.val}</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PayrollMockup({ lang }: { lang: Lang }) {
  const items = lang === "id"
    ? [
        { name: "Ahmad Rizki", role: "Operator Lapangan", amount: "Rp 4.800.000", status: "Terkirim" },
        { name: "Siti Marlina", role: "Staff Admin", amount: "Rp 5.200.000", status: "Terkirim" },
        { name: "Budi Santoso", role: "Supervisor", amount: "Rp 7.500.000", status: "Proses" },
      ]
    : [
        { name: "Ahmad Rizki", role: "Field Operator", amount: "Rp 4,800,000", status: "Sent" },
        { name: "Siti Marlina", role: "Admin Staff", amount: "Rp 5,200,000", status: "Sent" },
        { name: "Budi Santoso", role: "Supervisor", amount: "Rp 7,500,000", status: "Processing" },
      ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {lang === "id" ? "Total Penggajian" : "Total Payroll"}
          </div>
          <div style={{ color: "#fff", fontSize: 24, fontFamily: "'Sora', sans-serif", fontWeight: 700, letterSpacing: "-0.03em" }}>Rp 485.000.000</div>
        </div>
        <div style={{ padding: "6px 12px", background: "rgba(74,222,128,0.1)", borderRadius: 8 }}>
          <span style={{ color: "#4ade80", fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
            {lang === "id" ? "260 Karyawan" : "260 Employees"}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((e) => (
          <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 11 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "rgba(37,99,235,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: "#93c5fd", fontFamily: "'Sora', sans-serif", fontWeight: 700,
            }}>{e.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{e.name}</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{e.role}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#fff", fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{e.amount}</div>
              <div style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 5,
                background: e.status === "Terkirim" || e.status === "Sent" ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)",
                color: e.status === "Terkirim" || e.status === "Sent" ? "#4ade80" : "#fbbf24",
              }}>{e.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Services ────────────────────────────────
function ServicesSection({ lang }: { lang: Lang }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);

  return (
    <section ref={ref} id="services" style={{ padding: "120px 0", background: "#020818" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 64, opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)", transition: "all 0.8s cubic-bezier(.16,1,.3,1)" }}>
          <SectionBadge>{t(copy.services.badge, lang)}</SectionBadge>
          <h2 style={sectionTitle}>{t(copy.services.title, lang)}</h2>
          <p style={sectionSub}>{t(copy.services.sub, lang)}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="services-grid">
          {copy.services.items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} style={{
                padding: "32px 28px",
                background: "rgba(8,16,36,0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 20,
                transition: "all 0.35s cubic-bezier(.16,1,.3,1)",
                cursor: "default",
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(24px)",
                transitionDelay: `${i * 0.1}s`,
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.border = "1px solid rgba(37,99,235,0.3)";
                  e.currentTarget.style.background = "rgba(37,99,235,0.06)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)";
                  e.currentTarget.style.background = "rgba(8,16,36,0.6)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 15,
                  background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 22,
                }}>
                  <Icon size={22} color="#60a5fa" />
                </div>
                <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
                  {t(item.title, lang)}
                </h3>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                  {t(item.desc, lang)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Why ─────────────────────────────────────
function WhySection({ lang }: { lang: Lang }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);

  return (
    <section ref={ref} id="why" style={{ padding: "120px 0", background: "#030c1c", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(37,99,235,0.3), transparent)" }} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 64, opacity: inView ? 1 : 0, transition: "all 0.8s cubic-bezier(.16,1,.3,1)" }}>
          <SectionBadge>{t(copy.why.badge, lang)}</SectionBadge>
          <h2 style={sectionTitle}>{t(copy.why.title, lang)}</h2>
          <p style={sectionSub}>{t(copy.why.sub, lang)}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="why-grid">
          {copy.why.items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} style={{
                padding: "28px",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(5,12,28,0.5)",
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.7s ${i * 0.08}s cubic-bezier(.16,1,.3,1)`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: "rgba(37,99,235,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16,
                }}>
                  <Icon size={18} color="#60a5fa" />
                </div>
                <h4 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
                  {t(item.title, lang)}
                </h4>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                  {t(item.desc, lang)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Delivery Model ──────────────────────────
function ModelSection({ lang }: { lang: Lang }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);

  const models = [
    { key: "saas", data: copy.model.saas, highlight: false },
    { key: "custom", data: copy.model.custom, highlight: true },
    { key: "hybrid", data: copy.model.hybrid, highlight: false },
  ] as const;

  return (
    <section ref={ref} id="model" style={{ padding: "120px 0", background: "#020818" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 64, opacity: inView ? 1 : 0, transition: "all 0.8s cubic-bezier(.16,1,.3,1)" }}>
          <SectionBadge>{t(copy.model.badge, lang)}</SectionBadge>
          <h2 style={sectionTitle}>{t(copy.model.title, lang)}</h2>
          <p style={sectionSub}>{t(copy.model.sub, lang)}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "start" }} className="model-grid">
          {models.map(({ key, data, highlight }, i) => (
            <div key={key} style={{
              padding: "32px 28px",
              borderRadius: 20,
              border: highlight ? "1px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.07)",
              background: highlight ? "rgba(37,99,235,0.08)" : "rgba(8,16,36,0.5)",
              boxShadow: highlight ? "0 0 60px rgba(37,99,235,0.12), inset 0 1px 0 rgba(255,255,255,0.05)" : "none",
              position: "relative",
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(24px)",
              transition: `all 0.8s ${i * 0.1}s cubic-bezier(.16,1,.3,1)`,
            }}>
              {highlight && (
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
                  borderRadius: 100, padding: "4px 14px",
                  fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                  color: "#fff", letterSpacing: "0.07em", textTransform: "uppercase",
                  boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
                }}>
                  {lang === "id" ? "Paling Fleksibel" : "Most Flexible"}
                </div>
              )}
              <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
                {t(data.name, lang)}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", marginBottom: 24 }}>
                {t(data.desc, lang)}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {tArr(data.points, lang).map((pt) => (
                  <li key={pt} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle2 size={14} color={highlight ? "#60a5fa" : "#3b82f6"} />
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ───────────────────────────────
function CTASection({ lang }: { lang: Lang }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);

  return (
    <section ref={ref} id="consult" style={{ padding: "120px 0", background: "#030c1c", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 700, height: 400, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(37,99,235,0.18) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(32px)", transition: "all 0.9s cubic-bezier(.16,1,.3,1)" }}>
          <SectionBadge>{lang === "id" ? "Siap Mulai?" : "Ready to Start?"}</SectionBadge>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 46px)", color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.15, margin: "0 0 20px" }}>
            {t(copy.cta.title, lang)}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 17, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", marginBottom: 44 }}>
            {t(copy.cta.sub, lang)}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="https://wa.me/6282117049501" target="_blank" rel="noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, #2563EB, #1e40af)",
              color: "#fff", textDecoration: "none", fontSize: 15,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              padding: "15px 32px", borderRadius: 13,
              boxShadow: "0 8px 32px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
              transition: "all 0.25s",
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.boxShadow = "0 14px 40px rgba(37,99,235,0.6), inset 0 1px 0 rgba(255,255,255,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "0 8px 32px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.1)")}
            >
              <Phone size={16} />
              {t(copy.cta.btn1, lang)}
            </a>
            <a href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 15,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              padding: "15px 24px", borderRadius: 13,
              transition: "all 0.25s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)", e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)", e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
            >
              <LogIn size={15} />
              {t(copy.cta.btn2, lang)}
            </a>
            <a href={EMPLOYEE_LOGIN_URL} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: 15,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              padding: "15px 24px", borderRadius: 13,
              transition: "all 0.25s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)", e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)", e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            >
              <ExternalLink size={15} />
              {t(copy.cta.btn3, lang)}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────
function Footer({ lang }: { lang: Lang }) {
  return (
    <footer style={{
      background: "#020818", borderTop: "1px solid rgba(255,255,255,0.05)",
      padding: "56px 0 32px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }} className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <img src={BRAND_ICON} alt="Corextor" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", letterSpacing: "-0.02em" }}>Corextor</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", maxWidth: 260 }}>
              {t(copy.footer.tagline, lang)}
            </p>
          </div>

          {[
            {
              title: t(copy.footer.products, lang),
              links: [
                { label: lang === "id" ? "Absensi" : "Attendance", href: "#" },
                { label: lang === "id" ? "Penggajian" : "Payroll", href: "#" },
              ],
            },
            {
              title: t(copy.footer.services, lang),
              links: [
                { label: lang === "id" ? "Website Korporat" : "Corporate Website", href: "#" },
                { label: "Custom Dashboard", href: "#" },
                { label: lang === "id" ? "Sistem Terintegrasi" : "Integrated Systems", href: "#" },
              ],
            },
            {
              title: t(copy.footer.company, lang),
              links: [
                { label: lang === "id" ? "Tentang Kami" : "About Us", href: "#" },
                { label: "Login Admin", href: "/login" },
                { label: lang === "id" ? "Login Karyawan" : "Employee Login", href: EMPLOYEE_LOGIN_URL },
                { label: lang === "id" ? "Konsultasi" : "Consult", href: "#consult" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                {col.title}
              </div>
              {col.links.map((link) => (
                <a key={link.label} href={link.href} style={{
                  display: "block", color: "rgba(255,255,255,0.35)", textDecoration: "none",
                  fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginBottom: 8,
                  transition: "color 0.2s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
                >{link.label}</a>
              ))}
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
            © {new Date().getFullYear()} Corextor. {t(copy.footer.rights, lang)}
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            {["Privacy", "Terms"].map((l) => (
              <a key={l} href="#" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none", fontSize: 12, fontFamily: "'DM Sans', sans-serif", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
              >{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Shared micro-components ─────────────────
function SectionBadge({ children }: { children: ReactNode }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)",
      borderRadius: 100, padding: "5px 14px", marginBottom: 20,
    }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#60a5fa" }} />
      <span style={{ color: "#93c5fd", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {children}
      </span>
    </div>
  );
}

const sectionTitle: CSSProperties = {
  fontFamily: "'Sora', sans-serif", fontWeight: 800,
  fontSize: "clamp(28px, 3.5vw, 44px)", color: "#fff",
  letterSpacing: "-0.04em", lineHeight: 1.15,
  margin: "0 0 16px",
};

const sectionSub: CSSProperties = {
  color: "rgba(255,255,255,0.45)", fontSize: 16, lineHeight: 1.75,
  fontFamily: "'DM Sans', sans-serif", maxWidth: 560,
  margin: "0 auto",
};

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export function LandingPage() {
  const [lang, setLang] = useState<Lang>("id");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #020818; color: #fff; -webkit-font-smoothing: antialiased; }
        @keyframes floatA {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @media (max-width: 900px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: block !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-visual { display: none; }
          .product-grid { grid-template-columns: 1fr !important; }
          .services-grid { grid-template-columns: 1fr !important; }
          .why-grid { grid-template-columns: 1fr 1fr !important; }
          .model-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .why-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
        .nav-mobile-btn { display: none; }
        .nav-mobile-menu { display: block; }
      `}</style>

      <Navbar lang={lang} setLang={setLang} />
      <main>
        <HeroSection lang={lang} />
        <ProductsSection lang={lang} />
        <ServicesSection lang={lang} />
        <WhySection lang={lang} />
        <ModelSection lang={lang} />
        <CTASection lang={lang} />
      </main>
      <Footer lang={lang} />
    </>
  );
}

export default LandingPage;
