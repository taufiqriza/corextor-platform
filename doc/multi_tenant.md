# Corextor Tenant and Product Isolation Model

> Dokumen ini menjelaskan model tenancy baru untuk Corextor Platform: tenant berada di level company, sedangkan product data diisolasi per product database.

**Version:** 3.0.0  
**Last updated:** March 10, 2026

---

## 1. Core Principle

Tenancy Corextor sekarang memiliki **dua lapisan**:

1. **Platform tenancy**  
   Company adalah tenant utama platform.

2. **Product isolation**  
   Setiap product menyimpan business data di database sendiri, tetapi tetap memakai `company_id` yang berasal dari platform.

---

## 2. What Is the Tenant

Tenant utama adalah `company`.

Semua hal berikut di-resolve dari platform:

- company identity
- company membership
- company active products
- billing ownership
- invoice ownership

Attendance tidak membuat tenant sendiri. Attendance hanya memakai tenant platform yang sama.

---

## 3. Data Isolation Model

### Platform Database

`corextor_platform` menyimpan:

- `companies`
- `users`
- `company_memberships`
- `products`
- `company_subscriptions`
- `invoices`
- `audit_logs`

### Attendance Database

`corextor_attendance` menyimpan:

- `branches`
- `attendance_users`
- `attendance_records`

### Isolation Rule

Semua query product tetap wajib dibatasi minimal oleh:

- `company_id`

Dan bila relevan:

- `branch_id`

---

## 4. Product Entitlement Is Part of Tenant Resolution

Request ke product API tidak cukup hanya authenticated. Sistem juga wajib memastikan:

1. user adalah member company yang valid
2. company memiliki subscription aktif untuk product tersebut
3. user memang boleh memakai product tersebut

Untuk Attendance:

- `company_admin` boleh masuk jika company punya product `attendance`
- `employee` harus punya `attendance_user` aktif

---

## 5. Request Context

### Platform Context

Diset setelah auth berhasil:

```text
current_user_id
current_company_id
current_role
active_products (effective products for current user)
session_id
```

### Attendance Context

Diset setelah attendance profile berhasil di-load:

```text
attendance_user_id
branch_id
attendance_status
```

`branch_id` bukan bagian dari platform token global karena tidak semua product mengenal konsep branch.

---

## 6. Middleware / Guard Order

### Platform Namespace

1. auth
2. session validation
3. company membership resolution
4. role check

### Attendance Namespace

1. auth
2. session validation
3. company membership resolution
4. attendance entitlement guard
5. attendance profile resolution
6. role check

---

## 7. Allowed and Disallowed Patterns

### Allowed

- derive `company_id` from validated platform session
- validate `attendance` subscription before reading attendance DB
- store `platform_user_id` in attendance tables
- filter attendance data by `company_id`

### Disallowed

- trust `company_id` from request body
- trust product access from frontend only
- run attendance queries without `company_id`
- create foreign key from attendance DB to platform DB
- assume every company member automatically has attendance profile

---

## 8. Super Admin Behavior

`super_admin` adalah platform-global dan boleh:

- melihat semua companies
- melihat semua company subscriptions
- melihat company admins
- menambah product ke company
- melihat global logs

Tetapi untuk membaca data attendance, super admin tetap harus melewati jalur product namespace dan bypass dilakukan di service layer secara eksplisit.

---

## 9. Cross-DB Consistency Rules

Karena tidak ada foreign key lintas database, konsistensi harus ditegakkan secara eksplisit di application layer.

### Authoritative Source

- `corextor_platform` adalah source of truth untuk `users`, `companies`, `company_memberships`, dan `company_subscriptions`
- `corextor_attendance` hanya menjadi source of truth untuk profile dan data operasional Attendance

### Rules

- hard delete untuk `users`, `companies`, atau `company_memberships` yang sudah direferensikan product data tidak boleh dilakukan pada MVP; gunakan deactivation via `status`
- jika subscription Attendance suspended, expired, atau revoked, semua akses ke `/attendance/v1/...` harus langsung ditolak walaupun data Attendance historis masih ada
- jika ditemukan `attendance_user` tanpa platform user, company, atau membership yang masih valid, request harus fail closed
- setiap consistency failure harus dicatat ke `audit_logs` sebagai event operasional
- create flow lintas DB harus berurutan: platform-first, lalu attendance-second
- jika step kedua gagal, row di platform tetap boleh ada, tetapi user belum dianggap punya akses Attendance sampai repair atau retry berhasil
- repair lintas DB hanya boleh dilakukan lewat jalur admin/internal dan wajib tercatat di audit

---

## 10. Example Request Flow

### Attendance Check-In

```text
POST /attendance/v1/attendance/check-in
Authorization: Bearer <access_token>

1. Validate token
2. Resolve company membership
3. Check company has active product "attendance"
4. Load attendance_user by platform_user_id + company_id
5. Resolve branch_id from attendance_user
6. Insert attendance_record scoped by company_id and branch_id
```

### Company Admin Attendance User List

```text
GET /attendance/v1/users

1. Validate token
2. Resolve company membership
3. Check attendance subscription
4. Ensure role = company_admin
5. Query attendance_users WHERE company_id = current_company_id
```

---

## 11. Testing Expectations

### Platform Tests

- company membership cannot access another company
- inactive subscription cannot access product namespace
- logout invalidates refresh session for all product apps

### Attendance Tests

- attendance routes only return records for one `company_id`
- employee without attendance profile cannot use attendance APIs
- company admin can see attendance users for own company only
- PIN lookup cannot match another company
- orphan `attendance_user` must be denied and logged as consistency failure

---
