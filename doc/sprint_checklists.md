# Corextor Sprint Checklists

> Dokumen ini menurunkan `delivery_plan.md` menjadi checklist teknis yang siap dipakai saat eksekusi sprint. Dokumen ini bukan source of truth arsitektur; dokumen ini adalah work breakdown operasional.

**Version:** 3.0.0  
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

## 2. Sprint 1 - Platform Foundation

### Backend

- [ ] bootstrap codebase `api/`
- [ ] siapkan struktur modular monolith untuk `Platform` dan `Attendance`
- [ ] pisahkan route file `platform.php` dan `attendance.php`
- [ ] buat standard API response helper
- [ ] buat base exception handler untuk API JSON
- [ ] siapkan logging abstraction untuk audit event
- [ ] tambahkan health-check endpoint

### Frontend

- [ ] bootstrap `web/`
- [ ] siapkan env config ke `api.corextor.com`
- [ ] buat axios client base dengan `withCredentials`
- [ ] buat route shell untuk `login`, `admin`, `employee`
- [ ] siapkan layout placeholder untuk authenticated area

### Database

- [ ] siapkan koneksi database `platform`
- [ ] siapkan koneksi database `attendance`
- [ ] buat migration `audit_logs` di platform DB
- [ ] verifikasi strategy migration folder per database
- [ ] tentukan naming convention migration lintas module

### QA

- [ ] verifikasi backend startable
- [ ] verifikasi frontend startable
- [ ] verifikasi environment lokal bisa connect ke dua database
- [ ] verifikasi health-check response konsisten
- [ ] verifikasi audit abstraction dapat menulis ke `audit_logs`

### Release / Ops

- [ ] siapkan template `.env.example`
- [ ] dokumentasikan variable environment minimum
- [ ] tentukan strategy config untuk local, staging, production

---

## 3. Sprint 2 - Auth and SSO

### Backend

- [ ] migration `users`
- [ ] migration `companies`
- [ ] migration `company_memberships`
- [ ] migration `refresh_sessions`
- [ ] implement email login endpoint
- [ ] implement refresh endpoint
- [ ] implement global logout endpoint
- [ ] implement access token issuer
- [ ] implement refresh cookie writer/clearer
- [ ] implement effective role resolver
- [ ] implement current company resolver

### Frontend

- [ ] buat login page email flow
- [ ] buat bootstrap refresh flow saat app load
- [ ] buat auth context dengan access token in-memory
- [ ] buat protected route guard
- [ ] buat logout flow
- [ ] buat state untuk unauthorized / access denied

### Database

- [ ] pastikan `companies.code` unique
- [ ] pastikan index email unique
- [ ] pastikan `(company_id, user_id)` unique di memberships
- [ ] pastikan refresh session dapat dicabut tanpa hapus record historis

### QA

- [ ] test login sukses
- [ ] test login gagal
- [ ] test refresh sukses
- [ ] test refresh session expired
- [ ] test logout global
- [ ] test access token tidak pernah disimpan di `localStorage`

### Release / Ops

- [ ] siapkan seed minimal demo company untuk auth dan membership test
- [ ] pastikan cookie config aman untuk subdomain
- [ ] review CORS whitelist Corextor domains
- [ ] review secure cookie requirement pada staging/production

---

## 4. Sprint 3 - Platform Admin and Commerce

### Backend

- [ ] migration `products`
- [ ] migration `plans`
- [ ] migration `bundles`
- [ ] migration `bundle_items`
- [ ] migration `company_subscriptions`
- [ ] migration `subscription_items`
- [ ] migration `invoices`
- [ ] migration `invoice_items`
- [ ] implement endpoint companies list/create/detail
- [ ] implement endpoint company admins summary
- [ ] implement endpoint company subscriptions
- [ ] implement endpoint add subscription to company
- [ ] implement endpoint products/plans/bundles list
- [ ] implement endpoint invoices list

### Frontend

- [ ] buat shell super admin
- [ ] buat company list page
- [ ] buat company detail page
- [ ] buat subscription summary view
- [ ] buat invoice list view
- [ ] buat company admin summary panel

### Database

- [ ] pastikan `products.code` unique
- [ ] pastikan `plans.code` unique
- [ ] pastikan invoice number unique
- [ ] pastikan subscription model bisa represent single product dan bundle

### QA

- [ ] test super admin create company
- [ ] test add product subscription ke company
- [ ] test company admin hanya bisa lihat invoice/subscription own company
- [ ] test inactive subscription tidak dihitung sebagai active product

