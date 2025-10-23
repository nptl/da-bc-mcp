#!/bin/bash

# Deploy to Google Cloud Run - Production Environment
# Usage: ./deploy-production.sh PROJECT_ID

PROJECT_ID=${1:-"your-gcp-project-id"}
REGION="us-central1"
SERVICE_NAME="da-bc-mcp-server-prod"

echo "Deploying da-bc-mcp-server to Cloud Run (Production)..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Set project
gcloud config set project $PROJECT_ID

# Build and push container
gcloud builds submit --config cloudbuild.yaml

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/da-bc-mcp-server:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 20 \
  --min-instances 1 \
  --set-env-vars "NODE_ENV=production" \
  --timeout 300

# Get service URL
echo ""
echo "Deployment complete!"
echo "Service URL:"
gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --format 'value(status.url)'
