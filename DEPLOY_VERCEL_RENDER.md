# Deploying to Vercel (Frontend) and Render (Backend)

## 1. Backend: Deploying to Render via Blueprint

Render makes deploying Docker-based applications exceptionally straightforward natively from your GitHub repo.

1. **Push your changes to GitHub** (make sure `render.yaml` exists in the repository root).
2. Go to the [Render Dashboard](https://dashboard.render.com).
3. Click "New +" and select **Blueprint**.
4. Give Render permission to access your repository and choose your `FairSwarm` repo.
5. Render will detect the `render.yaml` specification. Click **Apply**.
6. When prompted, fill in the two required sensitive environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
7. Click Save. The deployment will automatically begin.

### Using GitHub Actions for Render (Optional)
If you wish to use the `.github/workflows/deploy.yml` pipeline to trigger Render deployments upon pushes to `main`:
1. Get your **Render API Key** from your Render Account Settings.
2. In your Render Dashboard, look at your deployed Web Service URL or Settings to find the **Service ID** (it usually begins with `srv-`).
3. Add the following repository secrets in GitHub:
   - `RENDER_API_KEY`
   - `RENDER_SERVICE_ID`

---

## 2. Frontend: Deploying to Vercel

1. Create a project on the [Vercel Dashboard](https://vercel.com/dashboard) linked to the same repository.
2. Select the `frontend` directory as the Root Directory.
3. Configure the Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` -> Point this to your Render deployment URL (e.g. `https://fairswarm-backend.onrender.com/api/v1`)
4. Vercel will process `vercel.json` natively for security headers.
5. Set up **GitHub Action Deploy** environments by adding these Vercel secrets in your repository settings:
   - `VERCEL_TOKEN`: Found under Vercel Account Settings -> Tokens.
   - `VERCEL_ORG_ID`: Found under Vercel -> Settings -> General (or in `.vercel/project.json` if linked locally) 
   - `VERCEL_PROJECT_ID`: Found under your specific Project -> Settings -> General.

---

## 3. Smoke Tests (GitHub Actions)

Your deployment workflow runs smoke tests after standard deployments exist. For this to work, ensure you provide:
- `PROD_FRONTEND_URL` -> Your `.vercel.app` or custom domain.
- `PROD_BACKEND_URL` -> Your `.onrender.com` or custom backend domain.
