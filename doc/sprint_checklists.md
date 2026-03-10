# Corextor Sprint Checklists

> Dokumen ini menurunkan `delivery_plan.md` menjadi checklist teknis yang siap dipakai saat eksekusi sprint. Dokumen ini bukan source of truth arsitektur; dokumen ini adalah work breakdown operasional.

**Version:** 3.1.0  
**Last updated:** March 10, 2026

---

## 1. How to Use This Document

- gunakan file ini setelah membaca [`delivery_plan.md`](./delivery_plan.md)
- checklist di bawah bersifat operasional, bukan keputusan arsitektur baru
- jika ada konflik dengan spesifikasi, ikuti:
  - [`implementation_scope.md`](./implementation_scope.md)
  - [`database.md`](./database.md)
  - [`api_spec.md`](./api_spec.md)

---

## 2. Sprint 1 - Platform Foundation ✅

### Backend

- [x] bootstrap codebase `api/`
- [x] siapkan struktur modular monolith untuk `Platform` dan `Attendance`
- [x] pisahkan route file `platform.php` dan `attendance.php`
- [x] buat standard API response helper
- [x] buat base exception handler untuk API JSON
- [x] siapkan logging abstraction untuk audit event
- [x] tambahkan health-check endpoint

### Frontend

- [ ] bootstrap `web/` _(deferred — backend-first approach)_
- [ ] siapkan env config ke `api.corextor.com`
- [ ] buat axios client base dengan `withCredentials`
- [ ] buat route shell untuk `login`, `admin`, `employee`
- [ ] siapkan layout placeholder untuk authenticated area

### Database

- [x] siapkan koneksi database `platform`
- [x] siapkan koneksi database `attendance`
- [x] buat migration `audit_logs` di platform DB
- [x] verifikasi strategy migration folder per database
- [x] tentukan naming convention migration lintas module

### QA

- [x] verifikasi backend startable
- [ ] verifikasi frontend startable _(deferred)_
- [x] verifikasi environment lokal bisa connect ke dua database
- [x] verifikasi health-check response konsisten
- [x] verifikasi audit abstraction dapat menulis ke `audit_logs`

### Release / Ops

- [x] siapkan template `.env.example`
- [x] dokumentasikan variable environment minimum
- [x] tentukan strategy config untuk local, staging, production

---

## 3. Sprint 2 - Auth and SSO ✅

### Backend

- [x] migration `users`
- [x] migration `companies`
- [x] migration `company_memberships`
- [x] migration `refresh_sessions`
- [x] implement email login endpoint
- [x] implement refresh endpoint
- [x] implement global logout endpoint
- [x] implement access token issuer
- [x] implement refresh cookie writer/clearer
- [x] implement effective role resolver
- [x] implement current company resolver

### Frontend

- [ ] buat login page email flow _(deferred — backend-first approach)_
- [ ] buat bootstrap refresh flow saat app load
- [ ] buat auth context dengan access token in-memory
- [ ] buat protected route guard
- [ ] buat logout flow
- [ ] buat state untuk unauthorized / access denied

### Database

- [x] pastikan `companies.code` unique
- [x] pastikan index email unique
- [x] pastikan `(company_id, user_id)` unique di memberships
- [x] pastikan refresh session dapat dicabut tanpa hapus record historis

### QA

- [x] test login sukses
- [x] test login gagal
- [x] test refresh sukses
- [x] test refresh session expired
- [x] test logout global
- [ ] test access token tidak pernah disimpan di `localStorage` _(frontend)_

### Release / Ops

- [x] siapkan seed minimal demo company untuk auth dan membership test
- [x] pastikan cookie config aman untuk subdomain
- [ ] review CORS whitelist Corextor domains _(deferred ke Sprint 6)_
- [x] review secure cookie requirement pada staging/production

---

## 4. Sprint 3 - Platform Admin and Commerce ✅

### Backend

- [x] migration `products`
- [x] migration `plans`
- [x] migration `bundles`
- [x] migration `bundle_items`
- [x] migration `company_subscriptions`
- [x] migration `subscription_items`
- [x] migration `invoices`
- [x] migration `invoice_items`
- [x] implement endpoint companies list/create/detail
- [x] implement endpoint company admins summary
- [x] implement endpoint company subscriptions
- [x] implement endpoint add subscription to company
- [x] implement endpoint products/plans/bundles list
- [x] implement endpoint invoices list

### Frontend

- [ ] buat shell super admin _(deferred — backend-first approach)_
- [ ] buat company list page
- [ ] buat company detail page
- [ ] buat subscription summary view
- [ ] buat invoice list view
- [ ] buat company admin summary panel

### Database

- [x] pastikan `products.code` unique
- [x] pastikan `plans.code` unique
- [x] pastikan invoice number unique
- [x] pastikan subscription model bisa represent single product dan bundle

### QA

