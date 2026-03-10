# Corextor SSO and Attendance Login Flow

> Dokumen ini menjelaskan alur login baru: shared session di `api.corextor.com`, single sign-on antar product aktif, dan PIN login khusus Attendance.

**Version:** 3.0.0  
**Last updated:** March 10, 2026

---

## 1. Login Methods

| Method | Endpoint | Owner | Main Use |
|--------|----------|-------|----------|
| Email login | `POST /platform/v1/auth/login/email` | Platform | super admin, company admin |
| Attendance PIN login | `POST /attendance/v1/auth/login/pin` | Attendance module | employee / attendance-enabled company admin |
| Refresh session | `POST /platform/v1/auth/refresh` | Platform | restore session on any Corextor subdomain |
| Global logout | `POST /platform/v1/auth/logout` | Platform | terminate shared session |

---

## 2. Session Model

### Access Token

- short-lived
- stored in memory only
- used for API authorization

### Refresh Session

- stored as secure HttpOnly cookie on `.corextor.com`
- shared across Corextor product subdomains
- used to mint new access token on page load or expiry

---

## 3. Access Token Claims

Suggested minimum claims:

```json
{
  "sub": 42,
  "current_company_id": 5,
  "role": "company_admin",
  "active_products": ["attendance"],
  "session_id": "sess_01HQ...",
  "exp": 1778123400
}
```

Important:

- `branch_id` tidak ada di token global
- branch hanya di-resolve dalam Attendance module
- `active_products` adalah daftar product yang efektif bisa diakses oleh user saat ini

---

## 4. Email Login Flow

```text
1. User opens attendance.corextor.com/login
2. Frontend sends POST /platform/v1/auth/login/email
3. Platform validates email/password
4. Platform resolves current company membership
5. Platform resolves effective active products for current user
6. Platform writes refresh cookie on .corextor.com
7. Platform returns access token + user summary
8. Frontend stores access token in memory
9. Frontend checks "attendance" exists in active_products
10. Attendance app continues bootstrap
```

### Email Login Output

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOi...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": 42,
      "name": "Admin Demo",
      "role": "company_admin",
      "current_company_id": 5,
      "active_products": ["attendance"]
    }
  }
}
```

---

## 5. Attendance PIN Login Flow

Attendance PIN login adalah flow product-specific, tetapi session yang dihasilkan tetap session platform.

```text
1. User opens attendance.corextor.com/login
2. Frontend sends POST /attendance/v1/auth/login/pin
3. Attendance module resolves company by company_code
4. Attendance module computes pin_lookup
5. Attendance DB loads attendance_user by company_id + pin_lookup
6. Attendance module verifies pin_hash
7. Attendance module asks platform session service to create shared session
8. Platform writes refresh cookie on .corextor.com
9. Platform returns access token + active_products
10. Frontend stores access token in memory
```

### Why This Flow Matters

- PIN tetap milik Attendance product
- session tetap milik platform
- hasilnya user tetap bisa SSO ke product aktif lain yang memang diizinkan

---

## 6. Product Bootstrap Flow

Setiap product frontend harus melakukan bootstrap session saat load.

```text
1. Frontend loads
2. Frontend calls POST /platform/v1/auth/refresh with credentials
3. Platform validates refresh session
4. Platform returns fresh access token
5. Frontend checks active_products contains current product
6. Frontend loads product profile if required
7. App enters authenticated state
```

Untuk Attendance, langkah 6 berarti memuat `attendance_user` profile.

---

## 7. Cross-Product SSO Behavior

Contoh:

```text
User login on attendance.corextor.com
  -> refresh cookie saved on .corextor.com

Later user opens crm.corextor.com
  -> crm frontend calls /platform/v1/auth/refresh
  -> platform checks session
  -> platform returns token
  -> crm frontend checks crm in active_products
```

Jika product tidak aktif untuk company:

- refresh tetap berhasil
- tetapi frontend / API product guard harus menolak akses ke product tersebut

---

## 8. Global Logout Flow

```text
1. Frontend calls POST /platform/v1/auth/logout
2. Platform deletes refresh session
3. Platform clears refresh cookie
4. Frontend clears in-memory access token
5. User becomes logged out from all product apps sharing the same session
```

---

## 9. Security Measures

### Authentication

- email login rate limited
- attendance PIN login rate limited per `company_code + ip`
- access token short-lived
- refresh session revocable

### Client Storage

- no `localStorage` for access token
- refresh handled through HttpOnly cookie

### Attendance PIN

- stored as `pin_hash`
- queried through `pin_lookup`
- unique within one company

---

## 10. Error Cases

| Case | Result |
|------|--------|
| Valid login but company has no attendance product | login success at platform level, attendance app access denied |
| Employee has session but no attendance profile | attendance namespace denies access |
| Company subscription suspended | attendance product access denied |
| Refresh session expired | all product apps must require login again |

---

## 11. Recommended Frontend Behavior

- attendance frontend login page boleh menyediakan tab email dan PIN
- on mount, app always tries refresh first
- if refresh success but `attendance` not active, show product access denied page
- if refresh success and attendance active but no attendance profile, show profile/pending access state
