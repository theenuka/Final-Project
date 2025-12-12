# Phoenix Platform - Complete File Structure

## Overview

This document provides a complete overview of all files in the `/config` repository for GitOps management of the Phoenix Kubernetes platform.

## Directory Tree

```
config/
├── .gitignore                                   # Git ignore patterns
├── README.md                                    # Main documentation
├── DEPLOYMENT.md                                # Complete deployment guide
├── STRUCTURE.md                                 # This file
│
├── argocd/                                      # ArgoCD Applications (App of Apps)
│   ├── README.md                                # ArgoCD documentation
│   ├── root.yaml                                # ⭐ ENTRY POINT - Root App of Apps
│   ├── core-infra.yaml                          # Infrastructure components
│   ├── observability.yaml                       # Monitoring stack
│   ├── business-apps.yaml                       # Hotel microservices
│   └── resources/
│       ├── gateway/                             # Istio Gateway resources
│       │   ├── phoenix-gateway.yaml             # Main Istio Gateway
│       │   ├── harbor-virtualservice.yaml       # Harbor VirtualService
│       │   └── observability-virtualservices.yaml  # Monitoring VirtualServices
│       └── namespaces/
│           └── hotel-namespace.yaml             # Hotel namespace with Istio injection
│
├── charts/                                      # Helm Charts
│   └── microservice-chart/                     # Generic microservice chart
│       ├── Chart.yaml                           # Chart metadata
│       ├── README.md                            # Chart documentation
│       ├── values.yaml                          # Default values
│       └── templates/                           # Kubernetes manifests
│           ├── _helpers.tpl                     # Template helpers
│           ├── serviceaccount.yaml              # ServiceAccount
│           ├── deployment.yaml                  # Deployment
│           ├── service.yaml                     # Service
│           ├── ingress.yaml                     # Istio VirtualService/Ingress
│           ├── pvc.yaml                         # PersistentVolumeClaim
│           ├── hpa.yaml                         # HorizontalPodAutoscaler
│           └── destinationrule.yaml             # Istio DestinationRule
│
└── storage/                                     # Storage configurations
    ├── README.md                                # Storage documentation
    └── storage-class.yaml                       # GP3 default StorageClass
```

## File Descriptions

### Root Level

| File | Purpose |
|------|---------|
| `.gitignore` | Exclude secrets, temporary files, IDE configs |
| `README.md` | Complete platform documentation |
| `DEPLOYMENT.md` | Step-by-step deployment guide |
| `STRUCTURE.md` | This file - complete structure overview |

### ArgoCD Directory (`argocd/`)

#### Main Application Files

| File | Description | Components |
|------|-------------|------------|
| **root.yaml** | **Entry point** - Root App of Apps that bootstraps entire platform | 4 root applications |
| **core-infra.yaml** | Infrastructure components Application manifest | 8 infrastructure apps |
| **observability.yaml** | Monitoring stack Application manifest | 4 observability apps |
| **business-apps.yaml** | Hotel microservices Application manifest | 5+ business apps |

#### Core Infrastructure Apps (core-infra.yaml)

1. **storage-class** - GP3 StorageClass
2. **aws-ebs-csi-driver** - EBS volume provisioner
3. **aws-load-balancer-controller** - ALB/NLB controller
4. **istio-base** - Istio CRDs
5. **istiod** - Istio control plane
6. **istio-ingressgateway** - Istio ingress with AWS NLB
7. **phoenix-gateway** - Main Gateway resource
8. **harbor** - Container registry

#### Observability Apps (observability.yaml)

1. **kube-prometheus-stack** - Prometheus + Grafana + Alertmanager
2. **jaeger** - Distributed tracing
3. **kiali** - Service mesh observability
4. **elasticsearch** - Jaeger storage backend

#### Business Apps (business-apps.yaml)

1. **hotel-namespace** - Namespace with Istio injection
2. **booking-service** - Room booking management
3. **room-service** - Room inventory
4. **payment-service** - Payment processing
5. **notification-service** - Notifications
6. **api-gateway** - API aggregation

#### Resources Directory (`argocd/resources/`)

**Gateway Resources** (`gateway/`):
- `phoenix-gateway.yaml` - Main Istio Gateway (HTTP/HTTPS)
- `harbor-virtualservice.yaml` - Expose Harbor at harbor.phoenix.com
- `observability-virtualservices.yaml` - Expose Grafana, Kiali, Jaeger, Prometheus

**Namespace Resources** (`namespaces/`):
- `hotel-namespace.yaml` - Hotel namespace with Istio sidecar injection enabled

