# Production Domain Setup - mcp1.damensch.com

## Current Status

**DNS:** ✅ Correctly pointing to Google Cloud
**Domain Mapping:** ❌ Needs to be completed in Cloud Run
**SSL Certificate:** ⏳ Will auto-provision once mapping is active

## Quick Fix - Map Domain in Cloud Run Console

### Option 1: Using GCP Console (Easiest)

1. Go to: https://console.cloud.google.com/run/detail/us-central1/da-bc-mcp-server-prod/metrics?project=da-mcp

2. Click **"MANAGE CUSTOM DOMAINS"** tab at the top

3. Click **"ADD MAPPING"** button

4. Select service: `da-bc-mcp-server-prod`

5. Enter domain: `mcp1.damensch.com`

6. Click **"CONTINUE"**

7. Verify DNS records match (they should already be configured)

8. Wait 5-15 minutes for SSL certificate provisioning

### Option 2: Using gcloud CLI

```bash
gcloud run domain-mappings create \
  --service=da-bc-mcp-server-prod \
  --domain=mcp1.damensch.com \
  --region=us-central1 \
  --project=da-mcp
```

## Verify Setup

Once mapping is complete:

```bash
# Should return healthy status
curl https://mcp1.damensch.com/health

# Should return tools list
curl -X POST https://mcp1.damensch.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Current Working URLs

While waiting for custom domain:

**Production (GCP URL):**
- Health: https://da-bc-mcp-server-prod-kh3ftrr6jq-uc.a.run.app/health
- MCP: https://da-bc-mcp-server-prod-kh3ftrr6jq-uc.a.run.app/mcp

**Beta (Custom Domain - Working):**
- Health: https://mcp1-beta.damensch.com/health
- MCP: https://mcp1-beta.damensch.com/mcp

## Timeline

- Domain mapping creation: Instant
- SSL certificate provisioning: 15-60 minutes
- DNS propagation (if needed): Already done ✅

## Troubleshooting

If it's still not working after 1 hour:

1. Check domain mapping status:
```bash
gcloud run domain-mappings list \
  --region=us-central1 \
  --project=da-mcp
```

2. Check domain mapping details:
```bash
gcloud run domain-mappings describe mcp1.damensch.com \
  --region=us-central1 \
  --project=da-mcp
```

3. Look for certificate status - should show "Active" when ready
