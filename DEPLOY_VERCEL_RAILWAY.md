# FairSwarm Production Deployment Guide (Vercel + Railway)

This guide gets FairSwarm live with a secure setup:
- Frontend on Vercel
- Backend on Railway
- Source of truth in GitHub

## 1. Pre-Deploy Security Checklist

1. Confirm `.gitignore` includes all secret and env files.
2. Keep only templates in git: `backend/.env.example` and `frontend/.env.example`.
3. Never paste real keys into code, PR comments, or workflow YAML.
4. Rotate any key immediately if it was ever committed.

## 2. Required Keys and Secrets

Collect these values before deployment.

### Backend app secrets (Railway service variables)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET_KEY` (minimum 32+ random characters)
- `JWT_ALGORITHM` (use `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` (example: `60`)
- `REFRESH_TOKEN_EXPIRE_DAYS` (example: `7`)
- `MAX_FILE_SIZE_MB` (example: `50`)
- `MAX_REQUEST_SIZE_MB` (example: `55`)
- `MAX_JSON_BODY_KB` (example: `10`)
- `SUPABASE_STORAGE_BUCKET` (example: `datasets`)
- `RATE_LIMIT_PER_MINUTE` (example: `100`)
- `AI_RATE_LIMIT` (example: `10`)
- `CORS_ORIGINS` (example: `["https://your-frontend-domain.vercel.app"]`)
- `CSRF_COOKIE_SECURE` (set `true`)
- `ENVIRONMENT` (set `production`)

If AI features are enabled, also set:
- `NVIDIA_API_KEY`
- `GOOGLE_AI_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`

### Frontend app secrets (Vercel project environment variables)
- `BACKEND_INTERNAL_URL` = `https://your-railway-backend.up.railway.app/api/v1`
- `NEXT_PUBLIC_API_BASE_URL` = `https://your-railway-backend.up.railway.app/api/v1`
- `NEXT_PUBLIC_WS_BASE_URL` = `wss://your-railway-backend.up.railway.app`

### GitHub Actions secrets (for `.github/workflows/deploy.yml`)
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `RAILWAY_TOKEN`
- `RAILWAY_PROJECT_ID`
- `RAILWAY_SERVICE_ID`
- `PROD_FRONTEND_URL` (for smoke tests)
- `PROD_BACKEND_URL` (for smoke tests)
- `DEPLOY_WEBHOOK_URL` (optional)

## 3. Railway Backend Deployment

1. In Railway, create a new project from GitHub and select this repo.
2. Set the backend service root to `backend`.
3. Keep Dockerfile deployment enabled (this repo includes `backend/Dockerfile` and `backend/railway.json`).
4. Add all backend variables listed above in Railway:
   - Railway dashboard -> Project -> Backend service -> Variables.
5. Deploy.
6. Verify health endpoint:
   - `https://<railway-domain>/health` returns `{ "status": "ok" ... }`.
7. Copy your backend public URL for Vercel env setup.

## 4. Vercel Frontend Deployment

1. In Vercel, import the same GitHub repo.
2. Set root directory to `frontend`.
3. Add frontend environment variables:
   - Vercel dashboard -> Project -> Settings -> Environment Variables.
4. Deploy to Production.
5. Open the app URL and test:
   - Login/register
   - Dataset upload
   - Start analysis

## 5. GitHub Secure Push and Auto-Deploy

Use this flow from repo root:

```bash
git status
git add .
git commit -m "chore: harden deployment config and add production runbook"
git push origin main
```

After push:
1. GitHub Actions `Deploy` workflow runs automatically on `main`.
2. It deploys frontend to Vercel, backend to Railway, then runs smoke tests.

## 6. Where to Put Each Secret

- Railway runtime app secrets:
  - Railway dashboard -> Service -> Variables.
- Vercel frontend env vars:
  - Vercel dashboard -> Project -> Settings -> Environment Variables.
- CI/CD deploy credentials:
  - GitHub -> Repo -> Settings -> Secrets and variables -> Actions.

## 7. Domain and HTTPS Notes

1. Add custom frontend domain in Vercel (optional, recommended).
2. Update backend `CORS_ORIGINS` to include the final domain.
3. Ensure frontend uses `https://` backend URL and `wss://` for websocket URL.
4. Keep `CSRF_COOKIE_SECURE=true` in production.

## 8. Post-Deploy Verification

1. Frontend loads without console auth errors.
2. `GET /health` on backend returns `ok`.
3. Login succeeds and cookies are set as `Secure` in production.
4. Analysis and report generation complete.
5. No secrets appear in logs.

## 9. Key Rotation Playbook

If a secret is leaked:
1. Revoke and rotate the leaked key at provider side.
2. Update Railway/Vercel/GitHub secret values.
3. Redeploy both services.
4. Invalidate sessions if `JWT_SECRET_KEY` was rotated.
