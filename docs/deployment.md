# PiDAOSphere Deployment Guide

## Prerequisites

- Node.js v16 or higher
- Docker and Docker Compose
- Kubernetes cluster (we use DigitalOcean Kubernetes)
- Redis instance
- Solana devnet/mainnet access
- Pi Network developer account
- SSL certificates

## Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pidaosphere.git
cd pidaosphere
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `SOLANA_NETWORK`: devnet/mainnet-beta
- `RPC_ENDPOINT`: Solana RPC endpoint
- `PROGRAM_ID`: Deployed program ID
- `PI_NETWORK_API`: Pi Network API endpoint
- `PI_APP_ID`: Your Pi app ID
- `PI_API_KEY`: Your Pi API key
- `JWT_SECRET`: Secret for JWT tokens
- `REDIS_URL`: Redis connection URL

## Local Development

1. Start Redis:
```bash
docker-compose up -d redis
```

2. Run development server:
```bash
npm run dev
```

## Production Deployment

### Docker Build

1. Build Docker image:
```bash
docker build -t pidaosphere/app:latest .
```

2. Push to registry:
```bash
docker push pidaosphere/app:latest
```

### Kubernetes Deployment

1. Apply Kubernetes configurations:
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

2. Verify deployment:
```bash
kubectl get pods -n pidaosphere
kubectl get services -n pidaosphere
kubectl get ingress -n pidaosphere
```

### SSL/TLS Configuration

1. Install cert-manager:
```bash
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.7.1/cert-manager.yaml
```

2. Apply SSL configuration:
```bash
kubectl apply -f k8s/certificate.yaml
```

## Monitoring Setup

1. Install Prometheus:
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack
```

2. Install Grafana:
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm install grafana grafana/grafana
```

3. Configure dashboards:
- Import provided Grafana dashboard JSON from `monitoring/dashboards/`
- Set up alerts in Grafana

## Backup and Recovery

### Database Backups

1. Configure automated backups:
```bash
kubectl apply -f k8s/backup-cronjob.yaml
```

2. Manual backup:
```bash
kubectl exec -it $(kubectl get pods -l app=redis -o jsonpath='{.items[0].metadata.name}') -- redis-cli save
```

### Recovery Procedure

1. Stop the application:
```bash
kubectl scale deployment pidaosphere-app --replicas=0
```

2. Restore data:
```bash
kubectl cp backup.rdb redis-0:/data/dump.rdb
kubectl exec -it redis-0 -- redis-cli FLUSHALL
kubectl exec -it redis-0 -- redis-cli SHUTDOWN SAVE
```

3. Restart the application:
```bash
kubectl scale deployment pidaosphere-app --replicas=3
```

## Security Considerations

1. Network Security:
- Enable network policies
- Configure firewalls
- Use private networks

2. Application Security:
- Regular dependency updates
- Security scanning
- Input validation

3. Infrastructure Security:
- RBAC configuration
- Secret management
- Regular audits

## Troubleshooting

### Common Issues

1. Pod startup failures:
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

2. Service connectivity:
```bash
kubectl exec -it <pod-name> -- curl localhost:3000/health
```

3. Redis connection:
```bash
kubectl exec -it <pod-name> -- redis-cli ping
```

### Monitoring and Logs

1. View application logs:
```bash
kubectl logs -f -l app=pidaosphere
```

2. Monitor resources:
```bash
kubectl top pods
kubectl top nodes
```

## Performance Tuning

1. Node.js Configuration:
- Set appropriate memory limits
- Configure garbage collection
- Enable worker threads

2. Redis Configuration:
- Set maxmemory policy
- Configure persistence
- Optimize connection pool

3. Kubernetes Configuration:
- Set resource requests/limits
- Configure HPA
- Optimize node pools 