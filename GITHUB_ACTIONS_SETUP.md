# GitHub Actions Deployment Setup

This guide will help you set up automated deployment to Google Cloud Run using GitHub Actions.

## Overview

The repository includes two GitHub Actions workflows:
- **`.github/workflows/deploy-beta.yml`** - Deploys to beta when you push to `beta` branch
- **`.github/workflows/deploy-production.yml`** - Deploys to production when you push to `main` branch

## Setup Steps

### Step 1: Create a Google Cloud Service Account

1. **Go to IAM & Admin > Service Accounts:**
   ```
   https://console.cloud.google.com/iam-admin/serviceaccounts?project=da-mcp
   ```

2. **Click "Create Service Account"**
   - Name: `github-actions-deployer`
   - Description: `Service account for GitHub Actions to deploy to Cloud Run`
   - Click "Create and Continue"

3. **Grant Roles:**
   Add these roles:
   - `Cloud Run Admin` (roles/run.admin)
   - `Service Account User` (roles/iam.serviceAccountUser)
   - `Cloud Build Editor` (roles/cloudbuild.builds.editor)
   - `Storage Admin` (roles/storage.admin)

   Click "Continue", then "Done"

### Step 2: Create and Download Service Account Key

1. **Find your service account** in the list
2. **Click on it** to open details
3. **Go to "Keys" tab**
4. **Click "Add Key" > "Create new key"**
5. **Select "JSON"** format
6. **Click "Create"**
   - A JSON file will download to your computer
   - ⚠️ Keep this file secure! It contains credentials

### Step 3: Add Secret to GitHub

1. **Go to your GitHub repository:**
   ```
   https://github.com/nptl/da-bc-mcp/settings/secrets/actions
   ```

2. **Click "New repository secret"**

3. **Create the secret:**
   - Name: `GCP_SA_KEY`
   - Value: Open the downloaded JSON file and copy its **entire contents**
   - Click "Add secret"

### Step 4: Verify Setup

1. **Go to Actions tab:**
   ```
   https://github.com/nptl/da-bc-mcp/actions
   ```

2. **You should see two workflows:**
   - Deploy to Cloud Run (Beta)
   - Deploy to Cloud Run (Production)

### Step 5: Test Deployment

#### Test Beta Deployment:

**Option A: Push to beta branch**
```bash
cd /Users/nirajpatel/da-bc-mcp-server
git checkout beta
git commit --allow-empty -m "Test: Trigger beta deployment"
git push origin beta
```

**Option B: Manual trigger**
1. Go to: https://github.com/nptl/da-bc-mcp/actions
2. Click "Deploy to Cloud Run (Beta)"
3. Click "Run workflow" dropdown
4. Select `beta` branch
5. Click "Run workflow"

#### Test Production Deployment:

**Option A: Push to main branch**
```bash
git checkout main
git commit --allow-empty -m "Test: Trigger production deployment"
git push origin main
```

**Option B: Manual trigger**
1. Go to: https://github.com/nptl/da-bc-mcp/actions
2. Click "Deploy to Cloud Run (Production)"
3. Click "Run workflow" dropdown
4. Select `main` branch
5. Click "Run workflow"

### Step 6: Monitor Deployment

1. **Watch the workflow run:**
   - Go to Actions tab in GitHub
   - Click on the running workflow
   - Watch the logs in real-time

2. **Deployment takes ~5-7 minutes:**
   - Build container: ~3-4 minutes
   - Deploy to Cloud Run: ~1-2 minutes
   - Health check: ~30 seconds

3. **Get the service URL:**
   - The workflow will output the service URL in the logs
   - Look for: `Beta service deployed to https://...`
   - Or check Cloud Run console: https://console.cloud.google.com/run?project=da-mcp

## Troubleshooting

### Error: "Permission Denied"

**Problem:** Service account doesn't have enough permissions

**Solution:**
```bash
# Run these commands in your terminal
gcloud projects add-iam-policy-binding da-mcp \
  --member=serviceAccount:github-actions-deployer@da-mcp.iam.gserviceaccount.com \
  --role=roles/run.admin

gcloud projects add-iam-policy-binding da-mcp \
  --member=serviceAccount:github-actions-deployer@da-mcp.iam.gserviceaccount.com \
  --role=roles/cloudbuild.builds.editor
```

### Error: "Service account key is invalid"

**Problem:** The JSON key wasn't copied correctly

**Solution:**
1. Delete the `GCP_SA_KEY` secret from GitHub
2. Re-download the service account key
3. Copy the **entire** JSON file contents (including `{` and `}`)
4. Add it as a new secret

### Error: "Billing not enabled"

**Problem:** Google Cloud billing is not set up

**Solution:**
1. Go to: https://console.cloud.google.com/billing/linkedaccount?project=da-mcp
2. Link a billing account
3. Re-run the workflow

### Workflow doesn't trigger

**Problem:** GitHub Actions might be disabled

**Solution:**
1. Go to: https://github.com/nptl/da-bc-mcp/settings/actions
2. Ensure "Actions permissions" is set to "Allow all actions and reusable workflows"

## Daily Usage

Once set up, deployment is automatic:

### Deploy to Beta:
```bash
# Make your changes
git checkout beta
git add .
git commit -m "Your changes"
git push origin beta

# GitHub Actions automatically deploys!
# Check progress: https://github.com/nptl/da-bc-mcp/actions
```

### Deploy to Production:
```bash
# Merge beta to main after testing
git checkout main
git merge beta
git push origin main

# GitHub Actions automatically deploys!
```

## Service URLs

After successful deployment, your services will be available at:

- **Beta:** `https://da-bc-mcp-server-beta-xxxxx-uc.a.run.app`
- **Production:** `https://da-bc-mcp-server-prod-xxxxx-uc.a.run.app`

You can find the exact URLs in:
1. GitHub Actions logs (after deployment)
2. Cloud Run console: https://console.cloud.google.com/run?project=da-mcp

## Security Best Practices

1. ✅ Service account key is stored as GitHub secret (encrypted)
2. ✅ Service account has minimal required permissions
3. ✅ Secrets are never exposed in logs
4. ✅ Each environment (beta/prod) is isolated

## Cost Monitoring

After deployment, monitor costs:
- https://console.cloud.google.com/billing/

Expected costs:
- **Beta:** ~$5-10/month (scales to zero)
- **Production:** ~$15-30/month (min 1 instance)

---

**Next Steps:**
1. Complete Step 1-3 above
2. Test beta deployment
3. Get service URL
4. Configure OpenAI workflow with the URL