### Charts Directory (`charts/microservice-chart/`)

Generic Helm chart for deploying microservices.

#### Chart Files

| File | Purpose |
|------|---------|
| `Chart.yaml` | Chart metadata (version 1.0.0) |
| `values.yaml` | Default values (image, replicas, resources, etc.) |
| `README.md` | Chart usage documentation |

#### Templates

| Template | Resource | Features |
|----------|----------|----------|
| `_helpers.tpl` | Helper functions | Name generation, labels |
| `serviceaccount.yaml` | ServiceAccount | Optional creation |
| `deployment.yaml` | Deployment | Replicas, resources, probes, volumes |
| `service.yaml` | Service | ClusterIP by default |
| `ingress.yaml` | VirtualService/Ingress | Istio or standard Kubernetes |
| `pvc.yaml` | PersistentVolumeClaim | Optional persistence with GP3 |
| `hpa.yaml` | HorizontalPodAutoscaler | CPU/memory-based scaling |
| `destinationrule.yaml` | DestinationRule | Istio traffic policies |

#### Chart Features

- **Istio Integration**: Automatic sidecar injection, VirtualServices, DestinationRules
- **Persistence**: Optional PVC with GP3 StorageClass
- **Autoscaling**: HPA with CPU/memory targets
- **Security**: Pod security contexts, service accounts
- **Observability**: Health probes, Istio telemetry
- **Database**: Environment variable injection for DB connections
- **Flexibility**: ConfigMaps, Secrets, custom env vars

### Storage Directory (`storage/`)

| File | Description |
|------|-------------|
| `README.md` | Storage documentation |
| `storage-class.yaml` | GP3 StorageClass (default, encrypted, WaitForFirstConsumer) |

## Application Dependencies

### Deployment Order (Sync Waves)

```
Wave 0: Namespaces, CRDs
├── storage-class
└── istio-base

Wave 1: Core Infrastructure
├── aws-ebs-csi-driver
└── aws-load-balancer-controller

Wave 2: Istio Control Plane
└── istiod

Wave 3: Istio Data Plane
├── istio-ingressgateway
└── phoenix-gateway

Wave 4: Platform Services
├── harbor
├── kube-prometheus-stack
├── elasticsearch
├── jaeger
└── kiali

Wave 5: Business Applications
├── hotel-namespace
├── booking-service
├── room-service
├── payment-service
├── notification-service
└── api-gateway
```

## Configuration Hierarchy

### ArgoCD Application Hierarchy

```
root.yaml
├── phoenix-platform (Meta App)
├── core-infrastructure
│   ├── storage-class
│   ├── aws-ebs-csi-driver
│   ├── aws-load-balancer-controller
│   ├── istio-base
│   ├── istiod
│   ├── istio-ingressgateway
│   ├── phoenix-gateway
│   └── harbor
├── observability-stack
│   ├── kube-prometheus-stack
│   ├── jaeger
│   ├── kiali
│   └── elasticsearch
└── business-applications
    ├── hotel-namespace
    ├── booking-service
    ├── room-service
    ├── payment-service
    ├── notification-service
    └── api-gateway
```

## Key Configuration Details

### Istio Gateway (CRITICAL for AWS + Calico)

**File**: `argocd/core-infra.yaml` (istio-ingressgateway section)

**Critical Annotations**:
```yaml
service.beta.kubernetes.io/aws-load-balancer-type: "external"
service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "instance"  # NOT IP!
service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
```

**Why**: Calico CNI requires `instance` target type, not `ip` mode.

### Storage Class

**File**: `storage/storage-class.yaml`

**Key Settings**:
- Provisioner: `ebs.csi.aws.com`
- Type: `gp3`
- Encrypted: `true`
- Default: `true`
- VolumeBindingMode: `WaitForFirstConsumer`

### Harbor Persistence

**File**: `argocd/core-infra.yaml` (harbor section)

**Volumes**:
- Registry: 100Gi GP3
- ChartMuseum: 10Gi GP3
- JobService: 5Gi GP3
- Database: 10Gi GP3
- Redis: 5Gi GP3
- Trivy: 10Gi GP3

### Prometheus Retention

**File**: `argocd/observability.yaml` (kube-prometheus-stack section)

**Settings**:
- Retention: 30 days
- Retention Size: 50GB
- Storage: 100Gi GP3

### Service Exposure

All services exposed via Istio Gateway:

