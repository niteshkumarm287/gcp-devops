# GCP DevOps CI/CD Lab – Cloud Build → GKE with Canary Deployment

This project demonstrates an **end-to-end CI/CD pipeline on Google Cloud** that builds a containerized application, pushes the image to Artifact Registry, and deploys it to a Kubernetes cluster.

It also includes a **manual canary deployment strategy** to safely test new versions before rolling them out to all users.

---

# Architecture

```
Developer Push
      ↓
GitHub Repository
      ↓
Cloud Build (CI)
      ↓
Artifact Registry (Docker Image)
      ↓
GKE Cluster
      ↓
Kubernetes Deployment
      ↓
Canary Deployment Test
```

Pipeline flow:

1. Developer pushes code to GitHub
2. Cloud Build triggers automatically
3. Docker image is built
4. Image is pushed to Artifact Registry
5. Kubernetes deployment is updated
6. Canary deployment is tested with limited traffic

---

# Project Structure

```
gcp-devops/
│
├── app.py
├── requirements.txt
├── Dockerfile
├── cloudbuild.yaml
└── k8s/
    ├── deployment.yaml
    └── canary-deployment.yaml
```

---

# Application

Simple Flask application used for deployment testing.

### app.py

```python
from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello DevOps Engineer!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
```

---

# Docker Build

Docker image is built using a lightweight Python base image.

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8080

CMD ["python", "app.py"]
```

---

# Artifact Registry

Create a Docker repository.

```bash
gcloud artifacts repositories create my-docker-repo \
  --repository-format=docker \
  --location=us-central1
```

Configure authentication:

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

---

# CI Pipeline (Cloud Build)

The pipeline performs:

1. Build Docker image
2. Push image to Artifact Registry
3. Update Kubernetes deployment

### cloudbuild.yaml

```yaml
steps:

- name: 'gcr.io/cloud-builders/docker'
  args:
  - build
  - '-t'
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/my-docker-repo/app:$COMMIT_SHA'
  - '.'

- name: 'gcr.io/cloud-builders/docker'
  args:
  - push
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/my-docker-repo/app:$COMMIT_SHA'

- name: 'gcr.io/cloud-builders/kubectl'
  args:
  - set
  - image
  - deployment/devops-app
  - app=us-central1-docker.pkg.dev/$PROJECT_ID/my-docker-repo/app:$COMMIT_SHA
  env:
  - 'CLOUDSDK_COMPUTE_ZONE=us-central1-a'
  - 'CLOUDSDK_CONTAINER_CLUSTER=devops-cluster'

options:
  logging: CLOUD_LOGGING_ONLY
```

---

# GKE Setup

Create a Kubernetes cluster.

```bash
gcloud container clusters create devops-cluster \
  --zone us-central1-a \
  --num-nodes 2
```

Configure kubectl access.

```bash
gcloud container clusters get-credentials devops-cluster \
  --zone us-central1-a
```

---

# Initial Deployment

Deploy the application.

```bash
kubectl apply -f deployment.yaml
```

Expose service:

```bash
kubectl expose deployment devops-app \
  --type LoadBalancer \
  --port 80 \
  --target-port 8080
```

Retrieve service IP:

```bash
kubectl get svc
```

---

# Canary Deployment

A canary deployment allows testing a **new version with a small portion of traffic** before full rollout.

### Canary Strategy Used

Replica-based traffic distribution.

Example:

```
Stable Pods = 4
Canary Pods = 1
```

Traffic distribution:

```
Stable ≈ 80%
Canary ≈ 20%
```

---

### Deploy Canary Version

```bash
kubectl apply -f canary-deployment.yaml
```

Check pods:

```bash
kubectl get pods
```

Example output:

```
devops-app-xxxxx
devops-app-yyyyy
devops-app-canary-zzzzz
```

---

# Testing Canary Traffic

Send multiple requests to the service.

```bash
curl EXTERNAL_IP
```

Or:

```bash
for i in {1..10}; do curl EXTERNAL_IP; done
```

Responses may come from different pods.

---

# Scaling Canary

Increase canary traffic gradually.

```bash
kubectl scale deployment devops-app-canary --replicas=2
```

Reduce stable pods:

```bash
kubectl scale deployment devops-app --replicas=3
```

---

# Rollback

If issues occur, remove the canary deployment.

```bash
kubectl delete deployment devops-app-canary
```

Traffic immediately returns to the stable version.

---

# Key DevOps Concepts Demonstrated

| Concept               | Description                 |
| --------------------- | --------------------------- |
| CI/CD Pipeline        | Automated build and deploy  |
| Containerization      | Dockerized Python app       |
| Artifact Management   | Artifact Registry           |
| Kubernetes Deployment | GKE cluster deployment      |
| Canary Deployment     | Safe progressive rollout    |
| Rollback Strategy     | Quick recovery from failure |

---

# Possible Improvements

Future enhancements to this lab:

* Automated Canary Analysis
* Traffic splitting using service mesh (Istio)
* Progressive delivery with Cloud Deploy
* Monitoring and alerting integration
* Automated rollback based on metrics

---

# Learning Goal

This lab helps understand **core DevOps practices on Google Cloud** including CI/CD pipelines, container deployment, and safe release strategies using Kubernetes.
