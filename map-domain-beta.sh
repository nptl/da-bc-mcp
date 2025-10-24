#!/bin/bash

# Script to map custom domain to Cloud Run beta service
# Domain: mcp1-beta.damensch.com

set -e

PROJECT_ID="da-mcp"
SERVICE_NAME="da-bc-mcp-server-beta"
REGION="us-central1"
DOMAIN="mcp1-beta.damensch.com"

echo "🌐 Mapping custom domain to Cloud Run service..."
echo ""
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "Domain: $DOMAIN"
echo ""

# Add domain mapping
echo "Step 1: Creating domain mapping..."
gcloud run domain-mappings create \
  --service=$SERVICE_NAME \
  --domain=$DOMAIN \
  --region=$REGION \
  --project=$PROJECT_ID

echo ""
echo "✅ Domain mapping created!"
echo ""

# Get DNS records that need to be configured
echo "Step 2: Getting DNS configuration..."
echo ""
gcloud run domain-mappings describe $DOMAIN \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="table(status.resourceRecords.name,status.resourceRecords.type,status.resourceRecords.rrdata)"

echo ""
echo "📋 Next Steps:"
echo "1. Copy the DNS records shown above"
echo "2. Add these records to your DNS provider (wherever damensch.com is hosted)"
echo "3. Wait for DNS propagation (can take 5-60 minutes)"
echo "4. Verify with: curl https://mcp1-beta.damensch.com/health"
echo ""
