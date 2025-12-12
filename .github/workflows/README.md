# Phoenix Hotel - CI/CD Pipeline Documentation

## Overview

This repository contains a production-ready CI/CD pipeline for the Phoenix Hotel microservices platform, implementing DevSecOps best practices with automated building, testing, security scanning, and GitOps-based deployment.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Actions Pipeline                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Job 1: Build & Push (Matrix Strategy)                      │ │
│  │                                                              │ │
│  │  [booking-service]  [search-service]                       │ │
│  │  [user-service]     [notification-service]                 │ │
│  │                                                              │ │
│  │  Steps per service:                                         │ │
│  │  1. Checkout code                                           │ │
│  │  2. Setup Node.js                                           │ │
│  │  3. Install dependencies                                    │ │
│  │  4. Run linting                                             │ │
│  │  5. Run unit tests                                          │ │
│  │  6. Upload coverage                                         │ │
│  │  7. SAST - Trivy filesystem scan                           │ │
│  │  8. Configure Docker for insecure registry                 │ │
│  │  9. Login to Harbor                                         │ │
│  │  10. Build Docker image                                     │ │
│  │  11. Scan image with Trivy                                 │ │
│  │  12. Check for CRITICAL vulnerabilities                    │ │
│  │  13. Push image to Harbor                                  │ │
│  │  14. Upload Trivy report                                   │ │
│  │  15. Cleanup                                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Job 2: Update GitOps Configuration                         │ │
│  │                                                              │ │
│  │  1. Checkout repository                                     │ │
│  │  2. Configure Git                                           │ │
│  │  3. Install yq                                              │ │
│  │  4. Update image tags in ArgoCD manifests                  │ │
│  │  5. Update Helm values files                               │ │
│  │  6. Verify changes                                          │ │
│  │  7. Commit and push to main                                │ │
│  │  8. Create deployment summary                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│                         ArgoCD Auto-Sync                         │
│                              │                                    │
│                              ▼                                    │
│                    Kubernetes Cluster Deployment                 │
└───────────────────────────────────────────────────────────────────┘
```

## Workflow Triggers

### Push to Main Branch
```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'Hotel Reservation/**'
```

**Behavior:**
- Only triggers when files inside `Hotel Reservation/` directory change
- Automatically builds, scans, and deploys all affected services
- Updates GitOps configuration with new image tags

### Pull Request
```yaml
on:
  pull_request:
    branches:
      - main
    paths:
      - 'Hotel Reservation/**'
```

**Behavior:**
- Runs build and test steps
- Performs security scanning
- Does NOT push to Harbor or update GitOps config

## Matrix Strategy

The pipeline uses a build matrix to handle multiple microservices in parallel:

```yaml
strategy:
  fail-fast: false
  matrix:
    service:
      - booking-service
      - search-service
      - user-service
      - notification-service
```

**Benefits:**
- Parallel execution (faster builds)
- Independent service builds
- Failure isolation (one service failure doesn't stop others)

## Security Features

### 1. SAST - Static Application Security Testing

**Tool:** Trivy filesystem scanner

**What it scans:**
- Source code dependencies (package.json, node_modules)
- Known vulnerabilities in npm packages
- Security misconfigurations

**Configuration:**
```bash
trivy fs . \
  --severity HIGH,CRITICAL \
  --format table \
  --exit-code 0
```

### 2. Container Image Scanning

**Tool:** Trivy image scanner

**What it scans:**
- Base image vulnerabilities (OS packages)
- Application dependencies
- Known CVEs

**Configuration:**
```bash
trivy image \
  --severity HIGH,CRITICAL \
  --format json \
  --exit-code 1  # Fails on CRITICAL
  "$IMAGE"
```

**Critical Vulnerability Blocking:**
```bash
CRITICAL_COUNT=$(trivy image --severity CRITICAL --format json "$IMAGE" | jq '...')

if [ "${CRITICAL_COUNT}" -gt 0 ]; then
  exit 1  # Block deployment
fi
```

### 3. Code Coverage

**Tool:** Codecov

**Coverage uploaded for:**
- Unit test coverage
- Per-service breakdown
- Historical trend tracking

## Harbor Integration (Self-Signed Certificate)

### Problem
Harbor is exposed via AWS NLB with a self-signed certificate, which Docker rejects by default.

### Solution
Configure Docker daemon to allow insecure registries:

```bash
# Create daemon.json
echo '{
  "insecure-registries": ["harbor.phoenix.com"]
}' | sudo tee /etc/docker/daemon.json

