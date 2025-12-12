# Phoenix Platform - GitOps Configuration Repository

This repository contains the complete GitOps configuration for the Phoenix Kubernetes platform, managed by ArgoCD.

## 🏗️ Architecture

The Phoenix platform is a production-ready Kubernetes environment on AWS EC2 with:

- **Infrastructure**: AWS EBS CSI Driver, AWS Load Balancer Controller
- **Service Mesh**: Istio (control plane + ingress gateway)
- **Container Registry**: Harbor
- **Observability**: Prometheus, Grafana, Jaeger, Kiali
- **GitOps**: ArgoCD (App of Apps pattern)
- **Applications**: Hotel microservices

## 📁 Repository Structure

```
config/
├── argocd/                          # ArgoCD Applications
│   ├── root.yaml                    # Root App of Apps (START HERE)
│   ├── core-infra.yaml              # Infrastructure components
│   ├── observability.yaml           # Monitoring stack
│   ├── business-apps.yaml           # Hotel microservices
│   └── resources/
│       ├── gateway/                 # Istio Gateway and VirtualServices
│       └── namespaces/              # Namespace definitions
│
├── charts/                          # Helm Charts
│   └── microservice-chart/          # Generic microservice chart
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│
└── storage/                         # Storage configurations
    └── storage-class.yaml           # GP3 default StorageClass
```

## 🚀 Quick Start

### Prerequisites

1. **Kubernetes Cluster**: Kubeadm on AWS EC2 (3 nodes, Ubuntu 22.04)
2. **Calico CNI**: Installed and running
3. **AWS Cloud Controller Manager**: Running and authorized
4. **ArgoCD**: Installed in `argocd` namespace

### Step 1: Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=600s deployment/argocd-server -n argocd

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Port-forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Access ArgoCD at https://localhost:8080 (username: `admin`, password from above)

### Step 2: Deploy Root App of Apps

```bash
# Apply the root application
kubectl apply -f argocd/root.yaml

# Watch ArgoCD sync all applications
kubectl get applications -n argocd -w
```

This will automatically deploy:
1. **Core Infrastructure** (EBS CSI, ALB Controller, Istio, Harbor)
2. **Observability Stack** (Prometheus, Grafana, Jaeger, Kiali)
3. **Business Applications** (Hotel microservices)

### Step 3: Verify Deployment

```bash
# Check all ArgoCD applications
kubectl get applications -n argocd

# Check Istio installation
kubectl get pods -n istio-system

# Check observability stack
kubectl get pods -n observability

# Check Harbor
kubectl get pods -n harbor

# Get Istio Ingress Gateway LoadBalancer
kubectl get svc -n istio-system istio-ingressgateway
```

## 📊 Accessing Services

After deployment, services are accessible via the Istio Ingress Gateway. Get the LoadBalancer DNS:

```bash
export GATEWAY_URL=$(kubectl get svc istio-ingressgateway -n istio-system -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "Gateway URL: $GATEWAY_URL"
```

### Service Endpoints

Add these to your `/etc/hosts` or DNS:

| Service | URL | Description |
|---------|-----|-------------|
| Harbor | https://harbor.phoenix.com | Container Registry |
| Grafana | https://monitor.phoenix.com | Metrics Dashboard |
| Kiali | https://mesh.phoenix.com | Service Mesh Visualization |
| Jaeger | https://tracing.phoenix.com | Distributed Tracing |
| Prometheus | https://prometheus.phoenix.com | Metrics Collection |
| Booking API | https://booking.phoenix.com | Booking Service |

## 🔧 Configuration Details

### 1. Storage Configuration

**File**: `storage/storage-class.yaml`

- **StorageClass**: `gp3` (default)
- **Provisioner**: AWS EBS CSI Driver
- **Type**: GP3 (General Purpose SSD v3)
- **Encryption**: Enabled
- **Volume Binding**: WaitForFirstConsumer

### 2. Core Infrastructure

**File**: `argocd/core-infra.yaml`

