# Corextor Platform Deployment Runbook

**Version:** 2.0.0  
**Last updated:** March 26, 2026  
**Canonical target:** Hostinger production for `corextor.com`

---

## 1. Purpose

Dokumen ini adalah **source of truth deploy production** untuk Corextor Platform.

Gunakan dokumen ini jika kamu perlu:

- memahami arsitektur deploy yang sedang aktif
- menyiapkan environment production baru
- menjalankan first deploy atau repeat deploy
- melakukan smoke test dan rollback
- memahami gotcha Hostinger yang pernah terjadi

Dokumen ini menulis **kondisi aktual** yang sudah diverifikasi pada server Hostinger, bukan asumsi generik Laravel/Vite.

---

## 2. Production Topology

### Public domains

| Surface | URL | Responsibility |
|---------|-----|----------------|
| Public / Admin / Company SPA | `https://corextor.com` | landing page, login email, superadmin, company admin |
| Employee SPA | `https://app.corextor.com` | PIN login dan employee portal |
| Shared API | `https://api.corextor.com` | Laravel API untuk platform, attendance, payroll |

### Hostinger filesystem topology

Pada account ini, path live **bukan** dikontrol oleh `public_html` utama saja.
Yang diverifikasi aktif saat cutover:

```text
/home/u435085854/domains/corextor.com/apps/corextor/public
```

Path di atas sekarang di-repoint menjadi symlink ke release docroot:

```text
/home/u435085854/domains/corextor.com/apps/corextor/public
-> /home/u435085854/deploy/corextor-platform/current-web
```

Release tree yang dipakai:

```text
/home/u435085854/deploy/corextor-platform
├── artifacts/
├── releases/
├── shared/
│   └── api/
│       ├── .env
│       └── storage/
├── current -> /home/u435085854/deploy/corextor-platform/releases/<release_id>
└── current-web -> /home/u435085854/deploy/corextor-platform/releases/docroot-<release_id>
```

Di dalam `current-web`:

```text
current-web/
├── index.html                  # main/admin/company SPA
├── assets/...
├── app.corextor.com/           # employee SPA copy
└── api.corextor.com -> /home/u435085854/deploy/corextor-platform/current/api/public
```

### Important Hostinger discovery

Jangan berasumsi `public_html` adalah satu-satunya live path.
Pada akun ini, yang benar-benar melayani `corextor.com` adalah:

```text
/home/u435085854/domains/corextor.com/apps/corextor/public
```

Kalau ada perubahan deploy yang "tidak terlihat", cek dulu apakah symlink live diarahkan ke path di atas.

---

## 3. Deployment Model

Corextor production memakai **hybrid deployment** dengan **production branch** sebagai jalur production standard.

Model standard:

- source repo `corextor-platform` tetap menjadi repo pengembangan dan staging timeline
- branch `production` menjadi representasi state production
- GitHub Actions build frontend saat branch `production` berubah
- workflow membuat source archive dan web artifact
- Hostinger menerima artifact + perintah deploy remote

`workflow_dispatch` tetap ada untuk preflight atau redeploy manual, tetapi jalur production utamanya adalah update ke branch `production`.

Arsitektur CI/CD lengkap ada di:

- [`ops/cicd/README.md`](../ops/cicd/README.md)

Release payload yang diterima server:

- source archive
- frontend artifact
- shared `.env`
- remote deploy script
- preflight candidate symlink

Corextor production tetap memakai hybrid release di server:

- `api/`:
  - di-deploy dari source archive
  - dependency di-install via `composer install`
  - migrations dijalankan di server
- `web/`:
  - dibuild di GitHub Actions
  - hasil `dist/` di-pack menjadi artifact
  - artifact diekstrak di server menjadi static SPA

Model ini dipilih karena environment Hostinger saat diverifikasi:

- punya `git`
- punya `php`
- punya `composer`
- **tidak punya `node`, `npm`, `npx`**

Jadi build frontend **tidak boleh** dijadikan ketergantungan server-side.

---

## 4. Required Production Resources

### Database set

Production memakai tiga database MySQL:

| Module | Database |
|--------|----------|
| Platform | `u435085854_corextor` |
| Attendance | `u435085854_attendance` |
| Payroll | `u435085854_payroll` |

Masing-masing punya user sendiri.

### Shared API environment

File env production wajib ada di server:

```text
/home/u435085854/deploy/corextor-platform/shared/api/.env
```

Template dasar tersedia di:

