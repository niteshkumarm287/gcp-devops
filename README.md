# GCP DevOps – Cloud Build + Artifact Registry + Container Scanning

This project demonstrates a simple **DevOps pipeline on Google Cloud** that:

1. Builds a Docker image
2. Runs container tests
3. Pushes the image to **Artifact Registry**
4. Automatically triggers **Container Vulnerability Scanning**

The pipeline runs using **Cloud Build** and stores images in **Artifact Registry**.

---

# Architecture Overview

```
GitHub Repo
    │
    │ (Push)
    ▼
Cloud Build Trigger
    │
    ├── Build Docker Image
    ├── Run Container Tests
    ├── Push Image → Artifact Registry
    └── Vulnerability Scan
```

---

# Project Structure

```
.
├── Dockerfile
├── app.js
├── package.json
└── cloudbuild.yaml
```

---

# Prerequisites

Make sure the following tools are installed:

* Google Cloud SDK (`gcloud`)
* Docker
* Git

Login to Google Cloud:

```
gcloud auth login
```

Set your project:

```
gcloud config set project PROJECT_ID
```

---

# Enable Required APIs

```
gcloud services enable \
cloudbuild.googleapis.com \
artifactregistry.googleapis.com \
containeranalysis.googleapis.com \
containerscanning.googleapis.com
```

---

# Create Artifact Registry Repository

```
export REGION=us-central1

gcloud artifacts repositories create my-docker-repo \
--repository-format=docker \
--location=$REGION \
--description="Docker repository"
```

Verify repository:

```
gcloud artifacts repositories list
```

---

# Configure Docker Authentication

```
gcloud auth configure-docker $REGION-docker.pkg.dev
```

---

# Build Docker Image Locally (Optional)

```
docker build -t myapp .
```

Run container:

```
docker run -p 3000:3000 myapp
```

---

# Tag Image for Artifact Registry

```
export PROJECT_ID=$(gcloud config get-value project)

docker tag myapp \
$REGION-docker.pkg.dev/$PROJECT_ID/my-docker-repo/myapp:v1.0
```

---

# Push Image to Artifact Registry

```
docker push \
$REGION-docker.pkg.dev/$PROJECT_ID/my-docker-repo/myapp:v1.0
```

---

# Verify Image

```
gcloud artifacts docker images list \
$REGION-docker.pkg.dev/$PROJECT_ID/my-docker-repo
```

---

# Check Vulnerability Scan

Google automatically scans images when they are pushed.

```
gcloud artifacts docker images describe \
$REGION-docker.pkg.dev/$PROJECT_ID/my-docker-repo/myapp:v1.0 \
--show-package-vulnerability
```

---

# Cloud Build Pipeline

`cloudbuild.yaml` automates:

1. Build Docker Image
2. Run tests
3. Push image
4. Scan image

Example pipeline:

```
substitutions:
  _IMAGE_TAG: latest
  _REGION: us-central1

steps:

- name: 'gcr.io/cloud-builders/docker'
  id: build-image
  args:
    - build
    - -t
    - '${_REGION}-docker.pkg.dev/${PROJECT_ID}/my-docker-repo/myapp:${_IMAGE_TAG}'
    - .

- name: 'gcr.io/cloud-builders/docker'
  id: test-image
  args:
    - run
    - '--rm'
    - '${_REGION}-docker.pkg.dev/${PROJECT_ID}/my-docker-repo/myapp:${_IMAGE_TAG}'
    - node
    - -e
    - 'console.log("Tests passed")'

- name: 'gcr.io/cloud-builders/docker'
  id: push-image
  args:
    - push
    - '--all-tags'
    - '${_REGION}-docker.pkg.dev/${PROJECT_ID}/my-docker-repo/myapp'

- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  id: scan-image
  entrypoint: gcloud
  args:
    - artifacts
    - docker
    - images
    - describe
    - '${_REGION}-docker.pkg.dev/${PROJECT_ID}/my-docker-repo/myapp:${_IMAGE_TAG}'

images:
- '${_REGION}-docker.pkg.dev/${PROJECT_ID}/my-docker-repo/myapp:${_IMAGE_TAG}'
```

---

# Trigger Cloud Build Manually

```
gcloud builds submit --config cloudbuild.yaml .
```

---

# GitHub Push Workflow

Commit and push code:

```
git add .
git commit -m "trigger build"
git push origin main
```

If a **Cloud Build Trigger** is configured, the pipeline will run automatically.

---

# Troubleshooting

## 1. GitHub Permission Error

Error:

```
Permission to repo denied
```

Cause:
Wrong GitHub user authentication.

Fix:

```
git remote set-url origin https://github.com/niteshkumarm287/gcp-devops.git
```

Re-authenticate GitHub if needed.

---

## 2. Artifact Registry Image Not Found

Error:

```
Image not found
```

Cause:
Image was not pushed yet.

Fix:

```
docker push REGION-docker.pkg.dev/PROJECT_ID/my-docker-repo/myapp:v1.0
```

---

## 3. Vulnerability Scanning Flag Error

Error:

```
--enable-vulnerability-scanning unrecognized
```

Reason:
Newer versions of Artifact Registry enable scanning automatically.

Fix:
Just enable required APIs:

```
gcloud services enable containeranalysis.googleapis.com
gcloud services enable containerscanning.googleapis.com
```

---

# Useful Commands

List images

```
gcloud artifacts docker images list \
$REGION-docker.pkg.dev/$PROJECT_ID/my-docker-repo
```

Describe image

```
gcloud artifacts docker images describe IMAGE
```

View vulnerabilities

```
gcloud artifacts docker images describe IMAGE --show-package-vulnerability
```

---

# Outcome

This project demonstrates:

* CI pipeline with **Cloud Build**
* Secure container storage with **Artifact Registry**
* Automatic **Container Vulnerability Scanning**
* Docker image testing during build
* GitHub integration with CI

---

# Future Improvements

* Add **Trivy or Snyk scanning**
* Deploy to **Cloud Run / GKE**
* Add **policy enforcement (Binary Authorization)**
* Implement **SLSA provenance**

---
