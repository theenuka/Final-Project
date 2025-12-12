# GitHub Secrets Configuration

## Required Secrets

This document describes all required GitHub secrets for the Phoenix Hotel CI/CD pipeline.

## Secret List

| Secret Name | Required | Description | Example Value |
|------------|----------|-------------|---------------|
| `HARBOR_HOST` | ✅ Yes | Harbor registry hostname (without https://) | `harbor.phoenix.com` |
| `HARBOR_USER` | ✅ Yes | Harbor username for authentication | `admin` |
| `HARBOR_PASSWORD` | ✅ Yes | Harbor password | `HarborAdmin123!` |
| `GITHUB_TOKEN` | 🔄 Auto | Automatically provided by GitHub Actions | N/A |

## Setup Instructions

### Method 1: GitHub Web UI

1. Navigate to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:

#### HARBOR_HOST
```
Name: HARBOR_HOST
Value: harbor.phoenix.com
```

#### HARBOR_USER
```
Name: HARBOR_USER
Value: admin
```

#### HARBOR_PASSWORD
```
Name: HARBOR_PASSWORD
Value: YourSecurePasswordHere
```

### Method 2: GitHub CLI

```bash
# Install GitHub CLI (if not already installed)
brew install gh

# Authenticate
gh auth login

# Add secrets
gh secret set HARBOR_HOST -b "harbor.phoenix.com"
gh secret set HARBOR_USER -b "admin"
gh secret set HARBOR_PASSWORD -b "YourSecurePasswordHere"

# Verify secrets are set
gh secret list
```

### Method 3: Using .env File (Local Testing)

For local testing with `act`:

```bash
# Create .env file (DO NOT COMMIT THIS!)
cat > .env <<EOF
HARBOR_HOST=harbor.phoenix.com
HARBOR_USER=admin
HARBOR_PASSWORD=YourSecurePasswordHere
EOF

# Add to .gitignore
echo ".env" >> .gitignore

# Test with act
act --env-file .env
```

## Secret Details

### HARBOR_HOST

**Format:** Domain name only (no protocol, no port)

**Valid:**
- ✅ `harbor.phoenix.com`
- ✅ `registry.mycompany.com`

**Invalid:**
- ❌ `https://harbor.phoenix.com`
- ❌ `harbor.phoenix.com:443`
- ❌ `http://harbor.phoenix.com`

**Used in:**
- Docker login command
- Image naming: `$HARBOR_HOST/library/service:tag`
- Docker daemon insecure-registries configuration

### HARBOR_USER

**Format:** Harbor username (case-sensitive)

**Default Harbor Admin:**
- Username: `admin`
- Initial Password: `Harbor12345` (change on first login)

**Best Practices:**
- Create dedicated CI/CD user in Harbor
- Grant minimum required permissions
- Use robot accounts for automation

**Creating Robot Account:**
```bash
# In Harbor UI:
# 1. Projects → library → Robot Accounts
# 2. Click "New Robot Account"
# 3. Name: github-actions
# 4. Expiration: Never / 1 year
# 5. Permissions: Push artifact, Pull artifact
# 6. Copy username (e.g., robot$github-actions)
# 7. Copy token
```

### HARBOR_PASSWORD

**Format:** Plain text password (will be encrypted by GitHub)

**Security Notes:**
- GitHub encrypts secrets using Libsodium sealed boxes
- Secrets are never visible in logs
- Secrets are redacted in workflow output

**Password Requirements:**
- Minimum 8 characters
- Use strong passwords (recommended: 16+ characters)
- Include uppercase, lowercase, numbers, symbols

**Generate Strong Password:**
```bash
# macOS/Linux
openssl rand -base64 24

# Or use password manager
```

## Verifying Secrets

### Check Secrets Are Set

```bash
# Using GitHub CLI
gh secret list

# Expected output:
# HARBOR_HOST      Updated 2024-12-12
# HARBOR_USER      Updated 2024-12-12
# HARBOR_PASSWORD  Updated 2024-12-12
```

### Test Harbor Authentication

```bash
# Get secrets (values will be masked)
echo "Host: ${{ secrets.HARBOR_HOST }}"
echo "User: ${{ secrets.HARBOR_USER }}"

# Test Docker login (in workflow)
echo "${{ secrets.HARBOR_PASSWORD }}" | docker login ${{ secrets.HARBOR_HOST }} \
  --username ${{ secrets.HARBOR_USER }} \
  --password-stdin
```

## Security Best Practices

### ✅ DO

1. **Rotate Secrets Regularly**
   ```bash
   # Update every 90 days
   gh secret set HARBOR_PASSWORD -b "NewSecurePassword"
   ```

2. **Use Robot Accounts**
   - Create dedicated robot accounts in Harbor
   - Set expiration dates
   - Limit permissions to specific projects

3. **Use Environment-Specific Secrets**
   ```yaml
   # Development
   HARBOR_HOST_DEV=harbor-dev.phoenix.com

   # Production
   HARBOR_HOST_PROD=harbor.phoenix.com
   ```

4. **Audit Secret Access**
   ```bash
   # Check workflow runs that used secrets
   gh run list --workflow=deploy.yml
   ```

5. **Encrypt Sensitive Data**
   ```bash
   # Encrypt before storing (optional extra layer)
   echo "password" | gpg --encrypt > encrypted.gpg
   ```

### ❌ DON'T

1. **Never Commit Secrets**
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   echo "secrets.yml" >> .gitignore
   ```

2. **Never Log Secrets**
   ```yaml
   # BAD
   - run: echo "Password: ${{ secrets.HARBOR_PASSWORD }}"

   # GOOD
   - run: echo "Logging in to Harbor..."
   ```

3. **Never Share Secrets**
   - Don't send via email/Slack
   - Use secret management tools
   - Use temporary sharing (1Password, Bitwarden)

4. **Never Use Default Passwords**
   ```bash
   # Change default Harbor password immediately
   # Old: Harbor12345
   # New: <strong random password>
   ```

## Troubleshooting

### Secret Not Found

**Error:**
```
Error: Secret HARBOR_HOST not found
```

**Solution:**
```bash
# Verify secret exists
gh secret list

# Re-add secret
gh secret set HARBOR_HOST -b "harbor.phoenix.com"
```

### Authentication Failed

**Error:**
```
Error: authentication required
```

**Solutions:**

1. **Check Harbor is accessible:**
   ```bash
   curl -k https://harbor.phoenix.com/api/v2.0/health
   ```

2. **Verify credentials:**
   ```bash
   # Test login locally
   docker login harbor.phoenix.com -u admin
   ```

3. **Check secret value:**
   ```bash
   # Secrets are case-sensitive
   # Verify username matches Harbor exactly
   ```

4. **Check Harbor user permissions:**
   ```sql
   -- In Harbor DB
   SELECT * FROM harbor_user WHERE username = 'admin';
   ```

### Secret Value Has Spaces

**Problem:**
```bash
# Secret value has trailing space
Value: "admin "  # ← space at end
```

**Solution:**
```bash
# Trim value when setting
gh secret set HARBOR_USER -b "$(echo 'admin' | tr -d '[:space:]')"
```

## Rotating Secrets

### When to Rotate

- Every 90 days (minimum)
- After personnel changes
- After suspected compromise
- After security incidents

### Rotation Process

1. **Generate New Credentials:**
   ```bash
   # In Harbor UI: Create new robot account
   NEW_USERNAME="robot$github-actions-v2"
   NEW_PASSWORD="<generated-token>"
   ```

2. **Test New Credentials:**
   ```bash
   docker login harbor.phoenix.com \
     -u "$NEW_USERNAME" \
     -p "$NEW_PASSWORD"
   ```

3. **Update GitHub Secrets:**
   ```bash
   gh secret set HARBOR_USER -b "$NEW_USERNAME"
   gh secret set HARBOR_PASSWORD -b "$NEW_PASSWORD"
   ```

4. **Verify Workflow:**
   ```bash
   # Trigger test workflow
   git commit --allow-empty -m "test: verify new credentials"
   git push
   ```

5. **Revoke Old Credentials:**
   ```bash
   # In Harbor UI: Delete old robot account
   ```

## Optional Secrets

These secrets are not required but can enhance functionality:

| Secret | Purpose | Example |
|--------|---------|---------|
| `CODECOV_TOKEN` | Upload code coverage | `a1b2c3d4-e5f6-g7h8-i9j0` |
| `SLACK_WEBHOOK_URL` | Deployment notifications | `https://hooks.slack.com/...` |
| `DOCKER_HUB_USERNAME` | Pull rate limit mitigation | `phoenixbot` |
| `DOCKER_HUB_TOKEN` | Pull rate limit mitigation | `dckr_pat_...` |

### Adding Optional Secrets

```bash
# Codecov
gh secret set CODECOV_TOKEN -b "your-codecov-token"

# Slack
gh secret set SLACK_WEBHOOK_URL -b "https://hooks.slack.com/services/..."
```

## Environment Variables vs Secrets

### Use Secrets For:
- ✅ Passwords
- ✅ API tokens
- ✅ Private keys
- ✅ Certificates

### Use Environment Variables For:
- ✅ Public configuration
- ✅ Non-sensitive values
- ✅ Feature flags

**Example:**
```yaml
env:
  HARBOR_HOST: harbor.phoenix.com  # Public, not sensitive
  NODE_VERSION: '18'                # Public

steps:
  - name: Login
    env:
      HARBOR_PASSWORD: ${{ secrets.HARBOR_PASSWORD }}  # Sensitive
```

## Backup Secrets

### Export Secrets (Encrypted)

```bash
# Export to encrypted file
gh secret list --json name,createdAt > secrets-list.json

# Backup values (you'll need to re-enter them)
# Use password manager or encrypted vault
```

### Import Secrets

```bash
# Read from file
while IFS= read -r line; do
  name=$(echo $line | jq -r '.name')
  value="<get-from-secure-storage>"
  gh secret set "$name" -b "$value"
done < secrets-list.json
```

## Support

For issues with secrets:
1. Verify secret exists: `gh secret list`
2. Check workflow logs for authentication errors
3. Test credentials manually with Harbor
4. Rotate credentials if suspected compromise

## Security Contact

Report security issues to: security@phoenix.com

**DO NOT** create public GitHub issues for security vulnerabilities.
