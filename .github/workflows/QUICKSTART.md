# CI/CD Pipeline Quick Start Guide

## Prerequisites

Before using the CI/CD pipeline, ensure you have:

- [x] Kubernetes cluster running on AWS
- [x] Harbor installed and accessible via Istio Gateway
- [x] ArgoCD installed in the cluster
- [x] GitHub repository with appropriate permissions

## Setup Steps

### 1. Configure GitHub Secrets

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Add secrets
gh secret set HARBOR_HOST -b "harbor.phoenix.com"
gh secret set HARBOR_USER -b "admin"
gh secret set HARBOR_PASSWORD -b "YourSecurePassword"

# Verify
gh secret list
```

### 2. Prepare Microservice Directory Structure

```
Hotel Reservation/
├── booking-service/
│   ├── src/
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── search-service/
│   ├── src/
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── user-service/
│   └── ...
└── notification-service/
    └── ...
```

### 3. Create Dockerfile for Each Service

Copy the example Dockerfile:

```bash
# For each service
cp "Hotel Reservation/Dockerfile.example" "Hotel Reservation/booking-service/Dockerfile"
cp "Hotel Reservation/Dockerfile.example" "Hotel Reservation/search-service/Dockerfile"
cp "Hotel Reservation/Dockerfile.example" "Hotel Reservation/user-service/Dockerfile"
cp "Hotel Reservation/Dockerfile.example" "Hotel Reservation/notification-service/Dockerfile"

# Copy .dockerignore
cp "Hotel Reservation/.dockerignore" "Hotel Reservation/booking-service/.dockerignore"
# ... repeat for other services
```

### 4. Add Required npm Scripts

Add to each service's `package.json`:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest --coverage",
    "lint": "eslint src --ext .js",
    "build": "echo 'No build step required'"
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "nodemon": "^3.0.0"
  }
}
```

### 5. Configure Harbor Project

```bash
# Login to Harbor UI: http://harbor.phoenix.com
# Username: admin
# Password: HarborAdmin123!

# Create project (if not exists):
# 1. Projects → New Project
# 2. Project Name: library
# 3. Access Level: Private
# 4. Click OK
```

### 6. Test Pipeline Locally (Optional)

```bash
# Install act (GitHub Actions local runner)
brew install act

# Test workflow
act push \
  -s HARBOR_HOST=harbor.phoenix.com \
  -s HARBOR_USER=admin \
  -s HARBOR_PASSWORD=YourPassword \
  --container-architecture linux/amd64
```

### 7. Trigger First Deployment

```bash
# Make a change to a service
echo "// Test change" >> "Hotel Reservation/booking-service/src/index.js"

# Commit and push
git add .
git commit -m "feat: test CI/CD pipeline"
git push origin main

# Watch workflow
gh run watch
```

### 8. Monitor Deployment

#### Check GitHub Actions
```bash
# List workflow runs
gh run list --workflow=deploy.yml

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

#### Check Harbor
```bash
# Access Harbor UI
open http://harbor.phoenix.com

# Navigate to:
# Projects → library → Repositories → booking-service

# You should see new image with tag matching git commit SHA
```

#### Check ArgoCD
```bash
# Port-forward ArgoCD
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access UI
open https://localhost:8080

# Check application status
argocd app get booking-service

# Watch sync
argocd app sync booking-service --watch
```

## Workflow Overview

### What Happens When You Push?

```
1. Git Push to main
   ↓
2. GitHub Actions triggered (only if Hotel Reservation/** changed)
   ↓
3. Matrix build starts (4 services in parallel)
   ↓
4. For each service:
   ├─ Install dependencies
   ├─ Run tests
   ├─ Scan code (SAST)
   ├─ Build Docker image
   ├─ Scan image
   ├─ Push to Harbor
   └─ Upload reports
   ↓
5. Update GitOps config
   ├─ Update image tags
   ├─ Commit to main
   └─ Push changes
   ↓
6. ArgoCD detects change
   ↓
7. ArgoCD syncs new images to cluster
   ↓
8. Services updated in Kubernetes
```

### Timeline

- **Build & Push**: ~6 minutes (parallel)
- **GitOps Update**: ~1 minute
- **ArgoCD Sync**: ~2-3 minutes
- **Total**: ~10 minutes from push to deployment

## Troubleshooting

### Issue: "Docker login failed"

**Check:**
```bash
# Verify Harbor is accessible
curl -k https://harbor.phoenix.com/api/v2.0/health

# Test credentials
docker login harbor.phoenix.com -u admin

# Check GitHub secrets
gh secret list
```

### Issue: "CRITICAL vulnerabilities found"

**Fix:**
```bash
# Download Trivy report from Artifacts
# View vulnerabilities
# Update dependencies or base image

# Update package.json
npm update

# Or update Dockerfile base image
FROM node:18-alpine  # Use specific version
```

### Issue: "Tests failed"

**Fix:**
```bash
# Run tests locally
cd "Hotel Reservation/booking-service"
npm test

# Fix failing tests
# Commit and push
```

### Issue: "ArgoCD not syncing"

**Fix:**
```bash
# Check application status
kubectl get applications -n argocd

# Force sync
argocd app sync booking-service

# Check logs
kubectl logs -n argocd deployment/argocd-application-controller
```

## Next Steps

### Enable Code Coverage

Add Codecov token:
```bash
gh secret set CODECOV_TOKEN -b "your-codecov-token"
```

### Add Slack Notifications

Add webhook URL:
```bash
gh secret set SLACK_WEBHOOK_URL -b "https://hooks.slack.com/services/..."
```

Update workflow:
```yaml
- name: Notify Slack
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
      -d '{"text":"Deployment succeeded!"}'
```

### Enable Branch Protection

```bash
# Via GitHub UI:
# Settings → Branches → Add rule
# - Branch name pattern: main
# - Require pull request reviews
# - Require status checks to pass
#   - Check: build-and-push
#   - Check: update-gitops
```

### Add Pre-commit Hooks

```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml <<EOF
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
EOF

# Install hooks
pre-commit install
```

## Best Practices

### 1. Use Semantic Commits

```bash
# Good
git commit -m "feat: add booking validation"
git commit -m "fix: resolve date parsing issue"
git commit -m "docs: update API documentation"

# Bad
git commit -m "updates"
git commit -m "fix stuff"
```

### 2. Keep Dockerfiles Lightweight

```dockerfile
# Use Alpine images
FROM node:18-alpine

# Multi-stage builds
FROM node:18-alpine AS builder
# ... build ...
FROM node:18-alpine
# ... production ...
```

### 3. Pin Dependency Versions

```json
{
  "dependencies": {
    "express": "4.18.2",  // Pin exact version
    "mongoose": "~7.0.0"  // Or allow patches
  }
}
```

### 4. Write Comprehensive Tests

```javascript
// booking-service/src/booking.test.js
describe('Booking Service', () => {
  it('should create booking', async () => {
    // Test implementation
  });

  it('should validate dates', async () => {
    // Test implementation
  });
});
```

### 5. Monitor Pipeline Health

```bash
# Check recent runs
gh run list --limit 10

# Check failure rate
gh run list --workflow=deploy.yml --json status

# Set up alerts for failures
```

## Support

- **Documentation**: See [README.md](README.md) and [SECRETS.md](SECRETS.md)
- **Issues**: Create GitHub issue with `ci/cd` label
- **Security**: Email security@phoenix.com

## Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Harbor Docs](https://goharbor.io/docs/)
- [ArgoCD Docs](https://argo-cd.readthedocs.io/)
- [Trivy Docs](https://aquasecurity.github.io/trivy/)
