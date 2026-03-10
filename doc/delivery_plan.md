# Corextor Delivery Plan

> Dokumen ini memecah implementasi menjadi sprint yang berurutan dan punya keluaran jelas. File ini bukan dokumen keputusan arsitektur; file ini adalah rencana eksekusi.
>
> Untuk breakdown teknis operasional per sprint, lanjutkan ke [`sprint_checklists.md`](./sprint_checklists.md).

**Version:** 3.0.0  
**Last updated:** March 10, 2026

---

## 1. Planning Rules

- setiap sprint harus menghasilkan increment yang bisa diuji
- tidak boleh ada fitur phase 2/3 masuk sebelum MVP core selesai
- urutan sprint mengikuti dependency teknis, bukan keinginan UI semata
- jika suatu sprint belum memenuhi exit criteria, sprint berikutnya tidak boleh dimulai

---

## 2. Sprint Sequence

| Sprint | Theme | Outcome |
|--------|-------|---------|
| Sprint 1 | Platform foundation | backend skeleton, multi-db wiring, shared conventions |
| Sprint 2 | Auth and SSO | email login, refresh, logout, session model, tenant bootstrap |
| Sprint 3 | Platform admin and commerce | company management, products, subscriptions, invoices |
| Sprint 4 | Attendance admin setup | branches, attendance users, PIN lifecycle |
| Sprint 5 | Attendance operations | check-in/out, history, report, correction |
| Sprint 6 | Hardening and launch readiness | security, QA, UAT, deployment readiness |

---

## 3. Sprint 1 - Platform Foundation

### Goal

Menyiapkan fondasi backend dan frontend yang menjadi base untuk semua sprint berikutnya.

### Backend Deliverables

- bootstrap `api/`
- modular monolith structure
- route separation:
  - `platform`
  - `attendance`
- multi-database connection config:
  - platform
  - attendance
- standard API response format
- base exception handling
- audit logging abstraction
- `audit_logs` migration in platform DB

### Frontend Deliverables

- bootstrap `web/`
- environment strategy untuk `api.corextor.com`
- API client foundation
- route shell untuk login, admin, employee

### Exit Criteria

- backend startable
- frontend startable
- health-check route tersedia
- multi-db config tervalidasi

---

## 4. Sprint 2 - Auth and SSO

### Goal

Menyelesaikan auth platform lintas subdomain sebelum fitur bisnis lain dibangun.

### Backend Deliverables

- `users`
- `companies`
- `company_memberships`
- `refresh_sessions`
- email login endpoint
- refresh endpoint
- global logout endpoint
- access token issuance
- refresh cookie strategy
- role resolution logic
- current company resolution using company membership

### Frontend Deliverables

- login page
- refresh-on-bootstrap
- protected route shell
- logout flow
- access denied state

### Exit Criteria

- user bisa login via email
- session bisa dipulihkan lewat refresh
- logout mematikan session global
- company membership resolution berjalan terhadap `companies`
- frontend tidak memakai `localStorage` untuk access token

---

## 5. Sprint 3 - Platform Admin and Commerce

### Goal

Membangun control plane platform dan visibility super admin.

### Backend Deliverables

- `products`
- `plans`
- `bundles`
- `company_subscriptions`
- `subscription_items`
- `invoices`
- super admin endpoints:
  - companies
  - company admins
  - subscriptions
  - invoices

### Frontend Deliverables

- super admin shell
- company list
- company detail summary
- product subscription summary
- invoice list

### Exit Criteria

- super admin dapat membuat company
- super admin dapat menambahkan product subscription ke company
- company admin dapat melihat subscription dan invoice company sendiri

---

## 6. Sprint 4 - Attendance Admin Setup

### Goal

Membangun semua fondasi admin untuk memakai product Attendance.

### Backend Deliverables

- `branches`
- `attendance_users`
- attendance entitlement guard
- attendance PIN login
- attendance user CRUD
- branch CRUD
- reset PIN

### Frontend Deliverables

- attendance admin layout
- branch management UI
- attendance user management UI
- PIN reset UI

### Exit Criteria

- company dengan subscription attendance bisa membuat branch
- company admin bisa membuat attendance user
- employee dapat login ke attendance via PIN
- employee tanpa attendance profile ditolak

---

## 7. Sprint 5 - Attendance Operations

### Goal

Menyelesaikan use case inti yang memberi nilai bisnis langsung.

### Backend Deliverables

- check-in
- check-out
- history
- company attendance report
- attendance correction
- attendance-scoped log query

### Frontend Deliverables

- employee check-in/out page
- employee history page
- company report page
- attendance correction UI

### Exit Criteria

- employee dapat check-in dan check-out
- company admin dapat melihat report company
- correction flow tercatat di audit
- semua query attendance tervalidasi scoped by company

---

## 8. Sprint 6 - Hardening and Launch Readiness

### Goal

Menutup gap kualitas sebelum MVP dinyatakan siap uji dan siap deploy.

### Deliverables

- security review
- rate limiting verification
- permission audit
- test coverage untuk critical flows
- seed and demo data
- deployment checklist
- rollback checklist
- UAT issue fixes

### Exit Criteria

- critical auth and attendance flows punya automated tests
- deployment path terdokumentasi
- no blocker on login, subscription guard, attendance operations

---

## 9. Sprint Dependencies

### Hard Dependencies

- Sprint 2 bergantung pada Sprint 1
- Sprint 3 bergantung pada Sprint 2
- Sprint 4 bergantung pada Sprint 2 dan Sprint 3
- Sprint 5 bergantung pada Sprint 4
- Sprint 6 bergantung pada Sprint 5

### Why

- attendance module tidak masuk akal dibangun sebelum auth, membership, dan subscription guard ada
- admin views tidak berguna sebelum control plane platform siap

---

## 10. After MVP

Setelah sprint 6 selesai, phase berikutnya diambil dari [`backlog.md`](./backlog.md) dengan urutan:

1. Attendance phase 2
2. Attendance phase 3
3. future product onboarding
