# Corextor Platform — Project Context

> File ini adalah **satu-satunya file** yang perlu dibaca untuk memahami project ini secara cepat.
> Untuk detail lengkap, ikuti link ke dokumen spesifik di `doc/`.

---

## What Is This

Corextor adalah **platform multi-product** untuk bisnis.

- Brand site: `corextor.com`
- Shared backend: `api.corextor.com`
- Product pertama: **Attendance** di `attendance.corextor.com`

Attendance = sistem absensi karyawan dengan multi-tenant (banyak company dalam satu platform).

---

## Architecture in 30 Seconds

```text
attendance.corextor.com (React SPA)
        |
        | HTTPS + access token
        v
api.corextor.com (Laravel modular monolith)
  ├── /platform/v1/...   → auth, company, subscription, billing, audit
  └── /attendance/v1/... → branches, attendance users, check-in/out, reports
        |
   +----+----+
   |         |
   v         v
corextor_platform DB    corextor_attendance DB
(identity, billing)     (branches, attendance)
```

**Key points:**
- Satu backend, dua database, dua API namespace
- SSO via refresh cookie di `.corextor.com`
- Access token in-memory, bukan localStorage
- Setiap product punya database sendiri
- Tidak ada foreign key lintas database

---

## Roles

| Role | Scope |
|------|-------|
| `super_admin` | Global — manage companies, products, subscriptions, invoices |
| `company_admin` | Satu company — manage branches, users, reports |
| `employee` | Satu company — check-in/out, lihat riwayat sendiri |

**Product access rule:**
- Role saja tidak cukup
- Harus punya: valid membership + active subscription + active product profile

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 12, PHP 8.2+ |
| Frontend | React 18+ TypeScript (TSX) |
| Database | MySQL 8.0 (2 databases) |
| Auth | JWT access token + HttpOnly refresh cookie |
| Hosting | Shared hosting (Hostinger), SSL via Let's Encrypt |

---

## MVP Scope

### In MVP
- Platform: auth/SSO, companies, products, subscriptions, invoices, audit log
- Attendance: branches, attendance users, PIN login, check-in/out, history, report, correction

### NOT in MVP (backlog)
- Geofence, selfie verification, shifts, leave, employee reports, notifications, holiday calendar, export center

---

## Directory Structure

```text
/corextor-platform
├── api/           # Laravel backend (platform + attendance modules)
│   └── app/Modules/
│       ├── Platform/    # Identity, Company, Subscription, Billing, Audit
│       └── Attendance/  # Branches, Users, Records
├── web/           # React frontend for attendance.corextor.com
└── doc/           # All documentation
```

---

## Documentation Map

| Priority | Document | What It Answers |
|:--------:|----------|----------------|
| 1 | `doc/implementation_scope.md` | Apa yang sudah diputuskan dan tidak boleh berubah? |
| 2 | `doc/platform_architecture.md` | Bagaimana platform secara keseluruhan? |
| 3 | `doc/delivery_plan.md` | Sprint mana yang harus dikerjakan dan urutannya? |
| 4 | `doc/sprint_checklists.md` | Apa checklist teknis per sprint? |
| 5 | `doc/architecture.md` | Bagaimana Attendance dibangun di atas platform? |
| 6 | `doc/roles.md` | Siapa boleh akses apa? |
| 7 | `doc/multi_tenant.md` | Bagaimana data diisolasi antar company? |
| 8 | `doc/login_flow.md` | Bagaimana SSO dan PIN login bekerja? |
| 9 | `doc/database.md` | Seperti apa schema database? |
| 10 | `doc/api_spec.md` | Apa kontrak API endpoint? |
| 11 | `doc/backlog.md` | Apa yang ditunda setelah MVP? |

**Conflict resolution:** `implementation_scope.md` > `platform_architecture.md` > `database.md` > `api_spec.md` > sisanya

---

## Key Design Decisions

1. **Modular monolith** — satu codebase, split nanti jika operasional butuh
2. **Dual database** — platform DB + product DB, no cross-DB FK
3. **SSO cookie** — refresh cookie di `.corextor.com`, shared identity
4. **Product entitlement** — company subscription + product profile guard
5. **Fail closed** — jika data lintas DB inconsistent, request ditolak
6. **No hard delete di MVP** — semua pakai status deactivation

---

## Current Status

- [x] Documentation complete
- [ ] Sprint 1: Platform Foundation
- [ ] Sprint 2: Auth and SSO
- [ ] Sprint 3: Platform Admin and Commerce
- [ ] Sprint 4: Attendance Admin Setup
- [ ] Sprint 5: Attendance Operations
- [ ] Sprint 6: Hardening and Launch
