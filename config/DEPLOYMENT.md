# Phoenix Platform - Complete Deployment Guide

This guide walks you through deploying the entire Phoenix platform on your Kubeadm cluster.

## Prerequisites Verification

Before starting, verify:

```bash
# 1. Cluster is running
kubectl get nodes
# Expected: 3 nodes, all Ready

# 2. Calico CNI is active
kubectl get pods -n kube-system -l k8s-app=calico-node
# Expected: 3 calico-node pods running

# 3. AWS Cloud Controller Manager is running
kubectl get pods -n kube-system -l k8s-app=aws-cloud-controller-manager
# Expected: 1 CCM pod running

# 4. Nodes have AWS providerID
kubectl get nodes -o yaml | grep providerID
# Expected: aws:///us-east-1x/i-xxxxx for each node
```

## Step 1: Install ArgoCD

```bash
# Create ArgoCD namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/v2.9.3/manifests/install.yaml

# Wait for ArgoCD to be ready
echo "Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available --timeout=600s \
  deployment/argocd-server -n argocd

kubectl wait --for=condition=available --timeout=600s \
  deployment/argocd-repo-server -n argocd

kubectl wait --for=condition=available --timeout=600s \
  deployment/argocd-application-controller -n argocd

echo "✓ ArgoCD is ready!"

# Get initial admin password
export ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d)

echo "ArgoCD Admin Password: $ARGOCD_PASSWORD"
echo "Save this password - you'll need it to login!"

# Install ArgoCD CLI (optional but recommended)
# For macOS:
brew install argocd

# For Linux:
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x argocd
sudo mv argocd /usr/local/bin/

# Port-forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443 > /dev/null 2>&1 &

echo "ArgoCD UI: https://localhost:8080"
echo "Username: admin"
echo "Password: $ARGOCD_PASSWORD"
```

## Step 2: Clone Config Repository

```bash
# Clone the config repository (update with your Git URL)
git clone https://github.com/phoenix/config
cd config

# Verify structure
tree -L 2
```

## Step 3: Deploy Platform

### Method 1: All at Once (Recommended)

```bash
# Deploy everything via root App of Apps
kubectl apply -f argocd/root.yaml

echo "✓ Root App of Apps deployed!"
echo "ArgoCD will now automatically sync all applications"

# Watch deployment progress
kubectl get applications -n argocd -w
```

### Method 2: Step by Step

If you prefer to deploy components gradually:

```bash
# 1. Deploy core infrastructure first
kubectl apply -f argocd/core-infra.yaml

# Wait for infrastructure to be ready
argocd app wait core-infrastructure --timeout 600

# 2. Deploy observability stack
kubectl apply -f argocd/observability.yaml

# Wait for observability to be ready
argocd app wait observability-stack --timeout 600

# 3. Deploy business applications
kubectl apply -f argocd/business-apps.yaml
```

## Step 4: Verify Deployment

### Check All Applications

```bash
# List all applications
kubectl get applications -n argocd

# Expected output:
# NAME                    SYNC STATUS   HEALTH STATUS
# phoenix-platform        Synced        Healthy
# core-infrastructure     Synced        Healthy
# observability-stack     Synced        Healthy
# business-applications   Synced        Healthy
# storage-class           Synced        Healthy
# aws-ebs-csi-driver      Synced        Healthy
# aws-load-balancer-controller  Synced  Healthy
# istio-base              Synced        Healthy
# istiod                  Synced        Healthy
# istio-ingressgateway    Synced        Healthy
# harbor                  Synced        Healthy
# kube-prometheus-stack   Synced        Healthy
# jaeger                  Synced        Healthy
# kiali                   Synced        Healthy
# elasticsearch           Synced        Healthy
```

### Check Core Infrastructure

```bash
# EBS CSI Driver
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-ebs-csi-driver

# AWS Load Balancer Controller
kubectl get deployment -n kube-system aws-load-balancer-controller

# Istio
kubectl get pods -n istio-system

# Istio Gateway LoadBalancer (CRITICAL)
kubectl get svc -n istio-system istio-ingressgateway

# Should show EXTERNAL-IP with AWS NLB DNS
# Example: a1234567890abcdef-1234567890.elb.us-east-1.amazonaws.com

# Harbor
kubectl get pods -n harbor
```

### Check Observability

```bash
# Prometheus
kubectl get statefulset -n observability prometheus-kube-prometheus-stack-prometheus

# Grafana
kubectl get deployment -n observability kube-prometheus-stack-grafana

# Jaeger
kubectl get deployment -n observability jaeger

# Kiali
kubectl get deployment -n observability kiali

# Elasticsearch
kubectl get statefulset -n observability elasticsearch-master
```

### Check Storage

```bash
# Verify default StorageClass
kubectl get storageclass

# Should show gp3 as default:
# NAME            PROVISIONER       RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION
# gp3 (default)   ebs.csi.aws.com   Delete          WaitForFirstConsumer   true

# Check PVCs
kubectl get pvc -A

# Should show PVCs for Harbor, Prometheus, Grafana, Elasticsearch, etc.
```

## Step 5: Configure DNS

Get the Istio Ingress Gateway LoadBalancer DNS:

```bash
export GATEWAY_URL=$(kubectl get svc istio-ingressgateway -n istio-system \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "Gateway URL: $GATEWAY_URL"
```

### Option 1: Route 53 (Production)

Create Route 53 records:

```bash
# harbor.phoenix.com -> GATEWAY_URL (CNAME)
# monitor.phoenix.com -> GATEWAY_URL (CNAME)
# mesh.phoenix.com -> GATEWAY_URL (CNAME)
# tracing.phoenix.com -> GATEWAY_URL (CNAME)
# booking.phoenix.com -> GATEWAY_URL (CNAME)
```

