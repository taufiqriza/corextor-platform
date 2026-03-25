# Hostinger Deployment Notes

This project is best deployed to Hostinger as a hybrid release:

- `api/`: deployed on the server with `git clone` + `composer install`
- `web/`: built in CI or locally, then uploaded as static assets

This split is required because the current Hostinger account has `git`, `php`, and `composer`, but **does not have Node.js/npm** installed.

## Current server findings

Verified from the Hostinger server on March 26, 2026:

- `corextor.com` is live and still points to the old Laravel project
- `app.corextor.com` currently resolves, but serves the Hostinger default page
- `api.corextor.com` does **not** resolve yet
- the existing DB user `u435085854_corextor` only has privileges on `u435085854_corextor.*`
- the existing legacy app lives at `/home/u435085854/domains/corextor.com/apps/corextor`
- the standardized release base is already prepared at `/home/u435085854/deploy/corextor-platform`

## Required hPanel preparation

Before switching production traffic, complete these steps in Hostinger hPanel:

1. Create or verify subdomains:
   - `app.corextor.com`
   - `api.corextor.com`
2. Verify the actual Hostinger subdomain mapping.
   On this account, the current pattern is:
   - main: `/home/u435085854/domains/corextor.com/public_html`
   - employee subdomain: `/home/u435085854/domains/corextor.com/public_html/app.corextor.com`
   - api subdomain: `/home/u435085854/domains/corextor.com/public_html/api.corextor.com`
   This means only the **primary** `public_html` path is switched live, while the deploy script assembles the `app.corextor.com` and `api.corextor.com` subfolders inside it.
3. Create three production databases and users:
   - `u435085854_corextor_platform`
   - `u435085854_corextor_attendance`
   - `u435085854_corextor_payroll`
4. Put the final production API env file on the server:
   - target path: `/home/u435085854/deploy/corextor-platform/shared/api/.env`
   - base template: `ops/hostinger/examples/api.production.env`

## Recommended deployment model

Use GitHub Actions for repeatable production deployments.

- API release is created on Hostinger via `git clone`
- frontend is built in GitHub Actions and uploaded as a tarball
- docroots are switched only when you explicitly allow it

This repo includes:

- workflow: `.github/workflows/deploy-hostinger.yml`
- remote release script: `ops/hostinger/remote-deploy.sh`

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
- `HOSTINGER_PRIMARY_DOCROOT=/home/u435085854/domains/corextor.com/public_html`
- `HOSTINGER_EMPLOYEE_SUBDIR_NAME=app.corextor.com`
- `HOSTINGER_API_SUBDIR_NAME=api.corextor.com`
- `VITE_API_URL=https://api.corextor.com/api`
- `VITE_MAIN_APP_ORIGIN=https://corextor.com`
- `VITE_EMPLOYEE_APP_ORIGIN=https://app.corextor.com`

### Repository secret

- `HOSTINGER_SSH_PRIVATE_KEY`

This should be a private key that already has SSH access to the Hostinger account.

## First production rollout

1. Complete the hPanel preparation above.
2. Upload `/home/u435085854/deploy/corextor-platform/shared/api/.env`.
3. Run the GitHub Actions workflow `Deploy Hostinger` with:
   - `switch_live=false`
   - `run_migrations=true`
4. Verify:
   - release exists under `/home/u435085854/deploy/corextor-platform/releases`
   - API release boots successfully
   - frontend artifact extracts correctly
5. Run the workflow again with:
   - `switch_live=true`
   - `run_migrations=true`

The remote script will back up existing docroots with a `.bak-<release_id>` suffix before repointing them.

## Rollback

If a switch already happened:

1. Find the previous backup beside the affected docroot
2. Repoint the symlink or restore the backup directory manually
3. Optionally repoint:
   - `/home/u435085854/deploy/corextor-platform/current`
   - `/home/u435085854/deploy/corextor-platform/current-web`

## Why not deploy directly on the Hostinger server?

Because the server currently lacks `node`, `npm`, and `npx`, a full in-server build is not reliable for this repo. CI-built frontend artifacts are the safer and more repeatable option.