### Release / Ops

- [ ] siapkan seed product catalog minimum
- [ ] siapkan seed attendance plan minimum
- [ ] siapkan demo company + demo subscription

---

## 5. Sprint 4 - Attendance Admin Setup

### Backend

- [ ] migration `branches`
- [ ] migration `attendance_users`
- [ ] implement attendance entitlement guard
- [ ] implement attendance PIN login endpoint
- [ ] implement branch CRUD endpoints
- [ ] implement attendance user list/create/update/delete
- [ ] implement attendance PIN reset
- [ ] implement platform user linking dari attendance user flow

### Frontend

- [ ] buat attendance admin layout
- [ ] buat branch management page
- [ ] buat attendance user management page
- [ ] buat PIN reset action UI
- [ ] buat login page dengan tab email dan PIN

### Database

- [ ] pastikan `(company_id, platform_user_id)` unique pada `attendance_users`
- [ ] pastikan `(company_id, pin_lookup)` unique
- [ ] pastikan `branches` selalu scoped by `company_id`

### QA

- [ ] test PIN login sukses
- [ ] test PIN login gagal
- [ ] test rate limit PIN login
- [ ] test employee tanpa `attendance_user` ditolak
- [ ] test company tanpa subscription attendance ditolak
- [ ] test branch CRUD own company only

### Release / Ops

- [ ] siapkan seed branch demo
- [ ] siapkan seed attendance user demo
- [ ] dokumentasikan flow reset PIN untuk support/admin

---

## 6. Sprint 5 - Attendance Operations

### Backend

- [ ] migration `attendance_records`
- [ ] implement check-in endpoint
- [ ] implement check-out endpoint
- [ ] implement history endpoint
- [ ] implement company report endpoint
- [ ] implement attendance correction endpoint
- [ ] implement attendance log query dengan source audit log pusat

### Frontend

- [ ] buat employee check-in/out page
- [ ] buat employee history page
- [ ] buat admin attendance report page
- [ ] buat attendance correction UI
- [ ] buat empty state dan error state untuk attendance pages

### Database

- [ ] pastikan `(attendance_user_id, date)` unique
- [ ] pastikan index report query `(company_id, branch_id, date)` tersedia
- [ ] pastikan `platform_user_id` index cukup untuk history lookup

### QA

- [ ] test check-in normal
- [ ] test duplicate check-in conflict
- [ ] test check-out tanpa check-in
- [ ] test history hanya menampilkan data company sendiri
- [ ] test report company scoped benar
- [ ] test correction tercatat di audit log

### Release / Ops

- [ ] siapkan demo scenario untuk UAT
- [ ] siapkan checklist smoke test attendance harian

---

## 7. Sprint 6 - Hardening and Launch Readiness

### Backend

- [ ] review semua guard auth, role, entitlement, profile
- [ ] audit standardized error responses
- [ ] audit rate limiting endpoints
- [ ] rapikan seed data dan demo fixtures
- [ ] tambahkan automated tests untuk critical flows

### Frontend

- [ ] review unauthorized states
- [ ] review refresh failure handling
- [ ] review logout handling
- [ ] review loading, empty, and error states
- [ ] review responsive layout untuk admin dan employee

### Database

- [ ] review index yang benar-benar dipakai query utama
- [ ] review migration order dan repeatability
- [ ] review data consistency antar platform DB dan attendance DB

### QA

- [ ] test full login to attendance flow
- [ ] test suspended subscription
- [ ] test revoked refresh session
- [ ] test employee without product profile
- [ ] test admin cross-company denial
- [ ] test global logout antar subdomain

### Release / Ops

- [ ] siapkan deployment checklist
- [ ] siapkan rollback checklist
- [ ] siapkan env checklist production
- [ ] siapkan monitoring minimum
- [ ] siapkan post-deploy smoke test

---

## 8. Cross-Sprint Watch Items

- [ ] jangan bangun feature phase 2 sebelum sprint 1-6 selesai
- [ ] jangan tambahkan schema baru ke `database.md` tanpa alasan sprint yang jelas
- [ ] jangan tambahkan endpoint baru ke `api_spec.md` jika belum masuk sprint aktif
- [ ] semua perubahan auth harus diuji ulang terhadap SSO lintas subdomain
- [ ] semua perubahan attendance harus diuji ulang terhadap entitlement company
