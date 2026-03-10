# Corextor Platform and Attendance API Spec

> Dokumen ini mendefinisikan kontrak API MVP v1 untuk `api.corextor.com`, mencakup namespace platform dan namespace attendance.

**Version:** 3.0.0  
**Last updated:** March 10, 2026

---

## 1. Base Rules

| Item | Value |
|------|-------|
| Base URL | `https://api.corextor.com` |
| Platform namespace | `/platform/v1` |
| Attendance namespace | `/attendance/v1` |
| Access token | `Authorization: Bearer {access_token}` |
| Refresh session | Secure HttpOnly cookie on `.corextor.com` |
| Content-Type | `application/json` |
| Accept | `application/json` |

### Standard Success Response

```json
{
  "status": "success",
  "message": "Operation completed",
  "data": {},
  "meta": {
    "timestamp": "2026-03-10T09:00:00+08:00"
  }
}
```

### Standard Error Response

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "field": ["Reason"]
  },
  "meta": {
    "timestamp": "2026-03-10T09:00:00+08:00"
  }
}
```

---

## 2. Platform Auth Endpoints

### POST `/platform/v1/auth/login/email`

Use case:

- super admin login
- company admin login

Request:

```json
{
  "email": "admin@demo.com",
  "password": "secret"
}
```

Response:

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

### POST `/platform/v1/auth/refresh`

Auth:

- refresh cookie only

Response:

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOi...",
    "expires_in": 900,
    "active_products": ["attendance"]
  }
}
```

### POST `/platform/v1/auth/logout`

Effect:

- revoke refresh session
- clear refresh cookie

### GET `/platform/v1/me`

Returns:

- current user
- current company
- role
- active products

Response:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 42,
      "name": "Admin Demo",
      "email": "admin@demo.com",
      "role": "company_admin",
      "current_company_id": 5,
      "active_products": ["attendance"]
    },
    "company": {
      "id": 5,
      "code": "DEMO",
      "name": "Demo Company",
      "status": "active"
    }
  }
}
```

### GET `/platform/v1/my-products`

Returns:

- list of effective active products for current user
- current subscription status summary

---

## 3. Platform Admin Endpoints

### GET `/platform/v1/companies`

Role:

- `super_admin`

Purpose:

- list companies

### POST `/platform/v1/companies`

Role:

- `super_admin`

Purpose:

- create company

### GET `/platform/v1/companies/{id}`

Role:

- `super_admin`

Purpose:

- company detail

### GET `/platform/v1/companies/{id}/admins`

Role:

- `super_admin`

Purpose:

- list company admin users
- include active products for company in payload summary

### GET `/platform/v1/companies/{id}/subscriptions`

Role:

- `super_admin`

Purpose:

- list product subscriptions for company

### POST `/platform/v1/companies/{id}/subscriptions`

Role:

- `super_admin`

Purpose:

- add a product subscription to company
- supports adding one product now and many products later

Request example:

```json
{
  "product_code": "attendance",
  "plan_code": "attendance-basic-monthly",
  "starts_at": "2026-04-01"
}
```

### GET `/platform/v1/products`

Role:

- `super_admin`

Purpose:

- list product catalog

### GET `/platform/v1/plans`

Role:

- `super_admin`

Purpose:

- list plans per product

### GET `/platform/v1/bundles`

Role:

- `super_admin`

Purpose:

- list bundle products / bundle plans

### GET `/platform/v1/invoices`

Role:

- `super_admin`

Query:

- `company_id`
- `product_code`
- `status`

---

## 4. Company Self-Service Platform Endpoints

### GET `/platform/v1/company/subscriptions`

Role:

- `company_admin`

Purpose:

- view own company active subscriptions

### GET `/platform/v1/company/invoices`

Role:

- `company_admin`

Purpose:

- view own company invoices

---

## 5. Attendance Auth Endpoint

### POST `/attendance/v1/auth/login/pin`

Purpose:

- attendance-specific PIN login

Request:

```json
{
  "company_code": "DEMO",
  "pin": "1234"
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOi...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": 101,
      "name": "Employee One",
      "role": "employee",
      "current_company_id": 5,
      "active_products": ["attendance"]
    }
  }
}
```

---

## 6. Attendance Branch Endpoints

### GET `/attendance/v1/branches`

Role:

- `company_admin`
- `super_admin`

### POST `/attendance/v1/branches`

Role:

- `company_admin`
- `super_admin`

### PUT `/attendance/v1/branches/{id}`

Role:

- `company_admin`
- `super_admin`

### DELETE `/attendance/v1/branches/{id}`

Role:

- `company_admin`
- `super_admin`

---

## 7. Attendance User Endpoints

Attendance user endpoints mengorkestrasi dua lapisan data:

- global identity / membership di platform
- attendance profile di attendance DB

### GET `/attendance/v1/users`

Role:

- `company_admin`
- `super_admin`

Purpose:

- list attendance users for company

### POST `/attendance/v1/users`

Role:

- `company_admin`
- `super_admin`

Purpose:

- create or link platform user
- create attendance profile

Request example:

```json
{
  "name": "Employee One",
  "email": "employee1@demo.com",
  "password": "secret123",
  "role": "employee",
  "branch_id": 12,
  "pin": "1234",
  "status": "active"
}
```

Notes:

- `status` maps directly to `attendance_users.status`
- MVP does not define a separate `pin_status` column or request field
- PIN usability follows the active status of the Attendance profile

### PUT `/attendance/v1/users/{id}`

Role:

- `company_admin`
- `super_admin`

### POST `/attendance/v1/users/{id}/reset-pin`

Role:

- `company_admin`
- `super_admin`

### DELETE `/attendance/v1/users/{id}`

Role:

- `company_admin`
- `super_admin`

Effect:

- deactivate attendance profile
- keep platform user and company membership unchanged
- product access for Attendance stops because attendance profile is no longer active

---

## 8. Attendance Record Endpoints

### POST `/attendance/v1/attendance/check-in`

Role:

- `employee`
- `company_admin`

Note:

- `company_admin` may use this endpoint only if an active `attendance_user` profile exists for the same company

### POST `/attendance/v1/attendance/check-out`

Role:

- `employee`
- `company_admin`

Note:

- `company_admin` may use this endpoint only if an active `attendance_user` profile exists for the same company

### GET `/attendance/v1/attendance/history`

Role:

- `employee`
- `company_admin`
- `super_admin`

Note:

- for self-history, `company_admin` must have an active `attendance_user` profile
- `super_admin` access is for support or audit purposes and must remain explicitly audited

### GET `/attendance/v1/attendance/report`

Role:

- `company_admin`
- `super_admin`

### PUT `/attendance/v1/attendance/{id}/correct`

Role:

- `company_admin`
- `super_admin`

---

## 9. Attendance Log Endpoint

### GET `/attendance/v1/logs`

Role:

- `company_admin`
- `super_admin`

Notes:

- backed by central audit log
- filtered by `product_code = attendance`

---

## 10. Required Guards for Attendance Namespace

Every request to `/attendance/v1/...` must pass:

1. access token validation
2. company membership validation
3. active subscription check for product `attendance`
4. attendance profile validation when route requires it

---

## 11. HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `204` | No Content |
| `401` | Unauthenticated |
| `403` | Forbidden or product not entitled |
| `404` | Not Found |
| `409` | Conflict |
| `422` | Validation error |
| `429` | Rate limit exceeded |

---

## 12. Naming Convention

- platform endpoints stay under `/platform/v1`
- attendance endpoints stay under `/attendance/v1`
- future products must follow the same namespace strategy
