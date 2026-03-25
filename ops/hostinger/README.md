# Hostinger Deployment Notes

This file is the **operator appendix** for Hostinger production.
The canonical runbook is:

- [`doc/deployment.md`](../../doc/deployment.md)

Use this file when you specifically need Hostinger paths, workflow variables, or server quirks.

## Verified server topology

Verified on March 26, 2026:

- SSH host: `145.223.108.160`
- SSH port: `65002`
- SSH user: `u435085854`
- standardized release base:
  - `/home/u435085854/deploy/corextor-platform`
- live primary docroot on this account:
  - `/home/u435085854/domains/corextor.com/apps/corextor/public`
- release symlink target:
  - `/home/u435085854/deploy/corextor-platform/current-web`
- employee SPA is served from nested subdir:
  - `current-web/app.corextor.com`
- API is served from nested symlink:
  - `current-web/api.corextor.com -> current/api/public`

Important:

- do **not** assume `public_html` is the active live path
- on this account, the real cutover point is `apps/corextor/public`

## Recommended deployment model

Use GitHub Actions for repeatable production deployments.
Recommended standard:

- production is promoted from the `production` branch in the same repo
- `main` stays as normal development timeline
- Hostinger only receives packaged source + built frontend artifact

Deployment model:

- `api/`: deploy from uploaded source archive + `composer install`
- `web/`: build in CI, upload as tarball, extract on server

This is required because the Hostinger account has:

- `git`
- `php`
- `composer`
- **no `node` / `npm`**

Fallback note:

- `workflow_dispatch` still exists for operator fallback
- production standard should follow the branch-based flow in [`ops/cicd/README.md`](../cicd/README.md)

## Required GitHub configuration

### Repository variables

- `HOSTINGER_SSH_HOST`
- `HOSTINGER_SSH_PORT`
- `HOSTINGER_SSH_USER`
- `HOSTINGER_DEPLOY_BASE`
- `HOSTINGER_PRIMARY_DOCROOT`
- `HOSTINGER_EMPLOYEE_SUBDIR_NAME`
- `HOSTINGER_API_SUBDIR_NAME`
- `VITE_API_URL`
- `VITE_MAIN_APP_ORIGIN`
- `VITE_EMPLOYEE_APP_ORIGIN`

Recommended values for this server:

- `HOSTINGER_SSH_HOST=145.223.108.160`
- `HOSTINGER_SSH_PORT=65002`
- `HOSTINGER_SSH_USER=u435085854`
- `HOSTINGER_DEPLOY_BASE=/home/u435085854/deploy/corextor-platform`
- `HOSTINGER_PRIMARY_DOCROOT=/home/u435085854/domains/corextor.com/apps/corextor/public`
- `HOSTINGER_EMPLOYEE_SUBDIR_NAME=app.corextor.com`
- `HOSTINGER_API_SUBDIR_NAME=api.corextor.com`
- `VITE_API_URL=https://api.corextor.com/api`
- `VITE_MAIN_APP_ORIGIN=https://corextor.com`
- `VITE_EMPLOYEE_APP_ORIGIN=https://app.corextor.com`

### Repository secret

- `HOSTINGER_SSH_PRIVATE_KEY`

This should be a private key that already has SSH access to the Hostinger account.

## Operator checklist

Before switching live:

1. `.env` production exists at:
   - `/home/u435085854/deploy/corextor-platform/shared/api/.env`
2. databases are reachable
3. workflow variables/secrets are set
4. preflight deploy with `switch_live=false` succeeds
5. `https://api.corextor.com/api/platform/v1/health` is healthy
6. `candidate` and `candidate-web` are created without changing `current` and `current-web`

## Server-specific gotchas

### `storage:link` can fail

If `php artisan storage:link` fails on Hostinger, create the symlink manually:

```bash
ln -sfn \
  /home/u435085854/deploy/corextor-platform/current/api/storage/app/public \
  /home/u435085854/deploy/corextor-platform/current/api/public/storage
```

### Runtime code must not call `env()` directly

Production uses `php artisan config:cache`.
If runtime code still calls `env('JWT_SECRET')` or similar directly, production auth can break even when `.env` is correct.

Always read deploy/runtime secrets through `config(...)`.

## Why not deploy fully on the Hostinger server?

Because the server lacks `node`, `npm`, and `npx`, a full in-server frontend build is not reliable for this repo. CI-built frontend artifacts are the safer and repeatable option.
