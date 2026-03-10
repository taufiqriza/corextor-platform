# Corextor Platform — AI Agent Instructions

> File ini berisi instruksi untuk AI coding agent yang bekerja pada project Corextor.

---

## Quick Context

Baca `CONTEXT.md` di root `/corextor-platform/` sebelum melakukan apapun. File itu berisi ringkasan
arsitektur, tech stack, dan keputusan desain. Cukup baca file itu untuk memahami project.

Untuk detail lengkap, lihat folder `doc/`. Urutan prioritas dokumen:
1. `doc/implementation_scope.md` — keputusan final, jangan dilanggar
2. `doc/platform_architecture.md` — arsitektur platform
3. `doc/database.md` — schema
4. `doc/api_spec.md` — kontrak API

---

## Rules for AI Agents

### Architecture Rules

- backend adalah **modular monolith** Laravel 11 di `api/`
- frontend adalah **React 18 TSX** di `web/`
- ada **dua database**: `corextor_platform` dan `corextor_attendance`
- **JANGAN** buat foreign key lintas database
- **JANGAN** buat cross-database join
- **JANGAN** simpan access token di localStorage; hanya in-memory
- **JANGAN** implementasi fitur yang belum masuk sprint aktif
- semua API response harus mengikuti format standard di `doc/api_spec.md`

### Namespace Rules

- platform routes: `/platform/v1/...` di `routes/platform.php`
- attendance routes: `/attendance/v1/...` di `routes/attendance.php`
- platform modules: `app/Modules/Platform/`
- attendance modules: `app/Modules/Attendance/`

### Tenant Rules

- semua query product DB wajib filter `company_id`
- `company_id` diambil dari session, **BUKAN** dari request body
- `branch_id` hanya ada di attendance context, bukan platform token
- super admin bypass harus eksplisit dan tercatat di audit

### Auth Rules

- login endpoint: `POST /platform/v1/auth/login/email`
- PIN login: `POST /attendance/v1/auth/login/pin`
- refresh: `POST /platform/v1/auth/refresh` (cookie only)
- access token claims minimal: `sub`, `current_company_id`, `role`, `active_products`, `session_id`

### Database Convention

- platform DB: companies, users, company_memberships, products, plans, bundles,
  company_subscriptions, subscription_items, invoices, invoice_items, refresh_sessions, audit_logs
- attendance DB: branches, attendance_users, attendance_records

### Code Convention

- table names: snake_case plural
- models: PascalCase singular
- services: PascalCase + domain name (e.g. `AttendanceRecordService`)
- controllers: thin — validate, call service, return response
- business logic: in service layer only

### Testing Rules

- semua attendance query harus ditest scoped by `company_id`
- orphan `attendance_user` (tanpa valid platform user) harus fail closed
- suspended subscription harus ditolak di attendance namespace
- PIN lookup tidak boleh match lintas company

---

## Sprint Status

Cek `doc/delivery_plan.md` dan `doc/sprint_checklists.md` untuk mengetahui sprint mana
yang sedang aktif. Jangan kerjakan item dari sprint yang belum dimulai.

---

## When You Need More Detail

| Question | Read This |
|----------|-----------|
| Apa yang sudah diputuskan? | `doc/implementation_scope.md` |
| Bagaimana arsitektur platform? | `doc/platform_architecture.md` |
| Bagaimana attendance dibangun? | `doc/architecture.md` |
| Siapa boleh akses apa? | `doc/roles.md` |
| Bagaimana data diisolasi? | `doc/multi_tenant.md` |
| Bagaimana login bekerja? | `doc/login_flow.md` |
| Schema database? | `doc/database.md` |
| API endpoints? | `doc/api_spec.md` |
| Apa yang belum dikerjakan? | `doc/backlog.md` |
