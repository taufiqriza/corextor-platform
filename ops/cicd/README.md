# Corextor CI/CD Architecture

Dokumen ini menjelaskan pola CI/CD yang direkomendasikan untuk Corextor setelah membandingkan workflow:

- `santriexpress`
- `TAMS-v2`

## 1. Apa yang dipelajari dari SantriExpress dan TAMS-v2

Kedua project referensi memakai pola yang sehat dan sederhana:

1. source code tetap di satu repo
2. frontend dibuild di GitHub Actions
3. artifact hasil build dipakai untuk deploy
4. backend dipersiapkan di server
5. deploy terjadi otomatis saat branch utama yang dijadikan production berubah
6. production diverifikasi setelah deploy

Yang layak diadopsi ke Corextor:

- tidak ada copy manual dari laptop
- build frontend selalu terjadi di CI
- server tidak dipaksa build Node.js
- release production harus repeatable
- verify URL production menjadi bagian workflow

## 2. Kenapa Corextor tidak sebaiknya deploy langsung dari `main`

Walau referensi deploy langsung dari branch utama, untuk Corextor itu kurang ideal.

Alasannya:

- `main` masih dipakai sebagai timeline aktif development
- kita tetap ingin `main` bebas dipakai untuk staging, eksperimen aman, dan iterasi cepat
- production harus menjadi promotion yang disengaja
- Corextor punya tiga surface production:
  - `corextor.com`
  - `app.corextor.com`
  - `api.corextor.com`

Jadi model yang direkomendasikan adalah:

- tetap satu repo
- `main` = integration / staging timeline
- `production` = branch deploy production
- workflow deploy berjalan saat branch `production` di-update

## 3. Arsitektur yang direkomendasikan

### Branch model

```text
main
└── jalur development aktif / staging timeline

production
└── branch khusus yang merepresentasikan state production
```

### Promotion flow

1. developer merge ke `main`
2. QA / review dilakukan terhadap state `main`
3. saat siap production, lakukan promotion dari `main` ke `production`
4. push/merge ke `production` memicu GitHub Actions deploy
5. server Hostinger menerima:
   - source archive
   - frontend artifact
   - remote deploy command

### Kenapa ini lebih baik

- tetap satu repo
- secret production tetap bisa tinggal di repo yang sama bila memang diinginkan
- `main` tidak otomatis memukul production
- commit production tetap bisa diaudit jelas melalui history branch `production`
- deployment tetap semulus referensi karena dipicu GitHub Actions

## 4. Standard branch strategy

Rekomendasi default:

- `main`: jalur kerja harian
- `production`: branch deploy

Rekomendasi operasional:

1. lindungi branch `production`
2. izinkan update ke `production` hanya lewat PR dari `main` atau hotfix branch
3. aktifkan reviewer wajib untuk branch `production`
4. bila GitHub plan memungkinkan, gunakan environment protection untuk `production`
5. aktifkan status check wajib:
   - `build-web`
   - `deploy`
6. aktifkan `require review from code owners` bila rule GitHub dipakai

Optional:

- `hotfix/*` untuk perbaikan cepat yang perlu masuk production lebih dulu

## 5. Trigger strategy

### Recommended standard

Workflow deploy dipicu oleh:

- `push` ke branch `production`

Ini berarti deploy production terjadi ketika:

- `main` di-merge ke `production`, atau
- commit tertentu di-push ke `production`

### Manual fallback

Workflow juga tetap mendukung:

- `workflow_dispatch`

Ini berguna untuk:

- redeploy commit tertentu
- preflight tanpa switch live
- rerun deploy setelah perbaikan env/infra

## 6. Hostinger release model

Corextor tetap memakai model hybrid yang sama:

- `web/` dibuild di GitHub Actions
- `api/` tidak dibuild di Hostinger, hanya di-prepare via Composer
- server menerima archive source dan artifact frontend

Server Hostinger saat ini punya:

- `php`
- `composer`
- `git`
- tidak punya `node` / `npm`

Karena itu frontend wajib dibuild di CI, bukan di server.

## 7. Files yang menjadi fondasi deploy

Workflow production utama di source repo:

- [`deploy-hostinger.yml`](../../.github/workflows/deploy-hostinger.yml)

Workflow rollback manual:

- [`rollback-hostinger.yml`](../../.github/workflows/rollback-hostinger.yml)

Remote release script:

- [`remote-deploy.sh`](../hostinger/remote-deploy.sh)

Remote rollback script:

- [`rollback-release.sh`](../hostinger/rollback-release.sh)

Source archive packer:

- [`create-source-archive.sh`](./create-source-archive.sh)

Template branch-based workflow:

- [`deploy-from-production-branch.yml`](./templates/deploy-from-production-branch.yml)

## 8. Recommended repo settings

GitHub repository variables minimal:

```text
HOSTINGER_SSH_HOST
HOSTINGER_SSH_PORT
HOSTINGER_SSH_USER
HOSTINGER_DEPLOY_BASE
HOSTINGER_PRIMARY_DOCROOT
HOSTINGER_EMPLOYEE_SUBDIR_NAME
HOSTINGER_API_SUBDIR_NAME
VITE_API_URL
VITE_MAIN_APP_ORIGIN
VITE_EMPLOYEE_APP_ORIGIN
```

GitHub secret minimal:

```text
HOSTINGER_SSH_PRIVATE_KEY
```

## 9. Recommended team workflow

Alur yang paling sehat:

1. developer kerja biasa di branch feature
2. merge ke `main`
3. validasi di environment normal/staging
4. buat PR `main -> production`
5. review final
6. merge PR
7. GitHub Actions deploy otomatis ke production

Guardrail tambahan yang sekarang direkomendasikan:

8. smoke test otomatis sesudah deploy live
9. auto rollback jika smoke test gagal
10. workflow rollback manual jika operator perlu memilih release tertentu

Kalau perlu redeploy tanpa merge baru:

1. buka workflow manual
2. pilih `ref`
3. pilih `switch_live`
4. pilih `run_migrations`

## 10. Optional next level

Kalau nanti ingin lebih matang lagi:

- tambahkan GitHub Environment `production`
- tambahkan approval sebelum job deploy berjalan
- tambahkan release tag setelah deploy sukses
- tambahkan notifikasi Slack/WhatsApp/email untuk release result

## 11. Summary rule

Rule yang direkomendasikan untuk Corextor:

- satu repo
- `main` tetap jadi jalur utama development
- `production` jadi branch khusus deploy
- deploy production dipicu oleh perubahan branch `production`
- CI/CD tetap artifact-based, bukan manual copy