| Service | Domain | VirtualService Location |
|---------|--------|-------------------------|
| Harbor | harbor.phoenix.com | `argocd/resources/gateway/harbor-virtualservice.yaml` |
| Grafana | monitor.phoenix.com | `argocd/resources/gateway/observability-virtualservices.yaml` |
| Kiali | mesh.phoenix.com | `argocd/resources/gateway/observability-virtualservices.yaml` |
| Jaeger | tracing.phoenix.com | `argocd/resources/gateway/observability-virtualservices.yaml` |
| Prometheus | prometheus.phoenix.com | `argocd/resources/gateway/observability-virtualservices.yaml` |
| Booking API | booking.phoenix.com | Defined in `business-apps.yaml` |

## Customization Points

### To Change Storage Class Type

Edit `storage/storage-class.yaml`:
```yaml
parameters:
  type: gp3  # Change to io1, io2, st1, sc1
```

### To Add New Microservice

1. Add to `argocd/business-apps.yaml`:
```yaml
---
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-new-service
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/phoenix/app-code
    path: deploy/k8s/my-new-service
  destination:
    namespace: hotel
```

2. Create VirtualService if needed
3. Commit and push - ArgoCD auto-syncs

### To Change Istio Ingress LoadBalancer

Edit `argocd/core-infra.yaml` (istio-ingressgateway):
```yaml
service:
  type: LoadBalancer  # or NodePort
  annotations:
    # Modify annotations for different LB types
```

### To Enable TLS

1. Create TLS secret:
```bash
kubectl create secret tls phoenix-tls-cert \
  -n istio-system \
  --cert=cert.pem \
  --key=key.pem
```

2. Edit `argocd/resources/gateway/phoenix-gateway.yaml`:
```yaml
spec:
  servers:
    - port:
        number: 443
        name: https
        protocol: HTTPS
      tls:
        mode: SIMPLE
        credentialName: phoenix-tls-cert
      hosts:
        - "*.phoenix.com"
```

## File Count Summary

```
Total Files: 24
├── YAML Manifests: 14
├── Helm Charts: 1
│   └── Templates: 8
├── Documentation: 5
└── Configuration: 1 (.gitignore)
```

## Size Estimates

```
Repository Size: ~150 KB
├── YAML Files: ~120 KB
├── Documentation: ~50 KB
└── Templates: ~30 KB
```

## Git Repository Structure

Recommended repository organization:

```
phoenix-config/  (This repository)
├── config/      (This directory)
└── .git/

phoenix-app-code/  (Separate repository)
└── deploy/
    └── k8s/
        ├── booking-service/
        ├── room-service/
        ├── payment-service/
        ├── notification-service/
        └── api-gateway/
```

## Quick Reference

### Deploy Everything
```bash
kubectl apply -f argocd/root.yaml
```

### Deploy Individual Components
```bash
kubectl apply -f argocd/core-infra.yaml
kubectl apply -f argocd/observability.yaml
kubectl apply -f argocd/business-apps.yaml
```

### Check All Applications
```bash
kubectl get applications -n argocd
```

### Access Services
```bash
# Get gateway URL
export GATEWAY_URL=$(kubectl get svc istio-ingressgateway -n istio-system \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Access services (after DNS configuration)
open http://harbor.phoenix.com
open http://monitor.phoenix.com
open http://mesh.phoenix.com
```

## Maintenance

### Update ArgoCD Applications

```bash
# Edit YAML files
vim argocd/core-infra.yaml

# Commit and push
git add .
git commit -m "Update infrastructure configuration"
git push

# ArgoCD auto-syncs (or manual sync)
argocd app sync core-infrastructure
```

### Backup Configuration

```bash
# Backup entire config repository
git clone https://github.com/phoenix/config phoenix-config-backup

# Backup ArgoCD applications
kubectl get applications -n argocd -o yaml > argocd-apps-backup.yaml
```

### Disaster Recovery

```bash
# Restore from Git
git clone https://github.com/phoenix/config
kubectl apply -f config/argocd/root.yaml

# ArgoCD recreates everything automatically
```

## Conclusion

This structure implements a complete GitOps platform with:

✅ **Infrastructure as Code**: All configs in Git
✅ **App of Apps Pattern**: Hierarchical application management
✅ **Production-Ready**: HA, persistence, monitoring
✅ **AWS Integration**: EBS, ALB/NLB, IAM
✅ **Service Mesh**: Istio with full observability
✅ **Container Registry**: Harbor with persistence
✅ **Monitoring**: Prometheus, Grafana, Jaeger, Kiali
✅ **GitOps**: ArgoCD automated deployment
✅ **Microservices**: Flexible Helm chart library

**Total deployment time**: ~45 minutes from `kubectl apply -f root.yaml` to fully operational platform!
