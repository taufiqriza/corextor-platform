# Corextor Platform Documentation Index

> Main domain: `corextor.com`  
> Shared API: `api.corextor.com`  
> First product app: `attendance.corextor.com`  
> Version: 4.0.0  
> Last updated: March 10, 2026

---

## Purpose

Folder ini berisi blueprint implementasi **Corextor Platform** dengan **Attendance** sebagai product pertama.

Status saat ini:

- repository ini masih berisi dokumentasi
- source tree runtime belum dibuat
- dokumen disusun agar bisa dipakai langsung sebagai dasar eksekusi sprint-by-sprint

---

## Documentation Set

Set dokumentasi ini sengaja dibagi berdasarkan tanggung jawab, agar tidak saling mengulang.

| Document | One-line responsibility |
|----------|-------------------------|
| [`implementation_scope.md`](./implementation_scope.md) | Keputusan final yang tidak boleh berubah tanpa keputusan baru |
| [`platform_architecture.md`](./platform_architecture.md) | Arsitektur platform Corextor secara menyeluruh |
| [`architecture.md`](./architecture.md) | Arsitektur product Attendance di atas platform |
| [`roles.md`](./roles.md) | Role model dan aturan akses |
| [`multi_tenant.md`](./multi_tenant.md) | Tenant, entitlement, dan isolation model |
| [`login_flow.md`](./login_flow.md) | Alur SSO, email login, PIN login, refresh, logout |
| [`database.md`](./database.md) | Skema database platform dan attendance |
| [`api_spec.md`](./api_spec.md) | Kontrak API MVP v1 |
| [`delivery_plan.md`](./delivery_plan.md) | Rencana delivery sprint-by-sprint |
| [`sprint_checklists.md`](./sprint_checklists.md) | Checklist teknis operasional per sprint |
| [`backlog.md`](./backlog.md) | Phase 2 dan phase 3 setelah MVP |

---

## Reading Order

Kalau baru masuk ke project ini, baca dengan urutan berikut:

1. [`implementation_scope.md`](./implementation_scope.md)
2. [`platform_architecture.md`](./platform_architecture.md)
3. [`delivery_plan.md`](./delivery_plan.md)
4. [`sprint_checklists.md`](./sprint_checklists.md)
5. [`architecture.md`](./architecture.md)
6. [`roles.md`](./roles.md)
7. [`multi_tenant.md`](./multi_tenant.md)
8. [`login_flow.md`](./login_flow.md)
9. [`database.md`](./database.md)
10. [`api_spec.md`](./api_spec.md)
11. [`backlog.md`](./backlog.md)

---

## Source of Truth Order

Jika ada konflik antar dokumen, gunakan urutan berikut:

1. [`implementation_scope.md`](./implementation_scope.md)
2. [`platform_architecture.md`](./platform_architecture.md)
3. [`database.md`](./database.md)
4. [`api_spec.md`](./api_spec.md)
5. [`roles.md`](./roles.md)
6. [`multi_tenant.md`](./multi_tenant.md)
7. [`login_flow.md`](./login_flow.md)
8. [`architecture.md`](./architecture.md)
9. [`delivery_plan.md`](./delivery_plan.md)
10. [`sprint_checklists.md`](./sprint_checklists.md)
11. [`backlog.md`](./backlog.md)

---

## MVP Summary

### Platform Core

- shared auth dan SSO di `api.corextor.com`
- companies
- product catalog
- company subscriptions
- invoices
- central audit log
- super admin visibility untuk company, admins, subscriptions, invoices

### Attendance Product

- frontend di `attendance.corextor.com`
- branches
- attendance users
- attendance PIN login
- check-in, check-out, history, report, correction

---

## Out of MVP

Lihat [`backlog.md`](./backlog.md) untuk fitur phase 2 dan phase 3, termasuk:

- geofence
- selfie
- shifts
- leave
- employee reports
- notifications
- holiday calendar
- export center

---

## Implementation Direction

Target implementasi:

```text
/corextor-platform
├── api/    # shared Corextor backend + Attendance module
├── web/    # Attendance frontend
└── doc/    # this documentation set
```

Produk frontend lain boleh berada di repository terpisah di masa depan, tetapi backend platform tetap reusable lewat `api.corextor.com`.