- [x] test super admin create company
- [x] test add product subscription ke company
- [x] test company admin hanya bisa lihat invoice/subscription own company
- [x] test inactive subscription tidak dihitung sebagai active product

### Release / Ops

- [x] siapkan seed product catalog minimum
- [x] siapkan seed attendance plan minimum
- [x] siapkan demo company + demo subscription

---

## 5. Sprint 4 - Attendance Admin Setup ✅

### Backend

- [x] migration `branches`
- [x] migration `attendance_users`
- [x] implement attendance entitlement guard
- [x] implement attendance PIN login endpoint
- [x] implement branch CRUD endpoints
- [x] implement attendance user list/create/update/delete
- [x] implement attendance PIN reset
- [x] implement platform user linking dari attendance user flow

### Frontend

- [ ] buat attendance admin layout _(deferred — backend-first approach)_
- [ ] buat branch management page
- [ ] buat attendance user management page
- [ ] buat PIN reset action UI
- [ ] buat login page dengan tab email dan PIN

### Database

- [x] pastikan `(company_id, platform_user_id)` unique pada `attendance_users`
- [x] pastikan `(company_id, pin_lookup)` unique
- [x] pastikan `branches` selalu scoped by `company_id`

### QA

- [x] test PIN login sukses
- [x] test PIN login gagal
- [ ] test rate limit PIN login _(Sprint 6)_
- [x] test employee tanpa `attendance_user` ditolak
- [x] test company tanpa subscription attendance ditolak
- [x] test branch CRUD own company only

### Release / Ops

- [x] siapkan seed branch demo
- [x] siapkan seed attendance user demo
- [ ] dokumentasikan flow reset PIN untuk support/admin _(Sprint 6)_

---

## 6. Sprint 5 - Attendance Operations ✅

### Backend

- [x] migration `attendance_records`
- [x] implement check-in endpoint
- [x] implement check-out endpoint
- [x] implement history endpoint
- [x] implement company report endpoint
- [x] implement attendance correction endpoint
- [x] implement attendance log query dengan source audit log pusat

### Frontend

- [ ] buat employee check-in/out page _(deferred — backend-first approach)_
- [ ] buat employee history page
- [ ] buat admin attendance report page
- [ ] buat attendance correction UI
- [ ] buat empty state dan error state untuk attendance pages

### Database

- [x] pastikan `(attendance_user_id, date)` unique
- [x] pastikan index report query `(company_id, branch_id, date)` tersedia
- [x] pastikan `platform_user_id` index cukup untuk history lookup

### QA

- [x] test check-in normal
- [x] test duplicate check-in conflict
- [x] test check-out tanpa check-in
- [x] test history hanya menampilkan data company sendiri
- [x] test report company scoped benar
- [x] test correction tercatat di audit log

### Release / Ops

- [ ] siapkan demo scenario untuk UAT _(Sprint 6)_
- [ ] siapkan checklist smoke test attendance harian _(Sprint 6)_

---

## 7. Sprint 6 - Hardening and Launch Readiness ✅

### Backend

- [x] review semua guard auth, role, entitlement, profile
- [x] audit standardized error responses
- [x] audit rate limiting endpoints (login: 5/min, pin: 10/min, api: 60/min)
- [x] rapikan seed data dan demo fixtures (DatabaseSeeder → Platform + Attendance)
- [x] tambahkan automated tests untuk critical flows (17 tests, 42 assertions)

### Frontend

- [ ] review unauthorized states _(deferred ke frontend phase)_
- [ ] review refresh failure handling
- [ ] review logout handling
- [ ] review loading, empty, and error states
- [ ] review responsive layout untuk admin dan employee

### Database

- [x] review index yang benar-benar dipakai query utama
- [x] review migration order dan repeatability (fresh + seed verified clean)
- [x] review data consistency antar platform DB dan attendance DB

### QA

- [x] test full login to attendance flow (automated via AttendanceFlowTest)
- [x] test suspended subscription (entitlement guard verified)
- [x] test revoked refresh session (logout test verified)
- [x] test employee without product profile (403 verified)
- [x] test admin cross-company denial (role guard verified)
- [ ] test global logout antar subdomain _(requires frontend)_

### Release / Ops

- [x] siapkan deployment checklist (doc/deployment.md)
- [x] siapkan rollback checklist (doc/deployment.md)
- [x] siapkan env checklist production (doc/deployment.md)
- [x] siapkan monitoring minimum (doc/deployment.md)
- [x] siapkan post-deploy smoke test (doc/deployment.md)


---

## 8. Cross-Sprint Watch Items

- [x] jangan bangun feature phase 2 sebelum sprint 1-6 selesai
- [x] jangan tambahkan schema baru ke `database.md` tanpa alasan sprint yang jelas
- [x] jangan tambahkan endpoint baru ke `api_spec.md` jika belum masuk sprint aktif
- [ ] semua perubahan auth harus diuji ulang terhadap SSO lintas subdomain
- [x] semua perubahan attendance harus diuji ulang terhadap entitlement company
