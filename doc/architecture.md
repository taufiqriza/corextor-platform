# Attendance Product Architecture on Corextor Platform

> Dokumen ini menjelaskan bagaimana produk Attendance dibangun di atas Corextor Platform, bukan sebagai aplikasi terpisah yang berdiri sendiri.

**Version:** 3.0.0  
**Last updated:** March 10, 2026

---

## 1. Scope of This Document

Dokumen ini fokus pada:

- frontend Attendance di `attendance.corextor.com`
- integration path ke `api.corextor.com`
- attendance module di shared backend
- penggunaan platform DB dan attendance DB

Untuk gambaran platform global, lihat [`platform_architecture.md`](./platform_architecture.md).

---

## 2. Runtime Topology

```text
+------------------------------+
| attendance.corextor.com      |
| Attendance SPA               |
+--------------+---------------+
               |
               | HTTPS
               v
+---------------------------------------------+
| api.corextor.com                            |
|  Platform modules + Attendance module       |
|  - auth/session                             |
|  - company/membership                       |
|  - product entitlement                      |
|  - attendance business logic                |
+-----------------+---------------------------+
                  |
        +---------+---------+
        |                   |
        v                   v
+------------------+  +----------------------+
| corextor_platform|  | corextor_attendance  |
| platform DB      |  | attendance DB        |
+------------------+  +----------------------+
```

---

## 3. Attendance Frontend

### Primary Responsibilities

- login screen
- session restore via shared auth
- branch and attendance user management UI
- employee check-in and check-out UI
- attendance history and reports
- subscription-aware routing

### Recommended Frontend State

| State Area | Responsibility |
|-----------|----------------|
| `AuthContext` | access token in memory, user identity, logout |
| `SessionContext` | company, role, active products, session readiness |
| `AttendanceContext` | attendance profile, branch context, attendance-specific permissions |

### API Client Direction

```typescript
const apiClient = axios.create({
  baseURL: "https://api.corextor.com",
  withCredentials: true,
});
```

Frontend Attendance tidak boleh menganggap dirinya memiliki backend sendiri. Semua request tetap menuju `api.corextor.com`.

---

## 4. Attendance Backend Module

### Module Boundaries

Attendance module hanya menangani:

- branches
- attendance user profiles
- PIN login attendance
- attendance records
- attendance reports
- attendance corrections

Attendance module **tidak** menjadi pemilik data untuk:

- auth session
- company master
- global user identity
- product catalog
- invoices
- subscriptions
- bundles

Semua itu tetap milik platform modules.

---

## 5. Data Ownership

### Platform DB

Digunakan saat Attendance perlu:

- memvalidasi user identity
- memvalidasi company membership
- mengecek apakah company punya product `attendance`
- membaca company admins
- menulis audit log pusat

### Attendance DB

Digunakan untuk:

- branch data
- PIN dan profile attendance user
- attendance records
- report aggregation attendance

---

## 6. Attendance User Model

Identity user tetap bersumber dari platform DB, tetapi Attendance memiliki profile sendiri.

```text
platform.users
  -> global identity

platform.company_memberships
  -> role in company

attendance.attendance_users
  -> attendance-specific profile
  -> platform_user_id
  -> company_id
  -> branch_id
  -> pin_hash
  -> pin_lookup
```

Ini penting karena:

- SSO tetap global
- data Attendance tidak mencemari platform schema
- future product dapat memiliki profile sendiri untuk user yang sama

---

## 7. Request Lifecycle

### 7.1 Attendance App Bootstrap

```text
1. Frontend loads on attendance.corextor.com
2. Frontend calls POST /platform/v1/auth/refresh
3. Platform validates refresh session
4. Platform returns access token + active_products
5. Frontend checks "attendance" is active
6. Frontend loads attendance profile
7. App becomes ready
```

### 7.2 Check-In Flow

```text
1. Employee clicks Check-In
2. Frontend sends POST /attendance/v1/attendance/check-in
3. Platform auth validates token
4. Product entitlement guard checks active subscription
5. Attendance module loads attendance_user profile
6. Attendance module resolves branch and profile status
7. Attendance DB writes attendance record
8. Platform audit log records action
```

### 7.3 Attendance Report Flow

```text
1. Company admin requests report
2. Request hits /attendance/v1/attendance/report
3. Access token validated
4. Product entitlement validated
5. Attendance DB aggregates records by company_id
6. Platform audit log records report access
```

---

## 8. Attendance Routing in Shared Backend

### Suggested Route Files

```text
routes/platform.php
routes/attendance.php
```

### Suggested HTTP Pipeline for Attendance Routes

1. CORS
2. Access token auth
3. company membership resolution
4. product entitlement guard for `attendance`
5. attendance profile guard when route requires employee/company profile
6. role middleware

---

## 9. Recommended Module Layout

```text
app/
  Modules/
    Platform/
      Identity/
      Session/
      Company/
      Membership/
      ProductCatalog/
      Subscription/
      Billing/
      Audit/
    Attendance/
      Http/
      Services/
      Repositories/
      Models/
```

---

## 10. Frontend Folder Direction

```text
web/src/
  api/
    platform.api.ts
    attendance.api.ts
    client.ts
  contexts/
    AuthContext.tsx
    SessionContext.tsx
    AttendanceContext.tsx
  pages/
    login/
    attendance/
    admin/
```

---

## 11. Key Engineering Rules

- Attendance frontend must never hardcode product entitlement assumptions
- Attendance module must validate active subscription before serving product data
- `branch_id` is resolved from attendance profile, not from platform token
- audit log stays centralized
- no cross-database joins in business-critical paths
- cross-database inconsistency must fail closed and follow the rules in [`multi_tenant.md`](./multi_tenant.md)

---
