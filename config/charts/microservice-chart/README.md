# Microservice Helm Chart

A generic, production-ready Helm chart for deploying microservices on the Phoenix Kubernetes platform with Istio service mesh integration.

## Features

- **Istio Integration**: Automatic sidecar injection and traffic management
- **Flexible Ingress**: Support for both Istio VirtualService and standard Kubernetes Ingress
- **Persistence**: Optional persistent volume claims with GP3 StorageClass
- **Autoscaling**: HPA support with CPU/Memory metrics
- **Security**: Pod security contexts, service accounts, secret management
- **Observability**: Built-in health checks and Istio telemetry
- **Database Support**: Environment variable injection for database connections

## Installation

### Basic Installation

```bash
helm install my-app ./microservice-chart \
  --set name=my-app \
  --set namespace=default \
  --set image.repository=harbor.phoenix.com/apps/my-app \
  --set image.tag=v1.0.0
```

### With Istio VirtualService

```bash
helm install my-app ./microservice-chart \
  --set name=my-app \
  --set namespace=default \
  --set image.repository=harbor.phoenix.com/apps/my-app \
  --set image.tag=v1.0.0 \
  --set ingress.enabled=true \
  --set ingress.type=virtualservice \
  --set ingress.virtualService.hosts[0]=myapp.phoenix.com \
  --set ingress.virtualService.gateway=istio-system/phoenix-gateway
```

### With Persistence

```bash
helm install my-app ./microservice-chart \
  --set name=my-app \
  --set image.repository=harbor.phoenix.com/apps/my-app \
  --set image.tag=v1.0.0 \
  --set persistence.enabled=true \
  --set persistence.size=20Gi \
  --set persistence.mountPath=/data
```

### With Database Connection

```bash
helm install my-app ./microservice-chart \
  --set name=my-app \
  --set image.repository=harbor.phoenix.com/apps/my-app \
  --set database.enabled=true \
  --set database.type=postgresql \
  --set database.host=postgres.database.svc.cluster.local \
  --set database.port=5432 \
  --set database.name=myapp \
  --set database.username=myuser \
  --set database.passwordSecret.name=db-credentials \
  --set database.passwordSecret.key=password
```

## Values

### Core Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `name` | Application name | `""` |
| `namespace` | Kubernetes namespace | `default` |
| `replicaCount` | Number of replicas | `1` |

### Image Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.repository` | Image repository | `nginx` |
| `image.tag` | Image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `imagePullSecrets` | Image pull secrets | `[]` |

### Service Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `80` |
| `service.targetPort` | Container port | `8080` |

### Ingress Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `false` |
| `ingress.type` | Ingress type (virtualservice/ingress) | `virtualservice` |
| `ingress.virtualService.hosts` | Virtual service hosts | `["app.phoenix.com"]` |
| `ingress.virtualService.gateway` | Istio gateway | `istio-system/phoenix-gateway` |

### Persistence Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `persistence.enabled` | Enable persistence | `false` |
| `persistence.storageClass` | Storage class | `gp3` |
| `persistence.size` | Volume size | `10Gi` |
| `persistence.mountPath` | Mount path | `/data` |

### Autoscaling Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `autoscaling.enabled` | Enable HPA | `false` |
| `autoscaling.minReplicas` | Minimum replicas | `1` |
| `autoscaling.maxReplicas` | Maximum replicas | `10` |
| `autoscaling.targetCPUUtilizationPercentage` | CPU target | `80` |

### Istio Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `istio.injection` | Enable sidecar injection | `true` |
| `istio.destinationRule.enabled` | Enable DestinationRule | `false` |
| `istio.authorizationPolicy.enabled` | Enable AuthorizationPolicy | `false` |

## Examples

### Hotel Booking Service

```yaml
name: booking-service
namespace: hotel
replicaCount: 3

image:
  repository: harbor.phoenix.com/hotel/booking-service
  tag: v2.1.0
  pullPolicy: Always

imagePullSecrets:
  - name: harbor-registry

service:
  port: 80
  targetPort: 8080

ingress:
  enabled: true
  type: virtualservice
  virtualService:
    hosts:
      - booking.phoenix.com
    gateway: istio-system/phoenix-gateway
    http:
      - match:
          - uri:
              prefix: /api/booking
        route:
          - destination:
              port:
                number: 80

database:
  enabled: true
  type: postgresql
  host: postgres.database.svc.cluster.local
  port: 5432
  name: booking_db
  username: booking_user
  passwordSecret:
    name: booking-db-secret
    key: password

persistence:
  enabled: true
  size: 50Gi
  mountPath: /data/bookings

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 200m
    memory: 256Mi

env:
  - name: REDIS_URL
    value: redis://redis.cache.svc.cluster.local:6379
  - name: LOG_LEVEL
    value: info
```

## ArgoCD Integration

Deploy via ArgoCD Application:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: booking-service
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/phoenix/config
    targetRevision: main
    path: charts/microservice-chart
    helm:
      valueFiles:
        - values-booking.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: hotel
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Development

### Testing the Chart

```bash
# Lint the chart
helm lint ./microservice-chart

# Dry run
helm install my-app ./microservice-chart --dry-run --debug

# Template output
helm template my-app ./microservice-chart --values custom-values.yaml
```

### Updating the Chart

After making changes, update the version in `Chart.yaml`:

```yaml
version: 1.1.0  # Increment version
```

## License

MIT
