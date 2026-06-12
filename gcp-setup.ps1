# BFAI — GCP Initial Setup Script (run ONCE)
# Prerequisites: gcloud CLI installed and logged in (`gcloud auth login`)
# Usage: .\gcp-setup.ps1 -ProjectId "mediflow-nexus-2026"

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId
)

$Region   = "asia-south1"
$RepoName = "bfai-hardik"
$Service  = "bfai-hardik-backend"

Write-Host "`n=== Setting GCP project ===" -ForegroundColor Cyan
gcloud config set project $ProjectId

Write-Host "`n=== Enabling required APIs ===" -ForegroundColor Cyan
gcloud services enable `
    run.googleapis.com `
    artifactregistry.googleapis.com `
    cloudbuild.googleapis.com `
    secretmanager.googleapis.com

Write-Host "`n=== Creating Artifact Registry repo ===" -ForegroundColor Cyan
gcloud artifacts repositories create $RepoName `
    --repository-format=docker `
    --location=$Region `
    --description="BFAI Document Intelligence Docker images"

Write-Host "`n=== Setup complete! ===" -ForegroundColor Green
Write-Host "Next: cd backend && gcloud builds submit --config=../cloudbuild.yaml --project=$ProjectId"
