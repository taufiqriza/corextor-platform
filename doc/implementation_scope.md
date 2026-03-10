# Corextor Platform Decision Register

> Dokumen ini hanya memuat keputusan final yang menjadi batas implementasi. Dokumen ini tidak mengulang detail arsitektur, flow, schema, atau sprint plan.

**Version:** 3.0.0  
**Last updated:** March 10, 2026

---

## 1. Product Shape

- Corextor adalah **platform multi-product**
- `corextor.com` adalah public brand site
- `api.corextor.com` adalah shared backend platform
- `attendance.corextor.com` adalah product app pertama

---

## 2. Backend Decision

- gunakan **modular monolith**
- satu codebase backend pada tahap awal
- platform modules dan product modules hidup bersama
- service split hanya dilakukan jika kebutuhan operasionalnya nyata

---

## 3. Database Decision

- satu database platform pusat: `corextor_platform`
- satu database terpisah untuk product Attendance: `corextor_attendance`
- future products boleh punya database masing-masing
- tidak ada foreign key lintas database
- relasi lintas database hanya logical reference

---

## 4. Identity and Access Decision

- `users` adalah global identity di platform DB
- `super_admin` adalah platform-global role
- `company_admin` dan `employee` adalah role membership di company
- access ke product tidak ditentukan oleh role saja
- product access selalu butuh:
  - valid company membership
  - active subscription
  - active product profile jika product membutuhkannya

---

## 5. SSO Decision

- login dan refresh dipusatkan di `api.corextor.com`
- refresh cookie berlaku lintas subdomain `.corextor.com`
- access token disimpan di memory, bukan `localStorage`
- login sekali harus berlaku untuk semua product yang efektif bisa diakses user
- logout harus bersifat global

---

## 6. Subscription and Billing Decision

- company boleh mulai dari satu product
- data model harus mendukung banyak product per company
- super admin harus bisa menambahkan product baru ke company
- billing default per product
- desain harus siap untuk bundle plan dan bundle invoice
- billing tetap berada di platform layer, bukan di attendance DB

---

## 7. Attendance-Specific Decision

- Attendance adalah product pertama di platform
- Attendance punya database sendiri
- Attendance memakai `attendance_users` sebagai product profile
- PIN login hanya berlaku untuk Attendance
- PIN disimpan sebagai:
  - `pin_hash`
  - `pin_lookup`
- `branch_id` tidak masuk ke platform token global

---

## 8. API Decision

- semua frontend memanggil `https://api.corextor.com`
- namespace yang dipakai:
  - `/platform/v1/...`
  - `/attendance/v1/...`

---

## 9. MVP Boundary

### In

- platform auth and SSO
- companies
- products
- subscriptions
- invoices
- central audit log
- attendance branches
- attendance users
- attendance PIN login
- attendance check-in/out/history/report/correction

### Out

- geofence
- selfie verification
- shift
- leave
- employee reports
- notifications
- holiday calendar
- export center

Semua item di luar MVP dipindahkan ke [`backlog.md`](./backlog.md).
