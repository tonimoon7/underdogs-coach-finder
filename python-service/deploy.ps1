# Google Cloud Run Deployment Script
# Requires Google Cloud SDK (gcloud CLI) to be installed and authenticated

$PROJECT_ID = "gen-lang-client-0293778787"
$REGION = "asia-northeast3" # Seoul region
$SERVICE_NAME = "underdogs-ai-backend"

Write-Host "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

Write-Host "Enabling necessary Google Cloud APIs..."
# Enable Cloud Run, Cloud Build, and AI Platform (if needed)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com aiplatform.googleapis.com

Write-Host "Deploying to Google Cloud Run..."
# Deploying directly from source (requires Docker locally, or uses Cloud Build)
gcloud run deploy $SERVICE_NAME `
    --source . `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --set-env-vars="GOOGLE_API_KEY=AIzaSyC9Rs8Js3h4ZaV32f-g69oV3toh-ZhCdYs,PROJECT_ID=$PROJECT_ID"

Write-Host "Deployment completed!"
