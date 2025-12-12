# ArgoCD Configuration

This directory contains all ArgoCD Application manifests for the Phoenix platform using the "App of Apps" pattern.

## Architecture

```
root.yaml (Entry Point)
├── core-infra.yaml (Infrastructure)
│   ├── storage-class
│   ├── aws-ebs-csi-driver
│   ├── aws-load-balancer-controller
│   ├── istio-base
│   ├── istiod
│   ├── istio-ingressgateway
│   ├── phoenix-gateway
│   └── harbor
├── observability.yaml (Monitoring)
│   ├── kube-prometheus-stack
│   ├── jaeger
│   ├── kiali
│   └── elasticsearch
└── business-apps.yaml (Applications)
    ├── hotel-namespace
    ├── booking-service
    ├── room-service
    ├── payment-service
    ├── notification-service
    └── api-gateway
```

## Deployment Order

### 1. Deploy Root App of Apps

```bash
kubectl apply -f root.yaml
```

This creates four main applications:
- `phoenix-platform`: Meta app managing all other apps
- `core-infrastructure`: System components
- `observability-stack`: Monitoring tools
- `business-applications`: Hotel microservices

### 2. Verify Deployment

```bash
# Check all applications
kubectl get applications -n argocd

# Watch sync progress
kubectl get applications -n argocd -w

# Check specific application
argocd app get core-infrastructure
```

### 3. Access ArgoCD UI

```bash
# Port forward
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

Access at: https://localhost:8080

## Application Sync Policies

### Core Infrastructure
- **Auto Prune**: Disabled (prevent accidental deletion)
- **Self Heal**: Enabled
- **Create Namespace**: Enabled

### Observability
- **Auto Prune**: Enabled
- **Self Heal**: Enabled
- **Create Namespace**: Enabled

### Business Apps
- **Auto Prune**: Enabled
- **Self Heal**: Enabled
- **Create Namespace**: Enabled

## Managing Applications

### Sync Application

```bash
# Manual sync
argocd app sync booking-service

# Sync with prune
argocd app sync booking-service --prune

# Force sync
argocd app sync booking-service --force
```

### View Application Details

```bash
# Get application info
argocd app get booking-service

# View diff
argocd app diff booking-service

# View history
argocd app history booking-service
```

### Rollback Application

```bash
# Rollback to previous version
argocd app rollback booking-service

# Rollback to specific revision
argocd app rollback booking-service 3
```

## Sync Waves

Applications are deployed in waves using annotations:

```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "1"
```

Sync order:
1. **Wave 0**: Namespaces, CRDs (istio-base, storage-class)
2. **Wave 1**: Core infrastructure (EBS CSI, ALB Controller)
3. **Wave 2**: Istio control plane (istiod)
4. **Wave 3**: Istio data plane (ingressgateway)
5. **Wave 4**: Applications (Harbor, Prometheus, etc.)
6. **Wave 5**: Business apps (Hotel microservices)

## Health Checks

ArgoCD monitors resource health:

- **Healthy**: All resources synced and healthy
- **Progressing**: Sync in progress
- **Degraded**: Some resources unhealthy
- **Missing**: Resources not found in cluster
- **Unknown**: Health cannot be determined

### Custom Health Checks

For Istio resources:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  resource.customizations: |
    networking.istio.io/VirtualService:
      health.lua: |
        hs = {}
        hs.status = "Healthy"
        return hs
```

## Troubleshooting

### Application Stuck in Progressing

```bash
# Check events
kubectl describe application booking-service -n argocd

# Check application controller logs
kubectl logs -n argocd deployment/argocd-application-controller

# Force refresh
argocd app get booking-service --refresh
```

### Sync Fails

```bash
# View sync errors
argocd app get booking-service

# Check last sync result
kubectl get application booking-service -n argocd -o yaml | grep -A 10 status

# Manual intervention
kubectl apply -f <problematic-manifest>
argocd app sync booking-service --force
```

### Resources Not Deleted

If resources remain after deleting application:

```bash
# Check finalizers
kubectl get application booking-service -n argocd -o yaml | grep finalizers

# Remove finalizer
kubectl patch application booking-service -n argocd \
  --type json -p='[{"op": "remove", "path": "/metadata/finalizers"}]'
```

## Best Practices

### 1. Use App Projects

Create projects for different environments:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: production
  namespace: argocd
spec:
  sourceRepos:
    - '*'
  destinations:
    - namespace: '*'
      server: https://kubernetes.default.svc
  clusterResourceWhitelist:
    - group: '*'
      kind: '*'
```

### 2. Implement Sync Windows

Restrict sync times for production:

```yaml
spec:
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
    syncWindows:
      - kind: allow
        schedule: '0 2 * * *'
        duration: 1h
        applications:
          - '*-production'
```

### 3. Use Automated Sync Carefully

- Enable for dev/staging environments
- Require manual approval for production
- Use sync waves for proper ordering

### 4. Monitor Sync Status

Set up alerts for:
- Sync failures
- Out of sync applications
- Degraded health status

## Advanced Features

### Multi-Cluster Management

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: booking-service-prod
spec:
  destination:
    server: https://prod-cluster-api:6443
    namespace: hotel
```

### ApplicationSet

For managing multiple similar applications:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: hotel-services
spec:
  generators:
    - list:
        elements:
          - service: booking
          - service: room
          - service: payment
  template:
    metadata:
      name: '{{service}}-service'
    spec:
      source:
        path: 'deploy/k8s/{{service}}-service'
```

## GitOps Workflow

1. **Develop**: Make changes in `config` repository
2. **Commit**: Push changes to Git
3. **Detect**: ArgoCD detects changes
4. **Sync**: Auto-sync or manual approval
5. **Verify**: Check health and sync status
6. **Monitor**: Track metrics and logs

## Security

### RBAC

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-rbac-cm
  namespace: argocd
data:
  policy.csv: |
    p, role:developers, applications, get, */*, allow
    p, role:developers, applications, sync, */*, allow
    g, dev-team, role:developers
```

### SSO Integration

Configure with OIDC provider:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
data:
  url: https://argocd.phoenix.com
  oidc.config: |
    name: Keycloak
    issuer: https://keycloak.phoenix.com/auth/realms/phoenix
    clientID: argocd
    clientSecret: $oidc.keycloak.clientSecret
```

## Monitoring

### Metrics

ArgoCD exports Prometheus metrics:
- `argocd_app_info`: Application metadata
- `argocd_app_sync_total`: Sync operations
- `argocd_app_health_status`: Health status

### Notifications

Configure notifications for sync events:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
data:
  service.slack: |
    token: $slack-token
  trigger.on-sync-succeeded: |
    - send: [slack]
```