[`ops/hostinger/examples/api.production.env`](../ops/hostinger/examples/api.production.env)

### Frontend build env

Frontend build production memakai:

[`ops/hostinger/examples/web.production.env`](../ops/hostinger/examples/web.production.env)

Minimal value production:

```text
VITE_API_URL=https://api.corextor.com/api
VITE_MAIN_APP_ORIGIN=https://corextor.com
VITE_EMPLOYEE_APP_ORIGIN=https://app.corextor.com
```

---

## 5. GitHub Actions Configuration

Workflow production utama:

- [`deploy-hostinger.yml`](../.github/workflows/deploy-hostinger.yml)

Workflow rollback manual:

- [`rollback-hostinger.yml`](../.github/workflows/rollback-hostinger.yml)

Template branch-based flow:

- [`deploy-from-production-branch.yml`](../ops/cicd/templates/deploy-from-production-branch.yml)

Remote release script:

[`remote-deploy.sh`](../ops/hostinger/remote-deploy.sh)

### Repository variables

Set variabel berikut di GitHub repository:

```text
HOSTINGER_SSH_HOST=145.223.108.160
HOSTINGER_SSH_PORT=65002
HOSTINGER_SSH_USER=u435085854
HOSTINGER_DEPLOY_BASE=/home/u435085854/deploy/corextor-platform
HOSTINGER_PRIMARY_DOCROOT=/home/u435085854/domains/corextor.com/apps/corextor/public
HOSTINGER_EMPLOYEE_SUBDIR_NAME=app.corextor.com
HOSTINGER_API_SUBDIR_NAME=api.corextor.com
VITE_API_URL=https://api.corextor.com/api
VITE_MAIN_APP_ORIGIN=https://corextor.com
VITE_EMPLOYEE_APP_ORIGIN=https://app.corextor.com
```

### Repository secret

```text
HOSTINGER_SSH_PRIVATE_KEY
```

Secret ini harus cocok dengan key yang memang bisa SSH ke Hostinger production.

### Branch protection recommendation

Branch protection tidak dikelola dari file repository, jadi harus diaktifkan sekali di GitHub Settings.

Rule minimal yang direkomendasikan untuk `production`:

- require a pull request before merging
- require at least 1 approval
- require status checks to pass:
  - `build-web`
  - `deploy`
- require branches to be up to date before merging
- block force pushes
- block branch deletion
- optional: require review from code owners

File [`CODEOWNERS`](../.github/CODEOWNERS) sudah disiapkan agar opsi `require review from code owners` bisa dipakai tanpa edit tambahan.

---

## 6. First-Time Server Preparation

Jalankan sekali untuk menyiapkan base directory:

```bash
mkdir -p /home/u435085854/deploy/corextor-platform/artifacts
mkdir -p /home/u435085854/deploy/corextor-platform/releases
mkdir -p /home/u435085854/deploy/corextor-platform/shared/api/storage/app/public
mkdir -p /home/u435085854/deploy/corextor-platform/shared/api/storage/framework/cache
mkdir -p /home/u435085854/deploy/corextor-platform/shared/api/storage/framework/sessions
mkdir -p /home/u435085854/deploy/corextor-platform/shared/api/storage/framework/testing
mkdir -p /home/u435085854/deploy/corextor-platform/shared/api/storage/framework/views
mkdir -p /home/u435085854/deploy/corextor-platform/shared/api/storage/logs
```

Pastikan file env production sudah ada:

```bash
ls -l /home/u435085854/deploy/corextor-platform/shared/api/.env
```

---

## 7. Standard Deployment Flow

### Standard production promotion

Flow normal yang direkomendasikan:

1. merge perubahan ke `main`
2. validasi state `main`
3. buat PR atau merge `main -> production`
4. push ke branch `production` memicu workflow deploy otomatis
5. workflow akan build, package, deploy, lalu verify

Kalau deploy live (`switch_live=true`), workflow sekarang otomatis menjalankan smoke test setelah release switch.

### Phase A: optional preflight release

Tujuannya memastikan release baru bisa boot tanpa langsung mengganti site live.

Jalankan workflow **Deploy Hostinger Production** secara manual dengan input:

```text
ref=main
switch_live=false
run_migrations=true
```

Yang akan dilakukan workflow:

1. checkout repo pada ref yang dipilih
2. build frontend di GitHub Actions
3. pack artifact `web-dist.tar.gz`
4. pack source archive `source-<release>.tar.gz`
5. upload artifacts ke server
6. upload `remote-deploy.sh`
7. extract source archive menjadi release baru di server
8. link `.env` shared
9. link `storage` shared
10. `composer install --no-dev`
11. `php artisan optimize:clear`
12. `php artisan migrate --force`
13. `php artisan config:cache`
14. `php artisan route:cache`
15. extract frontend artifact
16. assemble `current-web`
17. update symlink `candidate` dan `candidate-web`
18. **tidak** mengganti docroot live

### Phase B: smoke test preflight release

Verifikasi:

```bash
ls -la /home/u435085854/deploy/corextor-platform/current
ls -la /home/u435085854/deploy/corextor-platform/current-web
curl -i https://api.corextor.com/api/platform/v1/health
```

Kalau health check oke dan release tree terlihat benar, lanjut Phase C.

### Phase C: switch live

Jalankan workflow lagi secara manual dengan:

```text
ref=main
switch_live=true
run_migrations=true
```

Script remote akan:

- backup docroot existing dengan suffix `.bak-<release_id>`
- promote `candidate` menjadi `current`
- repoint path live ke `current-web`

Pada akun ini, target switch live yang benar:

```text
/home/u435085854/domains/corextor.com/apps/corextor/public
```

---

## 8. Post-Deploy Smoke Test

Jalankan smoke test berikut setelah switch live.

Catatan:

- workflow production sekarang sudah menjalankan smoke test otomatis untuk API, main app, dan employee app
- jika smoke test otomatis gagal setelah release switch, workflow akan menjalankan rollback otomatis ke release live sebelumnya
- smoke test manual di bawah tetap dipertahankan untuk operator review

### Domain reachability

```bash
curl -I https://corextor.com
curl -I https://app.corextor.com/pin
curl -I https://api.corextor.com/api/platform/v1/health
```

### API health

```bash
curl -s https://api.corextor.com/api/platform/v1/health
```

Expected minimal JSON:

```json
{
  "status": "success",
  "data": {
    "status": "healthy"
  }
}
```

### Login surfaces

Manual smoke test minimum:

1. `https://corextor.com/login`
2. `https://app.corextor.com/pin`
3. superadmin email login
4. company admin login
5. employee PIN login

### Asset and SPA routing

Manual smoke test:

1. open landing page
2. refresh directly on a nested route such as `/login`, `/company`, `/admin`
3. confirm SPA fallback still works

---

## 9. Hostinger-Specific Manual Fixes

### 9.1 `storage:link` may fail

Pada Hostinger ini, `php artisan storage:link` sempat gagal dengan error:

```text
Call to undefined function Illuminate\Filesystem\exec()
```

Jika itu terjadi, buat symlink manual:

```bash
ln -sfn \
  /home/u435085854/deploy/corextor-platform/current/api/storage/app/public \
  /home/u435085854/deploy/corextor-platform/current/api/public/storage
```

Verifikasi:

```bash
ls -la /home/u435085854/deploy/corextor-platform/current/api/public/storage
```

### 9.2 `.htaccess` must exist in static docroots

SPA routing untuk main site dan employee site bergantung pada `.htaccess`.
File ini harus ada di:

```text
current-web/.htaccess
current-web/app.corextor.com/.htaccess
```

Kalau nested route refresh menghasilkan 404, cek file ini terlebih dahulu.

### 9.3 Do not trust `public_html` blindly

Kalau switch live kelihatannya sukses tetapi site tidak berubah, cek lagi apakah domain benar-benar dibaca dari:

```text
/home/u435085854/domains/corextor.com/apps/corextor/public
```

Bukan dari symlink lain yang terlihat lebih "default".

---

## 10. Runtime Configuration Rules

### Never rely on `env()` at runtime

Corextor production memakai:

```bash
php artisan config:cache
```

Setelah config cache aktif, pemanggilan `env()` langsung di service/controller bisa menghasilkan `null` walaupun value ada di `.env`.

Ini pernah menyebabkan login production gagal dengan error:

```text
key must be a string when using hmac
```

Root cause-nya adalah `JWT_SECRET` dibaca langsung dari `env()` pada runtime.

Rule wajib:

- baca secret/value runtime dari `config(...)`
- mapping dari `.env` ke config dilakukan di file config, bukan di service

Referensi implementasi yang benar:

- [`api/config/app.php`](../api/config/app.php)
- [`TokenService.php`](../api/app/Modules/Platform/Identity/TokenService.php)
- [`SessionService.php`](../api/app/Modules/Platform/Session/SessionService.php)

---

## 11. Bootstrap Production Data

