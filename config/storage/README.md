# Storage Configuration

## GP3 StorageClass

This directory contains the default StorageClass configuration for the Phoenix Kubernetes cluster.

### Features

- **Provisioner**: AWS EBS CSI Driver (`ebs.csi.aws.com`)
- **Volume Type**: GP3 (General Purpose SSD v3)
- **Encryption**: Enabled by default
- **Volume Binding**: WaitForFirstConsumer (optimizes AZ placement)
- **Expansion**: Allowed (can resize volumes dynamically)
- **Default**: Marked as cluster default StorageClass

### Usage

Applications can request persistent storage using this StorageClass:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-app-data
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp3
  resources:
    requests:
      storage: 10Gi
```

Or omit `storageClassName` to use the default:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-app-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### Deployment

This StorageClass is deployed via ArgoCD as part of the core infrastructure.

```bash
kubectl apply -f storage-class.yaml
```

### Verification

```bash
# Check StorageClass
kubectl get storageclass

# Verify it's marked as default
kubectl get storageclass gp3 -o yaml | grep "is-default-class"

# Test PVC creation
kubectl apply -f test-pvc.yaml
kubectl get pvc
```
