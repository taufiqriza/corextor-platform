# Corextor Roles and Product Access

> Dokumen ini menjelaskan role model Corextor Platform dan bagaimana akses terhadap product Attendance ditentukan.

**Version:** 3.0.0  
**Last updated:** March 10, 2026

---

## 1. Role Layers

Corextor memiliki dua lapisan kontrol akses:

1. **Platform role / membership role**
2. **Product-specific profile access**

---

## 2. MVP Roles

| Role | Scope | Description |
|------|-------|-------------|
| `super_admin` | Global platform | Mengelola companies, products, subscriptions, invoices, dan global logs |
| `company_admin` | One company | Mengelola company sendiri dan semua product aktif company pada MVP |
| `employee` | One company | User biasa; akses tergantung profile aktif di product terkait |

---

## 3. Product Access Rules

### Company Admin

Pada MVP v1:

- dapat login sekali dan mengakses semua active products milik company
- dapat dilihat oleh super admin bersama daftar product aktif company
- tidak dapat mengakses product yang belum dilanggan company

### Employee

Pada MVP v1:

- tidak otomatis punya akses ke semua product aktif milik company
- hanya bisa masuk ke product jika ada profile aktif pada product tersebut

Untuk Attendance, syarat employee:

- membership company valid
- product `attendance` aktif untuk company
- ada record aktif di `attendance_users`

---

## 4. Permission Matrix

### 4.1 Platform Management

| Action | Super Admin | Company Admin | Employee |
|--------|:-----------:|:-------------:|:--------:|
| View all companies | yes | no | no |
| Create company | yes | no | no |
| Update company | yes | no | no |
| View company admins | yes | no | no |
| View company subscriptions | yes | yes (own company only) | no |
| Add product to company | yes | no | no |
| View invoices | yes | yes (own company only) | no |
| Manage products and plans | yes | no | no |
| View global audit logs | yes | no | no |

### 4.2 Attendance Product

| Action | Super Admin | Company Admin | Employee |
|--------|:-----------:|:-------------:|:--------:|
| Access attendance app | yes | yes | yes, if attendance profile active |
| View branches | yes | yes | no |
| Manage branches | yes | yes | no |
| View attendance users | yes | yes | no |
| Create/update attendance users | yes | yes | no |
| Reset attendance PIN | yes | yes | no |
| Check-in / check-out | no | yes, if attendance profile active | yes |
| View own attendance history | yes | yes, if attendance profile active | yes |
| View company attendance report | yes | yes | no |
| Correct attendance | yes | yes | no |
| View attendance logs | yes | yes | no |

`super_admin` boleh melakukan akses lintas company untuk kebutuhan platform operations, tetapi bypass tenant harus eksplisit dan tercatat di audit log.

---

## 5. Super Admin Visibility Requirement

Sesuai target platform baru, panel super admin minimal harus bisa melihat:

- company
- company admins
- active products per company
- subscription status per product
- invoice list per company

Ini penting agar manajemen produk lintas company tidak tersembunyi di masing-masing product UI.

---

## 6. Role Resolution Rules

### Rule 1

Role efektif ditentukan sebagai berikut:

- jika `users.platform_role = super_admin`, maka role efektif adalah `super_admin`
- jika tidak, role efektif diambil dari `company_memberships.role`

### Rule 2

Product access tidak boleh hanya ditentukan dari role. Harus dicek juga:

- subscription aktif
- product profile aktif jika dibutuhkan

### Rule 3

Frontend boleh memakai role untuk UX, tetapi backend tetap otoritatif.

---

## 7. Attendance PIN Login and Roles

- `super_admin` tidak menggunakan PIN login
- `company_admin` boleh memakai PIN hanya jika attendance profile untuk admin memang diaktifkan
- `employee` boleh memakai PIN login attendance jika profile aktif

Attendance PIN login bukan pengganti sistem role platform; PIN login hanyalah metode masuk untuk product Attendance.
