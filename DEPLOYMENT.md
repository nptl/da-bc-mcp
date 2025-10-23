# Google Cloud Run Deployment Guide

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed ([Install guide](https://cloud.google.com/sdk/docs/install))
3. **Docker** (optional, for local testing)

## Initial Setup

### 1. Create Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="your-project-id-here"

# Create project (if new)
gcloud projects create $PROJECT_ID --name="DA BC MCP Server"

# Set as active project
gcloud config set project $PROJECT_ID
```

### 2. Enable Required APIs

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Enable Artifact Registry API (recommended)
gcloud services enable artifactregistry.googleapis.com
```

### 3. Set up Billing

Ensure billing is enabled for your project:
```bash
# Check billing status
gcloud beta billing projects describe $PROJECT_ID
```

If not enabled, go to: https://console.cloud.google.com/billing

## Deployment

### Beta Environment

```bash
# Deploy beta
./deploy-beta.sh YOUR_PROJECT_ID
```

This will:
1. Build the Docker container using Cloud Build
2. Push to Google Container Registry
3. Deploy to Cloud Run with `NODE_ENV=beta`
4. Output the service URL

**Expected Output:**
```
Service URL: https://da-bc-mcp-server-beta-xxxxx.run.app
```

### Production Environment

```bash
# Deploy production
./deploy-production.sh YOUR_PROJECT_ID
```

This will:
1. Use the same container image
2. Deploy with `NODE_ENV=production`
3. Higher resource allocation (min instances: 1)

**Expected Output:**
```
Service URL: https://da-bc-mcp-server-prod-xxxxx.run.app
```

## Manual Deployment Steps

If you prefer manual control:

### Build Container

```bash
gcloud builds submit --config cloudbuild.yaml
```

### Deploy Beta

```bash
gcloud run deploy da-bc-mcp-server-beta \
  --image gcr.io/$PROJECT_ID/da-bc-mcp-server:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=beta"
```

### Deploy Production

```bash
gcloud run deploy da-bc-mcp-server-prod \
  --image gcr.io/$PROJECT_ID/da-bc-mcp-server:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 20 \
  --min-instances 1 \
  --set-env-vars "NODE_ENV=production"
```

## Environment Configuration

The container includes both `.env.beta` and `.env.production` files.

The `NODE_ENV` environment variable determines which configuration is loaded:
- `NODE_ENV=beta` → Uses `.env.beta`
- `NODE_ENV=production` → Uses `.env.production`

## Testing Deployment

### Test Beta

```bash
BETA_URL=$(gcloud run services describe da-bc-mcp-server-beta --platform managed --region us-central1 --format 'value(status.url)')

# Health check
curl $BETA_URL
```

### Test Production

```bash
PROD_URL=$(gcloud run services describe da-bc-mcp-server-prod --platform managed --region us-central1 --format 'value(status.url)')

# Health check
curl $PROD_URL
```

## Monitoring

### View Logs

```bash
# Beta logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=da-bc-mcp-server-beta" --limit 50

# Production logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=da-bc-mcp-server-prod" --limit 50
```

### View Metrics

Go to: https://console.cloud.google.com/run

Select your service to see:
- Request count
- Request latency
- CPU/Memory usage
- Error rates

## Cost Optimization

### Beta Environment
- **Min instances:** 0 (scales to zero when not in use)
- **Max instances:** 10
- **Memory:** 512Mi
- **Estimated cost:** ~$5-10/month (with moderate usage)

### Production Environment
- **Min instances:** 1 (always running for fast response)
- **Max instances:** 20
- **Memory:** 512Mi
- **Estimated cost:** ~$15-30/month

### Reduce Costs
```bash
# Scale beta to zero when not testing
gcloud run services update da-bc-mcp-server-beta \
  --min-instances 0 \
  --max-instances 5
```

## Updating the Service

### Update Code
```bash
# 1. Make changes locally
# 2. Commit to git
git add .
git commit -m "Update: description"
git push origin main

# 3. Rebuild and redeploy
./deploy-beta.sh $PROJECT_ID
./deploy-production.sh $PROJECT_ID
```

### Update Environment Variables Only
```bash
# Update beta
gcloud run services update da-bc-mcp-server-beta \
  --update-env-vars "NODE_ENV=beta"

# Update production
gcloud run services update da-bc-mcp-server-prod \
  --update-env-vars "NODE_ENV=production,NEW_VAR=value"
```

## Troubleshooting

### Build Fails
```bash
# Check build logs
gcloud builds list --limit 5

# View specific build
gcloud builds describe BUILD_ID
```

### Deployment Fails
```bash
# Check service status
gcloud run services describe da-bc-mcp-server-beta --region us-central1

# Check recent deployments
gcloud run revisions list --service da-bc-mcp-server-beta --region us-central1
```

### Runtime Errors
```bash
# Stream logs in real-time
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=da-bc-mcp-server-beta"
```

## Security

### Authentication (if needed)
To require authentication:
```bash
gcloud run services update da-bc-mcp-server-beta \
  --no-allow-unauthenticated
```

Then use:
```bash
# Get auth token
gcloud auth print-identity-token

# Make request
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  https://da-bc-mcp-server-beta-xxxxx.run.app
```

### Service Account
Cloud Run uses the default Compute Engine service account.

To use a custom service account:
```bash
gcloud run services update da-bc-mcp-server-beta \
  --service-account YOUR_SERVICE_ACCOUNT@PROJECT_ID.iam.gserviceaccount.com
```

## Next Steps

After deployment:
1. Get the service URLs
2. Configure OpenAI workflows to use these URLs
3. Whitelist the Cloud Run URLs in OpenAI
4. Test end-to-end with AI agents

---

**Questions?** Check the [Cloud Run Documentation](https://cloud.google.com/run/docs)