# Restart Docker
sudo systemctl restart docker
```

### Why This Works
- Docker bypasses certificate validation for listed registries
- Allows push/pull operations without trusted certificates
- **Production Note:** Use proper TLS certificates in production!

## GitOps Update Process

### How It Works

1. **Build Successful** → Image pushed to Harbor with tag `${{ github.sha }}`

2. **Update Config Files** → Pipeline modifies:
   ```yaml
   # config/argocd/business-apps.yaml
   image:
     repository: harbor.phoenix.com/library/booking-service
     tag: abc123def456  # ← Updated to github.sha
   ```

3. **Commit Changes** → Automated commit to main branch:
   ```
   🚀 Deploy: Update image tags to abc123d

   Updated services:
   - booking-service
   - search-service
   - user-service
   - notification-service

   Image tag: abc123def456789
   ```

4. **ArgoCD Syncs** → Detects config change and deploys new version

### Files Updated

- `config/argocd/business-apps.yaml` - Main ArgoCD Application manifests
- `config/charts/values/*.yaml` - Service-specific Helm values (if exist)

### Tools Used

**yq** - YAML processor (better than sed for YAML)
```bash
yq eval -i '.image.tag = "new-tag"' values.yaml
```

**sed** - Fallback for simple replacements
```bash
sed -i "s|tag: .*|tag: new-tag|g" values.yaml
```

## Required GitHub Secrets

Configure these secrets in your GitHub repository:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `HARBOR_HOST` | Harbor registry hostname | `harbor.phoenix.com` |
| `HARBOR_USER` | Harbor username | `admin` |
| `HARBOR_PASSWORD` | Harbor password | `HarborAdmin123!` |
| `GITHUB_TOKEN` | Auto-provided by GitHub | (automatic) |

### How to Add Secrets

```bash
# Via GitHub UI
Settings → Secrets and variables → Actions → New repository secret

# Or via GitHub CLI
gh secret set HARBOR_HOST -b "harbor.phoenix.com"
gh secret set HARBOR_USER -b "admin"
gh secret set HARBOR_PASSWORD -b "YourSecurePassword"
```

## Workflow Jobs

### Job 1: build-and-push

**Duration:** ~5-8 minutes per service (parallel)

**Steps:**
1. ✅ Checkout code
2. ✅ Setup Node.js with npm cache
3. ✅ Install dependencies (`npm ci`)
4. ✅ Run linting (ESLint)
5. ✅ Run unit tests with coverage
6. ✅ Upload coverage to Codecov
7. ✅ SAST - Scan source code
8. ✅ Configure Docker for insecure registry
9. ✅ Login to Harbor
10. ✅ Build Docker image
11. ✅ Scan Docker image
12. ✅ Check for CRITICAL vulnerabilities
13. ✅ Push to Harbor
14. ✅ Upload Trivy report
15. ✅ Cleanup

**Artifacts:**
- `trivy-report-<service>.json` - Vulnerability scan report (30 days retention)
- Coverage reports uploaded to Codecov

### Job 2: update-gitops

**Duration:** ~1 minute

**Runs:** Only on `push` to `main` (not on PRs)

**Steps:**
1. ✅ Checkout with full history
2. ✅ Configure Git bot user
3. ✅ Install yq
4. ✅ Update image tags in all config files
5. ✅ Verify changes with `git diff`
6. ✅ Commit changes
7. ✅ Push to main
8. ✅ Create deployment summary

**Output:**
- GitOps config updated with new image tags
- ArgoCD auto-syncs within 3 minutes

### Job 3: notify-failure

**Duration:** <1 minute

**Runs:** Only if previous jobs fail

**Purpose:**
- Log failure details
- Placeholder for Slack/Discord/Email notifications

## Local Testing

### Test Pipeline Locally with Act

```bash
# Install act
brew install act

# Run workflow locally
act push -s HARBOR_HOST=harbor.phoenix.com \
         -s HARBOR_USER=admin \
         -s HARBOR_PASSWORD=YourPassword

# Run specific job
act -j build-and-push

# Run with specific service
act -j build-and-push -m service=booking-service
```

### Test Docker Build

```bash
cd "Hotel Reservation/booking-service"

# Build image
docker build -t test-image:local .

# Scan with Trivy
trivy image test-image:local
```

### Test GitOps Update

```bash
# Install yq
sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
sudo chmod +x /usr/local/bin/yq

# Test update
yq eval -i '.image.tag = "test123"' config/argocd/business-apps.yaml

# Verify
git diff config/
```

## Troubleshooting

### Pipeline Fails: "Docker login failed"

**Cause:** Harbor credentials are incorrect or Harbor is not accessible

**Solution:**
```bash
# Test Harbor access
curl -k https://harbor.phoenix.com/api/v2.0/health

# Test Docker login locally
docker login harbor.phoenix.com -u admin

# Verify secrets are set
gh secret list
```

### Pipeline Fails: "x509: certificate signed by unknown authority"

**Cause:** Docker not configured for insecure registry

**Solution:**
The pipeline automatically configures this. If still failing, check:
```yaml
# Verify this step ran successfully
- name: Configure Docker daemon for Harbor (self-signed cert)
```

### Pipeline Fails: "CRITICAL vulnerabilities found"

**Cause:** Docker image contains critical security vulnerabilities

**Solution:**
```bash
# View Trivy report artifact
# Download from GitHub Actions → Run → Artifacts

# Fix vulnerabilities:
# 1. Update base image in Dockerfile
# 2. Update npm dependencies
# 3. Apply security patches
```

### GitOps Update Not Working

**Cause:** yq command failed or no changes detected

**Solution:**
```bash
# Check if files exist
ls -la config/argocd/business-apps.yaml

# Test yq update locally
yq eval '.image.tag' config/argocd/business-apps.yaml

# Check git diff output in workflow logs
```

### ArgoCD Not Syncing

**Cause:** ArgoCD auto-sync disabled or sync failed

**Solution:**
```bash
# Check ArgoCD application status
kubectl get applications -n argocd

# Force sync
argocd app sync booking-service

# Check ArgoCD logs
kubectl logs -n argocd deployment/argocd-application-controller
```

## Performance Optimization

### Current Performance

| Job | Duration | Parallelization |
|-----|----------|-----------------|
| build-and-push | ~6 min | 4 services in parallel |
| update-gitops | ~1 min | Sequential |
| **Total** | **~7 min** | - |

### Optimization Tips

1. **Cache Dependencies:**
   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: 'npm'
   ```

2. **Use GitHub-hosted Larger Runners:**
   ```yaml
   runs-on: ubuntu-latest-8-cores
   ```

3. **Skip Tests on Docs Changes:**
   ```yaml
   paths-ignore:
     - '**.md'
     - 'docs/**'
   ```

4. **Cache Docker Layers:**
   ```yaml
   - uses: docker/setup-buildx-action@v3
   - uses: docker/build-push-action@v5
     with:
       cache-from: type=gha
       cache-to: type=gha,mode=max
   ```

## Best Practices

### ✅ DO

- ✅ Use matrix strategy for parallel builds
- ✅ Scan images before pushing
- ✅ Block on CRITICAL vulnerabilities
- ✅ Use semantic commit messages
- ✅ Upload security reports as artifacts
- ✅ Use specific tool versions (`TRIVY_VERSION`)
- ✅ Set `fail-fast: false` for independent builds

### ❌ DON'T

- ❌ Commit secrets to Git
- ❌ Skip security scans
- ❌ Use `:latest` tags in production
- ❌ Push untested images
- ❌ Ignore CRITICAL vulnerabilities
- ❌ Use insecure registries in production

## Monitoring

### GitHub Actions Metrics

View at: `https://github.com/<org>/<repo>/actions`

- Workflow run history
- Success/failure rates
- Duration trends
- Artifact downloads

### ArgoCD Sync Status

```bash
# Watch all applications
kubectl get applications -n argocd -w

# Check sync status
argocd app list

# View sync history
argocd app history booking-service
```

### Harbor Metrics

Access Harbor UI: `http://harbor.phoenix.com`

- Image pull counts
- Vulnerability scan results
- Storage usage
- Replication status

## Security Hardening

### Production Recommendations

1. **Use Proper TLS Certificates:**
   ```bash
   # Replace self-signed cert with Let's Encrypt or AWS ACM
   certbot certonly --dns-route53 -d harbor.phoenix.com
   ```

2. **Implement Image Signing:**
   ```yaml
   - name: Sign Docker image
     run: |
       cosign sign --key cosign.key ${{ env.FULL_IMAGE }}
   ```

3. **Enable SBOM Generation:**
   ```yaml
   - name: Generate SBOM
     run: |
       syft ${{ env.FULL_IMAGE }} -o spdx-json > sbom.json
   ```

4. **Implement Runtime Security:**
   ```yaml
   - name: Scan with Falco
     run: |
       falco --rule-file custom-rules.yaml
   ```

5. **Add Secrets Scanning:**
   ```yaml
   - name: Scan for secrets
     run: |
       trufflehog filesystem . --fail
   ```

## Support

For issues or questions:
- Check workflow run logs in GitHub Actions
- Review Trivy scan reports in Artifacts
- Verify Harbor accessibility
- Check ArgoCD sync status

## License

MIT License - Phoenix Platform Team