### Option 2: /etc/hosts (Testing)

For local testing, add to `/etc/hosts`:

```bash
# Get LoadBalancer IP (resolve DNS)
export GATEWAY_IP=$(nslookup $GATEWAY_URL | grep 'Address:' | tail -n1 | awk '{print $2}')

# Add to /etc/hosts
sudo bash -c "cat >> /etc/hosts <<EOF
$GATEWAY_IP harbor.phoenix.com
$GATEWAY_IP monitor.phoenix.com
$GATEWAY_IP mesh.phoenix.com
$GATEWAY_IP tracing.phoenix.com
$GATEWAY_IP prometheus.phoenix.com
$GATEWAY_IP booking.phoenix.com
EOF"

echo "✓ DNS entries added to /etc/hosts"
```

## Step 6: Access Services

### Harbor (Container Registry)

```bash
# URL: http://harbor.phoenix.com
# Username: admin
# Password: HarborAdmin123!  (change this!)

# Test login
docker login harbor.phoenix.com
# Username: admin
# Password: HarborAdmin123!

echo "✓ Harbor is accessible!"
```

### Grafana (Monitoring)

```bash
# URL: http://monitor.phoenix.com
# Get password:
kubectl get secret -n observability kube-prometheus-stack-grafana \
  -o jsonpath="{.data.admin-password}" | base64 -d

# Username: admin
# Password: (from command above)

echo "✓ Grafana is accessible!"
```

### Kiali (Service Mesh)

```bash
# URL: http://mesh.phoenix.com
# No authentication (anonymous mode enabled)

echo "✓ Kiali is accessible!"
```

### Jaeger (Tracing)

```bash
# URL: http://tracing.phoenix.com
# No authentication

echo "✓ Jaeger is accessible!"
```

## Step 7: Deploy First Application

Let's deploy a test booking service:

### Create Application Values

Create `app-code/deploy/k8s/booking-service/values.yaml`:

```yaml
name: booking-service
namespace: hotel
replicaCount: 2

image:
  repository: harbor.phoenix.com/hotel/booking-service
  tag: v1.0.0
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

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### Sync Application

```bash
# ArgoCD will automatically detect and sync
argocd app sync booking-service

# Watch deployment
kubectl get pods -n hotel -w

# Test service
curl http://booking.phoenix.com/api/booking/health
```

## Step 8: Verify Observability

### Generate Traffic

```bash
# Install hey for load testing
go install github.com/rakyll/hey@latest

# Generate traffic
hey -z 60s -c 10 http://booking.phoenix.com/api/booking/
```

### Check Metrics

1. **Grafana**: http://monitor.phoenix.com
   - Dashboard: Istio Service Dashboard
   - Look for booking-service metrics

2. **Kiali**: http://mesh.phoenix.com
   - Graph: Select namespace "hotel"
   - See traffic flow visualization

3. **Jaeger**: http://tracing.phoenix.com
   - Search for "booking-service" traces
   - Analyze request latency

## Troubleshooting

### Applications Not Syncing

```bash
# Check application status
argocd app get <app-name>

# Force sync
argocd app sync <app-name> --force

# Check ArgoCD logs
kubectl logs -n argocd deployment/argocd-application-controller
```

### Istio Gateway LoadBalancer Pending

```bash
# Check AWS Load Balancer Controller
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify subnet tags
aws ec2 describe-subnets --filters "Name=tag:kubernetes.io/role/elb,Values=1"

# Check service events
kubectl describe svc istio-ingressgateway -n istio-system
```

### Harbor Not Accessible

```bash
# Check pods
kubectl get pods -n harbor

# Check VirtualService
kubectl get virtualservice -n harbor

# Test internal connectivity
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl -v harbor-portal.harbor.svc.cluster.local
```

### Prometheus Storage Full

```bash
# Check PVC usage
kubectl get pvc -n observability

# Expand PVC
kubectl patch pvc <pvc-name> -n observability -p '{"spec":{"resources":{"requests":{"storage":"200Gi"}}}}'
```

## Post-Deployment Checklist

- [ ] All ArgoCD applications synced and healthy
- [ ] Istio Ingress Gateway has external LoadBalancer
- [ ] DNS configured (Route 53 or /etc/hosts)
- [ ] Harbor accessible and login working
- [ ] Grafana accessible with dashboards showing data
- [ ] Kiali showing service mesh graph
- [ ] Jaeger showing traces
- [ ] Test application deployed and responding
- [ ] Metrics being collected
- [ ] Changed default passwords (Harbor, Grafana)

## Next Steps

1. **Security Hardening**
   - Change default passwords
   - Enable TLS/HTTPS
   - Configure RBAC
   - Enable network policies

2. **Configure CI/CD**
   - Set up GitOps workflow
   - Integrate with GitHub Actions
   - Automate image builds

3. **Deploy Hotel Microservices**
   - Build and push images to Harbor
   - Deploy via ArgoCD
   - Configure databases
   - Set up service mesh policies

4. **Monitoring & Alerting**
   - Configure Prometheus alerts
   - Set up Grafana dashboards
   - Integrate with PagerDuty/Slack
   - Configure log aggregation

5. **Performance Tuning**
   - Enable autoscaling
   - Configure resource limits
   - Optimize database connections
   - Implement caching

## Support

For issues or questions:
- Check ArgoCD UI: https://localhost:8080
- Review logs: `kubectl logs -n argocd deployment/argocd-application-controller`
- Check application health: `argocd app get <app-name>`
- Monitor with Grafana: http://monitor.phoenix.com

## Congratulations! 🎉

Your Phoenix platform is now fully deployed and ready for production workloads!
