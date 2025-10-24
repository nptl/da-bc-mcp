# Custom Domain Setup Guide

Setting up `mcp1-beta.damensch.com` to point to the MCP Beta server.

## Option 1: Using gcloud CLI (Recommended)

Run the provided script:

```bash
./map-domain-beta.sh
```

This will:
1. Create the domain mapping in Cloud Run
2. Display the DNS records you need to add
3. Provide verification instructions

## Option 2: Using Google Cloud Console

### Step 1: Map Domain in Cloud Run

1. Go to [Google Cloud Console - Cloud Run](https://console.cloud.google.com/run)
2. Select project: `da-mcp`
3. Click on service: `da-bc-mcp-server-beta`
4. Click on the **"MANAGE CUSTOM DOMAINS"** tab at the top
5. Click **"ADD MAPPING"** button
6. Select the service: `da-bc-mcp-server-beta`
7. Enter domain: `mcp1-beta.damensch.com`
8. Click **"CONTINUE"**
9. GCP will show you DNS records to add (copy these!)

### Step 2: Add DNS Records

You'll get records like this (example):

```
Type: A
Name: mcp1-beta
Value: 216.239.32.21

Type: AAAA
Name: mcp1-beta
Value: 2001:4860:4802:32::15

Type: CNAME (for verification)
Name: ghs.domainverify.damensch.com
Value: ghs.googlehosted.com
```

#### Where to Add DNS Records:

**If using Cloudflare:**
1. Go to Cloudflare Dashboard → damensch.com → DNS
2. Add the A record: `mcp1-beta` → `216.239.32.21` (set Proxy to "DNS only")
3. Add the AAAA record: `mcp1-beta` → `2001:4860:4802:32::15` (set Proxy to "DNS only")
4. Add any verification CNAME records

**If using Google Domains / Other:**
1. Log in to your domain registrar
2. Go to DNS settings for damensch.com
3. Add the records as shown by GCP

### Step 3: Wait for Verification

- DNS propagation: 5-60 minutes
- SSL certificate provisioning: Automatic (Cloud Run handles this)
- Status can be checked in Cloud Run console

### Step 4: Verify

Once DNS propagates, test:

```bash
# Health check
curl https://mcp1-beta.damensch.com/health

# MCP endpoint
curl -X POST https://mcp1-beta.damensch.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Troubleshooting

### Domain not resolving
- Check DNS propagation: `dig mcp1-beta.damensch.com`
- Ensure records are added correctly
- Wait longer (up to 24 hours in rare cases)

### SSL certificate errors
- Cloud Run auto-provisions SSL certs
- May take 15-60 minutes after DNS verification
- Check domain mapping status in Cloud Run console

### 403 or 404 errors
- Verify domain mapping is "Active" in Cloud Run
- Check service is deployed and healthy
- Ensure `--allow-unauthenticated` flag is set

## Final Configuration

Once complete, use this in OpenAI Agent:
```
https://mcp1-beta.damensch.com/mcp
```

## Updating Production

When ready to deploy to production at `mcp1.damensch.com`:
1. Copy and modify `map-domain-beta.sh` → `map-domain-production.sh`
2. Update domain to `mcp1.damensch.com`
3. Update service to `da-bc-mcp-server-prod`
4. Follow same DNS setup process
