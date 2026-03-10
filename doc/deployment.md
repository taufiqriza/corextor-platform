# Corextor Platform — Deployment & Operations Guide

**Version:** 1.0.0  
**Last updated:** March 10, 2026

---

## 1. Environment Variables Checklist

| Variable | Required | Description |
|----------|:--------:|-------------|
| `APP_NAME` | ✅ | Application name (default: Corextor) |
| `APP_ENV` | ✅ | `local`, `staging`, `production` |
| `APP_KEY` | ✅ | Generated via `php artisan key:generate` |
| `APP_DEBUG` | ✅ | `true` for local/staging, `false` for production |
| `APP_URL` | ✅ | Base URL (e.g., `https://api.corextor.com`) |
| `DB_CONNECTION` | ✅ | Must be `platform` |
| `DB_HOST` | ✅ | Platform DB host |
| `DB_PORT` | ✅ | Platform DB port (default: 3306) |
| `DB_DATABASE` | ✅ | `corextor_platform` |
| `DB_USERNAME` | ✅ | Platform DB user |
| `DB_PASSWORD` | ✅ | Platform DB password |
| `DB_ATTENDANCE_HOST` | ✅ | Attendance DB host |
| `DB_ATTENDANCE_PORT` | ✅ | Attendance DB port |
| `DB_ATTENDANCE_DATABASE` | ✅ | `corextor_attendance` |
| `DB_ATTENDANCE_USERNAME` | ✅ | Attendance DB user |
| `DB_ATTENDANCE_PASSWORD` | ✅ | Attendance DB password |
| `JWT_SECRET` | ✅ | Must be long random string (min 32 chars) |
| `JWT_TTL` | ✅ | Access token TTL in seconds (default: 900) |
| `JWT_REFRESH_TTL` | ✅ | Refresh token TTL in seconds (default: 604800) |
| `CORS_ALLOWED_ORIGINS` | ⚠️ | Comma-separated origins for CORS |

---

## 2. Deployment Checklist

### Pre-deployment

- [ ] Verify `.env` is configured per Section 1
- [ ] Verify databases exist: `corextor_platform`, `corextor_attendance`
- [ ] Verify DB user has CREATE, ALTER, DROP, SELECT, INSERT, UPDATE, DELETE permissions
- [ ] `APP_DEBUG=false` on production
- [ ] `JWT_SECRET` is unique per environment

### Deploy Steps

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
composer install --no-dev --optimize-autoloader

# 3. Generate app key (first deploy only)
php artisan key:generate

# 4. Run platform migrations
php artisan migrate --path=database/migrations/platform --database=platform --force

# 5. Run attendance migrations
php artisan migrate --path=database/migrations/attendance --database=attendance --force

# 6. Seed data (first deploy only)
php artisan db:seed --force

# 7. Clear caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 8. Verify
php artisan about
```

### Post-deployment Smoke Test

```bash
# Health check
curl -s https://api.corextor.com/api/platform/v1/health | python3 -m json.tool

# Login test
curl -s -X POST https://api.corextor.com/api/platform/v1/auth/login/email \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@corextor.com","password":"<password>"}'
```

---

## 3. Rollback Checklist

```bash
# 1. Revert to previous commit
git checkout <previous-commit-hash>

# 2. Re-install dependencies
composer install --no-dev --optimize-autoloader

# 3. Rollback migrations (if needed)
php artisan migrate:rollback --path=database/migrations/platform --database=platform --force
php artisan migrate:rollback --path=database/migrations/attendance --database=attendance --force

# 4. Clear caches
php artisan config:cache
php artisan route:cache
```

---

## 4. Daily Smoke Test

Automated or manual daily verification:

| Test | Expected | Command |
|------|----------|---------|
| Health check | 200 + both DB ok | `GET /api/platform/v1/health` |
| Email login | 200 + token | `POST /api/platform/v1/auth/login/email` |
| PIN login | 200 + token | `POST /api/attendance/v1/auth/login/pin` |
| Check-in | 201 or 409 | `POST /api/attendance/v1/attendance/check-in` |

---

## 5. Monitoring

Minimum monitoring targets:

- **Health endpoint**: Poll `/api/platform/v1/health` every 60s
- **Database connectivity**: Both `platform_db` and `attendance_db` must return `ok`
- **Error rate**: Monitor 5xx responses
- **Audit logs**: Check `audit_logs` table for unusual patterns
- **Refresh sessions**: Monitor for mass revocations or anomalous session creation