#### AWS EBS CSI Driver
- **Purpose**: Persistent volume provisioning
- **Namespace**: `kube-system`
- **Features**: Volume scheduling, resizing, snapshots

#### AWS Load Balancer Controller
- **Purpose**: ALB/NLB creation for Services/Ingress
- **Namespace**: `kube-system`
- **Cluster Name**: `phoenix-cluster`

#### Istio Service Mesh
- **Components**: istio-base, istiod, istio-ingressgateway
- **Namespace**: `istio-system`
- **Ingress**: AWS NLB (instance target type for Calico compatibility)
- **Tracing**: Integrated with Jaeger

**CRITICAL AWS NLB Configuration**:
```yaml
service.beta.kubernetes.io/aws-load-balancer-type: "external"
service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "instance"  # NOT IP!
```

#### Harbor Registry
- **Purpose**: Private container registry
- **Namespace**: `harbor`
- **Persistence**: GP3 volumes (100Gi registry, 10Gi chartmuseum)
- **Admin Password**: `HarborAdmin123!` (change in production)
- **Exposure**: Istio VirtualService at `harbor.phoenix.com`

### 3. Observability Stack

**File**: `argocd/observability.yaml`

#### Prometheus
- **Replicas**: 2
- **Retention**: 30 days / 50GB
- **Storage**: 100Gi GP3 volume
- **Istio Integration**: ServiceMonitors for mesh metrics

#### Grafana
- **Replicas**: 2
- **Admin Password**: `GrafanaAdmin123!` (change in production)
- **Storage**: 10Gi GP3 volume
- **Dashboards**: Pre-configured Istio and Kubernetes dashboards

#### Jaeger
- **Mode**: All-in-one (use production mode for scale)
- **Storage**: Elasticsearch backend
- **Collector**: Receives traces from Istio sidecars

#### Kiali
- **Replicas**: 2
- **Auth**: Anonymous (use OIDC in production)
- **Integration**: Prometheus, Grafana, Jaeger

#### Elasticsearch
- **Replicas**: 2
- **Storage**: 100Gi GP3 per node
- **Purpose**: Jaeger trace storage

### 4. Microservice Chart

**Path**: `charts/microservice-chart`

A flexible Helm chart for deploying microservices with:

- **Istio Integration**: Automatic sidecar injection
- **Ingress**: VirtualService or standard Ingress
- **Persistence**: Optional PVC with GP3
- **Autoscaling**: HPA support
- **Security**: Pod security contexts, secrets
- **Observability**: Health checks, tracing

**Usage Example**:
```bash
helm install booking-service charts/microservice-chart \
  --set name=booking-service \
  --set namespace=hotel \
  --set image.repository=harbor.phoenix.com/hotel/booking-service \
  --set image.tag=v1.0.0 \
  --set ingress.enabled=true \
  --set ingress.virtualService.hosts[0]=booking.phoenix.com
```

### 5. Business Applications

**File**: `argocd/business-apps.yaml`

Hotel microservices deployed from `app-code` repository:

- **booking-service**: Room booking management
- **room-service**: Room inventory
- **payment-service**: Payment processing
- **notification-service**: Email/SMS notifications
- **api-gateway**: API aggregation

All services:
- Run in `hotel` namespace
- Use Istio sidecar injection
- Expose via VirtualServices
- Managed by ArgoCD

## 🔄 GitOps Workflow

### Making Changes

1. **Update configuration** in this repository
2. **Commit and push** to main branch
3. **ArgoCD detects** changes automatically
4. **Sync** happens automatically (or manually via UI)

### Manual Sync

```bash
# Sync specific application
argocd app sync booking-service

# Sync all applications
argocd app sync -l app.kubernetes.io/instance=phoenix-platform

# Force sync (ignore differences)
argocd app sync booking-service --force
```

### Rollback

```bash
# Get history
argocd app history booking-service

# Rollback to specific revision
argocd app rollback booking-service 2
```

## 🛠️ Troubleshooting

