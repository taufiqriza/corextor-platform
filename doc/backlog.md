# Corextor Attendance Backlog

> Dokumen ini menggabungkan backlog phase 2 dan phase 3 agar roadmap setelah MVP tetap ringkas dan tidak tersebar di banyak file.

**Version:** 3.0.0  
**Last updated:** March 10, 2026

---

## 1. Purpose

File ini hanya memuat pekerjaan setelah MVP. Semua item di sini:

- belum menjadi kontrak API aktif
- belum menjadi kontrak schema aktif
- baru boleh dipromosikan ke spesifikasi inti setelah dipilih untuk sprint baru

---

## 2. Phase 2 - Attendance Domain Deepening

### Goal

Memperdalam kapabilitas inti Attendance setelah core MVP stabil.

### Candidate Features

- company attendance settings
- geofence
- selfie verification
- shifts
- schedules
- leave management

### Candidate API Areas

```text
/attendance/v1/settings
/attendance/v1/shifts
/attendance/v1/users/{id}/schedule
/attendance/v1/leave/...
```

### Candidate Tables

```text
attendance_settings
shifts
user_schedules
leave_types
leave_requests
leave_balances
```

### Rule

Semua fitur phase 2 tetap mengikuti platform rules:

1. subscription aktif
2. entitlement plan atau bundle valid
3. user role dan product profile valid

---

## 3. Phase 3 - Advanced Product Capabilities

### Goal

Menambah kapabilitas bernilai tinggi yang lebih kompleks secara operasional.

### Candidate Features

- employee reports
- dashboard analytics
- notifications
- holiday calendar
- export center
- onboarding wizard

### Candidate API Areas

```text
/attendance/v1/reports
/attendance/v1/notifications
/attendance/v1/holidays
/attendance/v1/export
```

### Candidate Tables

```text
employee_reports
report_attachments
notifications
notification_preferences
holidays
export_jobs
scheduled_reports
```

### Likely Additional Needs

- queue workers
- stronger file storage strategy
- reporting cache
- async export pipeline
- reusable notification service if later dipakai product lain

---

## 4. Promotion Rule

Item backlog baru dianggap resmi jika:

1. dipilih untuk sprint baru
2. dipindahkan ke `delivery_plan.md`
3. schema aktif dimasukkan ke `database.md`
4. endpoint aktif dimasukkan ke `api_spec.md`
