# Corextor Platform and Attendance Database Schema

> Dokumen ini mendefinisikan skema target untuk database platform pusat dan database produk Attendance yang terpisah.

**Version:** 3.0.0  
**Last updated:** March 10, 2026

---

## 1. Database Topology

```text
Database 1: corextor_platform
  -> identity, company, product, subscription, billing, session, audit

Database 2: corextor_attendance
  -> branches, attendance users, attendance records
```

Rule utama:

- platform DB adalah source of truth untuk shared platform capabilities
- attendance DB adalah source of truth untuk attendance domain data
- relasi lintas DB bersifat logical only

---

## 2. Platform Database

### 2.1 `companies`

Purpose:

- tenant utama platform

Core columns:

- `id`
- `name`
- `code`
- `status`
- `created_at`
- `updated_at`

Indexes:

- unique `code`
- index `status`

### 2.2 `users`

Purpose:

- global identity across products

Core columns:

- `id`
- `name`
- `email`
- `password`
- `platform_role` (`super_admin`, `standard`)
- `status`
- `created_at`
- `updated_at`

Indexes:

- unique `email`
- index `status`

### 2.3 `company_memberships`

Purpose:

- hubungan user ke company dan role-nya

Core columns:

- `id`
- `company_id`
- `user_id`
- `role` (`company_admin`, `employee`)
- `status`
- `created_at`
- `updated_at`

Indexes:

- unique `(company_id, user_id)`
- index `(company_id, role, status)`

### 2.4 `products`

Purpose:

- katalog product platform

Core columns:

- `id`
- `code` (`attendance`, `crm`, `payroll`, ...)
- `name`
- `status`
- `app_url`
- `created_at`
- `updated_at`

Indexes:

- unique `code`

### 2.5 `plans`

Purpose:

- pricing per product

Core columns:

- `id`
- `product_id`
- `code`
- `name`
- `billing_cycle`
- `price`
- `currency`
- `status`
- `features_json`

Indexes:

- unique `code`
- index `(product_id, status)`

### 2.6 `bundles`

Purpose:

- commercial bundle for multiple products

Core columns:

- `id`
- `code`
- `name`
- `billing_cycle`
- `price`
- `currency`
- `status`

### 2.7 `bundle_items`

Purpose:

- mapping bundle ke products/plans

Core columns:

- `id`
- `bundle_id`
- `product_id`
- `plan_id`

Indexes:

- unique `(bundle_id, product_id)`

### 2.8 `company_subscriptions`

Purpose:

- status subscription company terhadap product atau bundle

Core columns:

- `id`
- `company_id`
- `product_id` nullable
- `bundle_id` nullable
- `plan_id` nullable
- `status`
- `starts_at`
- `ends_at`
- `trial_ends_at`
- `billing_cycle`
- `created_at`
- `updated_at`

Notes:

- satu row bisa mewakili subscription product tunggal atau bundle
- business policy saat ini bisa mulai dari satu product, tetapi model tetap mendukung banyak row

Indexes:

- index `(company_id, status)`
- index `(company_id, product_id, status)`

### 2.9 `subscription_items`

Purpose:

- daftar product yang efektif aktif karena subscription tertentu

Core columns:

- `id`
- `subscription_id`
- `product_id`
- `plan_id`
- `status`

Indexes:

- unique `(subscription_id, product_id)`

### 2.10 `invoices`

Purpose:

- billing header

Core columns:

- `id`
- `company_id`
- `subscription_id`
- `invoice_number`
- `status`
- `currency`
- `amount_total`
- `issued_at`
- `due_at`
- `paid_at`

Indexes:

- unique `invoice_number`
- index `(company_id, status, issued_at)`

### 2.11 `invoice_items`

Purpose:

- line items per product or bundle

Core columns:

- `id`
- `invoice_id`
- `product_id` nullable
- `bundle_id` nullable
- `description`
- `quantity`
- `unit_price`
- `line_total`

### 2.12 `refresh_sessions`

Purpose:

- persistent refresh session untuk SSO

Core columns:

- `id`
- `user_id`
- `company_id`
- `session_token_hash`
- `ip_address`
- `user_agent`
- `expires_at`
- `revoked_at`
- `created_at`

Indexes:

- index `(user_id, company_id)`
- index `expires_at`

### 2.13 `audit_logs`

Purpose:

- central audit trail lintas platform dan product

Core columns:

- `id`
- `product_code` nullable
- `company_id` nullable
- `user_id` nullable
- `action`
- `details_json`
- `ip_address`
- `user_agent`
- `created_at`

Indexes:

- index `(product_code, company_id, created_at)`
- index `(company_id, created_at)`
- index `action`

---

## 3. Attendance Database

### 3.1 `branches`

Purpose:

- branch data khusus Attendance

Core columns:

- `id`
- `company_id`
- `name`
- `location`
- `status`
- `created_at`
- `updated_at`

Indexes:

- index `(company_id, status)`

### 3.2 `attendance_users`

Purpose:

- attendance-specific user profile

Core columns:

- `id`
- `platform_user_id`
- `company_id`
- `branch_id`
- `pin_hash`
- `pin_lookup`
- `status`
- `created_at`
- `updated_at`

Notes:

- `platform_user_id` mengacu logical ke `corextor_platform.users.id`
- `company_id` mengacu logical ke `corextor_platform.companies.id`
- `status` adalah lifecycle status untuk attendance profile
- MVP tidak memakai kolom `pin_status` terpisah; PIN mengikuti status profile

Indexes:

- unique `(company_id, platform_user_id)`
- unique `(company_id, pin_lookup)`
- index `(company_id, branch_id, status)`

### 3.3 `attendance_records`

Purpose:

- attendance events and daily records

Core columns:

- `id`
- `attendance_user_id`
- `platform_user_id`
- `company_id`
- `branch_id`
- `date`
- `time_in`
- `time_out`
- `status`
- `note`
- `created_at`
- `updated_at`

Indexes:

- unique `(attendance_user_id, date)`
- index `(company_id, branch_id, date)`
- index `(platform_user_id, date)`

---

## 4. Logical Relationships

```text
corextor_platform.users.id
  -> corextor_attendance.attendance_users.platform_user_id

corextor_platform.companies.id
  -> corextor_attendance.branches.company_id
  -> corextor_attendance.attendance_users.company_id
  -> corextor_attendance.attendance_records.company_id
```

Tidak ada foreign key lintas database. Validasi dilakukan di application layer.

---

## 5. Example Creation Flow

### Creating an Attendance Employee

```text
1. Create platform user
2. Create company_membership
3. Create attendance_user profile
4. Assign branch_id
5. Generate pin_hash and pin_lookup
```

### Creating a Company Subscription

```text
1. Company created in platform DB
2. Product catalog checked
3. company_subscriptions row created
4. subscription_items materialized for effective products
5. invoice created only when subscription enters billable period
```

---

## 6. Deferred Attendance Tables

Belum masuk MVP:

- `attendance_settings`
- `shifts`
- `user_schedules`
- `leave_types`
- `leave_requests`
- `leave_balances`
- `holidays`
- `employee_reports`

Semua ini tetap akan hidup di attendance DB, bukan platform DB, kecuali ada alasan kuat untuk menjadi capability lintas product.

---

## 7. Key Rules

- shared identity stays in platform DB
- product profile stays in product DB
- billing stays in platform DB
- audit stays centralized
- product DB query wajib filter `company_id`

---

## 8. Seeder Direction

Seeder minimal MVP sebaiknya membuat:

- one super admin user
- one demo company
- one demo company_admin membership
- one active attendance subscription
- one demo branch
- one demo attendance employee