### ArgoCD Application Not Syncing

```bash
# Check application status
kubectl get application booking-service -n argocd -o yaml

# Check sync status
argocd app get booking-service

# Check logs
kubectl logs -n argocd deployment/argocd-application-controller
```

### Istio Ingress Gateway Pending

**Symptom**: LoadBalancer stuck in `<pending>`

**Solution**:
1. Verify AWS Load Balancer Controller is running
2. Check subnet tags (must have `kubernetes.io/role/elb=1`)
3. Verify IAM permissions on nodes

```bash
# Check controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify service
kubectl describe svc istio-ingressgateway -n istio-system
```

### Harbor Not Accessible

**Symptom**: Cannot access `harbor.phoenix.com`

**Solution**:
1. Verify Istio Gateway is running
2. Check VirtualService configuration
3. Update DNS or `/etc/hosts` with Gateway LoadBalancer

```bash
# Check VirtualService
kubectl get virtualservice -n harbor

# Check Gateway
kubectl get gateway -n istio-system

# Test connectivity
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl -v harbor-portal.harbor.svc.cluster.local
```

### Prometheus Storage Full

**Symptom**: PVC at 100% capacity

**Solution**: Expand the PVC (GP3 supports dynamic expansion)

```bash
# Edit PVC
kubectl edit pvc prometheus-kube-prometheus-stack-prometheus-db-prometheus-kube-prometheus-stack-prometheus-0 -n observability

# Change size to 200Gi
spec:
  resources:
    requests:
      storage: 200Gi
```

## 📈 Monitoring

### Key Metrics to Watch

1. **Cluster Health**
   - Grafana Dashboard: Kubernetes Cluster Monitoring (GnetID: 15757)
   - Alerts: Node down, pod crash loops

2. **Istio Mesh**
   - Kiali: Service topology, traffic flow
   - Grafana Dashboard: Istio Mesh (GnetID: 7639)

3. **Application Performance**
   - Jaeger: Request traces, latency
   - Prometheus: Request rate, error rate, duration

### Accessing Metrics

```bash
# Grafana credentials
kubectl get secret -n observability kube-prometheus-stack-grafana -o jsonpath="{.data.admin-password}" | base64 -d

# Kiali (anonymous auth enabled)
# Just access via browser at mesh.phoenix.com

# Jaeger
# Access via browser at tracing.phoenix.com
```

## 🔐 Security Considerations

### Production Hardening

1. **Change Default Passwords**
   ```yaml
   # Harbor
   harborAdminPassword: <strong-password>

   # Grafana
   adminPassword: <strong-password>
   ```

2. **Enable TLS**
   - Create TLS secrets for all domains
   - Update Gateway to use HTTPS only
   - Redirect HTTP to HTTPS

3. **Enable RBAC**
   - Use Kiali with OIDC authentication
   - Configure ArgoCD SSO
   - Create service accounts per application

4. **Network Policies**
   - Restrict traffic between namespaces
   - Use Istio AuthorizationPolicies

5. **Image Security**
   - Enable Harbor vulnerability scanning
   - Use signed images only
   - Configure admission controller

## 🚢 Deployment Best Practices

### 1. Progressive Delivery

Use Argo Rollouts for canary deployments:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
spec:
  strategy:
    canary:
      steps:
        - setWeight: 20
        - pause: {duration: 5m}
        - setWeight: 50
        - pause: {duration: 5m}
        - setWeight: 100
```

### 2. Resource Limits

Always set resource requests and limits:

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### 3. Health Checks

Configure liveness and readiness probes:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
```

### 4. Autoscaling

Enable HPA for variable load:

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

## 📚 Additional Resources

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Istio Documentation](https://istio.io/latest/docs/)
- [Harbor Documentation](https://goharbor.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Kiali Documentation](https://kiali.io/docs/)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test in dev environment
4. Create pull request
5. ArgoCD syncs after merge

## 📝 License

MIT License - Phoenix Platform Team