Production baru biasanya masih butuh bootstrap minimum:

- superadmin user
- product catalog dasar
- attendance product
- payroll product
- minimal plans untuk product aktif

Jangan commit password production ke repository.
Jika perlu initial password sementara, buat di environment aman lalu paksa ganti password setelah first login.

Checklist bootstrap:

- [ ] superadmin bisa login
- [ ] product `attendance` aktif
- [ ] product `payroll` aktif
- [ ] company dapat diberi subscription
- [ ] employee app route dapat diakses

---

## 12. Rollback Procedure

### Recommended rollback path

Gunakan workflow:

```text
Rollback Hostinger Production
```

Input:

```text
target_release_id = kosongkan untuk rollback ke release sebelumnya
run_smoke_test = true
```

Workflow ini memakai script:

- [`rollback-release.sh`](../ops/hostinger/rollback-release.sh)

Yang diubah saat rollback:

- `current`
- `current-web`
- symlink docroot live utama

Yang tidak disentuh:

- database
- shared `.env`
- shared storage

### Fast rollback for web/docroot

Cari backup yang otomatis dibuat oleh script:

```bash
ls -la /home/u435085854/domains/corextor.com/apps/corextor | grep 'public.bak-'
```

Lalu restore:

```bash
mv /home/u435085854/domains/corextor.com/apps/corextor/public /home/u435085854/domains/corextor.com/apps/corextor/public.failed-<timestamp>
mv /home/u435085854/domains/corextor.com/apps/corextor/public.bak-<release_id> /home/u435085854/domains/corextor.com/apps/corextor/public
```

### Rollback current release symlink

Kalau perlu mengembalikan `current`:

```bash
ln -sfn /home/u435085854/deploy/corextor-platform/releases/<previous_release_id> \
  /home/u435085854/deploy/corextor-platform/current
```

Kalau perlu mengembalikan `current-web`:

```bash
ln -sfn /home/u435085854/deploy/corextor-platform/releases/docroot-<previous_release_id> \
  /home/u435085854/deploy/corextor-platform/current-web
```

Setelah rollback, ulangi smoke test minimal:

```bash
curl -I https://corextor.com
curl -I https://app.corextor.com/pin
curl -s https://api.corextor.com/api/platform/v1/health
```

---

## 13. Troubleshooting Matrix

| Symptom | Likely cause | First check |
|---------|--------------|-------------|
| `corextor.com` tidak berubah setelah deploy | docroot live salah | cek symlink `/domains/corextor.com/apps/corextor/public` |
| nested SPA route 404 | `.htaccess` hilang | cek `current-web/.htaccess` dan `current-web/app.corextor.com/.htaccess` |
| avatar/file public tidak load | symlink `public/storage` tidak ada | cek `current/api/public/storage` |
| login 500 dengan HMAC/JWT error | runtime masih memakai `env()` | cek `config/app.php` dan service auth |
| health 503 | DB critical down | cek `platform_db` dulu, lalu `attendance_db` / `payroll_db` |
| employee logout/session expiry kembali ke login admin | build lama / routing mismatch | pastikan build terbaru dan host-aware routing aktif |

---

## 14. Operational Checklist Before Declaring Production Ready

- [ ] all three domains resolve with valid HTTPS
- [ ] API health returns `healthy`
- [ ] superadmin email login works
- [ ] company admin login works
- [ ] employee PIN login works
- [ ] profile image upload works
- [ ] main site route refresh works
- [ ] employee site route refresh works
- [ ] public storage symlink verified
- [ ] latest release id documented
- [ ] rollback target identified

---

## 15. Related Files

- Workflow production utama:
  [`deploy-hostinger.yml`](../.github/workflows/deploy-hostinger.yml)
- Workflow rollback manual:
  [`rollback-hostinger.yml`](../.github/workflows/rollback-hostinger.yml)
- Template branch-based flow:
  [`deploy-from-production-branch.yml`](../ops/cicd/templates/deploy-from-production-branch.yml)
- Remote server script:
  [`remote-deploy.sh`](../ops/hostinger/remote-deploy.sh)
- Remote rollback script:
  [`rollback-release.sh`](../ops/hostinger/rollback-release.sh)
- Hostinger-specific appendix:
  [`ops/hostinger/README.md`](../ops/hostinger/README.md)
- Frontend production env template:
  [`web.production.env`](../ops/hostinger/examples/web.production.env)
- API production env template:
  [`api.production.env`](../ops/hostinger/examples/api.production.env)
