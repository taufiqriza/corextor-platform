# Corextor Platform Architecture

> Dokumen ini menjelaskan arsitektur target Corextor sebagai platform multi-product dengan backend bersama dan frontend per subdomain.

**Version:** 3.0.0  
**Last updated:** March 10, 2026

---

## 1. High-Level View

```text
                    +----------------------+
                    |    corextor.com      |
                    |  marketing / public  |
                    +----------+-----------+
                               |
                               | links users to products
                               v
        +-----------------------------------------------+
        |               api.corextor.com                |
        | shared backend platform + product namespaces  |
        +----------------+------------------------------+
                         |
          +--------------+--------------+
          |                             |
          v                             v
+---------------------------+   +---------------------------+
| attendance.corextor.com   |   | future-product.corextor.com |
| Attendance frontend SPA   |   | Product frontend SPA        |
+---------------------------+   +-----------------------------+
```

---

## 2. Why This Shape

Pendekatan ini dipilih karena memberi keseimbangan yang baik antara fleksibilitas produk dan kesederhanaan operasional.

### Benefits

- Brand utama tetap rapi di `corextor.com`
- Product app bisa tumbuh independen per subdomain
- Shared auth, tenant, billing, audit, dan product catalog bisa dipakai ulang
- Onboarding produk baru lebih cepat
- Database per product mengurangi coupling schema

### Tradeoffs

- SSO lintas subdomain lebih kompleks
- Product access dan entitlement harus disiplin
- Shared backend menjadi komponen kritikal untuk semua produk

---

## 3. Backend Style

Gunakan **modular monolith** di `api.corextor.com`.

### Core Platform Modules

- `Identity`
- `Session`
- `Company`
- `Membership`
- `ProductCatalog`
- `Subscription`
- `Billing`
- `Audit`

### Product Modules

- `Attendance`
- future product modules

### Why Not Microservices Yet

- Tim dan produk masih tahap awal
- Shared business rules lebih mudah dijaga dalam satu codebase
- Operasional lebih sederhana
- Debugging lebih cepat

Microservice baru layak jika:

- produk tertentu punya traffic jauh lebih besar
- release cadence antarmodul benar-benar berbeda
- ownership tim sudah terpisah jelas

---

## 4. API Namespace Strategy

```text
https://api.corextor.com/platform/v1/...
https://api.corextor.com/attendance/v1/...
https://api.corextor.com/{future-product}/v1/...
```

### Rules

- `platform` namespace memegang capability lintas produk
- setiap product namespace memegang business logic produk tersebut
- satu access token dipakai untuk semua namespace
- setiap namespace product harus memvalidasi entitlement company terhadap product tersebut

---

## 5. Database Topology

```text
corextor_platform
  - companies
  - users
  - company_memberships
  - products
  - plans
  - bundles
  - subscriptions
  - invoices
  - refresh_sessions
  - audit_logs

corextor_attendance
  - branches
  - attendance_users
  - attendance_records
  - future attendance tables
```

### Rule

- platform DB adalah authoritative source untuk identity, company, product, subscription, dan billing
- product DB adalah authoritative source untuk business data produk
- tidak ada cross-database foreign key

---

## 6. SSO Model

### Session Behavior

- login dilakukan terhadap `api.corextor.com`
- refresh cookie diset pada domain `.corextor.com`
- setiap product frontend melakukan session refresh saat bootstrap
- jika token valid dan product termasuk ke `active_products`, frontend dapat melanjutkan

`active_products` harus dibaca sebagai daftar product yang efektif bisa dipakai oleh user saat ini, bukan sekadar semua product milik company.

### Global Logout

- logout menghapus refresh session di platform
- semua product frontend kehilangan kemampuan refresh
- access token di memory akan mati secara natural atau dibuang oleh frontend

---

## 7. Product Access Model

### Company Level

- company memiliki daftar produk aktif
- company dapat mulai dari satu produk
- model tetap mengizinkan banyak produk
- super admin dapat menambah produk aktif ke company

### User Level

- `company_admin`: dapat mengakses semua active products milik company pada MVP
- `employee`: hanya dapat masuk ke product yang memiliki profile aktif untuk user tersebut

Untuk Attendance, employee harus memiliki record aktif di `attendance_users`.

---

## 8. Request Lifecycle

### Email Login

```text
attendance.corextor.com
  -> POST api.corextor.com/platform/v1/auth/login/email
  -> platform validates identity
  -> platform resolves membership and effective active products for user
  -> platform sets refresh cookie and returns access token
```

### Attendance API Call

```text
attendance.corextor.com
  -> GET api.corextor.com/attendance/v1/attendance/history
  -> auth middleware validates access token
  -> product entitlement guard checks company has attendance
  -> attendance module loads attendance_user profile
  -> attendance DB queried with company_id + profile context
```

---

## 9. CORS and Cookie Policy

- CORS whitelist hanya untuk domain Corextor yang sah
- frontend selalu menggunakan `withCredentials: true`
- refresh session memakai secure cookie
- access token disimpan di memory state, bukan `localStorage`

---

## 10. Deployment Model

### Initial

- satu backend deployment untuk `api.corextor.com`
- satu frontend deployment untuk `attendance.corextor.com`
- satu marketing deployment untuk `corextor.com`
- multi-database connections dari backend

### Future

- frontend per product boleh deploy independen
- product module boleh dipisah menjadi service jika dibutuhkan

---

## 11. Recommended Near-Term Structure

```text
api/
  app/
    Modules/
      Platform/
        Identity/
        Company/
        Membership/
        ProductCatalog/
        Subscription/
        Billing/
        Audit/
      Attendance/
  config/
  routes/
    platform.php
    attendance.php
  database/
    migrations/
      platform/
      attendance/
```

---

## 12. Relationship to Attendance Docs

- Dokumen ini menjelaskan platform secara menyeluruh
- [`architecture.md`](./architecture.md) menjelaskan detail Attendance di atas platform ini
- [`database.md`](./database.md) menjabarkan skema platform DB dan attendance DB
