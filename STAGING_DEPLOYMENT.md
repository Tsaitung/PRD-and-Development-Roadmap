# 菜蟲農食 ERP System - Staging Environment Deployment Guide

## Overview

This guide provides instructions for deploying and managing the staging environment for the 菜蟲農食 ERP System.

## Prerequisites

### System Requirements
- Docker Engine 20.10+ 
- Docker Compose 2.0+
- Git 2.30+
- Node.js 18+ (for local development)
- 8GB RAM minimum
- 20GB free disk space

### Network Ports
The following ports need to be available:
- **3000**: Backend API
- **4200**: Frontend Application
- **5433**: PostgreSQL Database
- **6380**: Redis Cache
- **5673**: RabbitMQ
- **15673**: RabbitMQ Management
- **9201**: Elasticsearch
- **9000**: MinIO Object Storage
- **9001**: MinIO Console
- **8080**: Nginx Proxy
- **9090**: Prometheus
- **3001**: Grafana

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/tsaitung/erp-system.git
cd erp-system
git checkout staging
```

### 2. Configure Environment
```bash
# Copy the environment template
cp .env.staging.example .env.staging

# Edit the environment file with your values
nano .env.staging
```

**Important environment variables to configure:**
- `DB_PASSWORD`: Strong password for PostgreSQL
- `REDIS_PASSWORD`: Redis authentication password
- `JWT_SECRET`: Secret key for JWT tokens (min 32 characters)
- `MINIO_PASSWORD`: MinIO admin password
- `GRAFANA_PASSWORD`: Grafana admin password

### 3. Deploy Using Script
```bash
# Make the script executable
chmod +x scripts/deploy-staging.sh

# Run deployment
./scripts/deploy-staging.sh
```

### 4. Manual Deployment
```bash
# Start all services
docker-compose -f docker-compose.staging.yml up -d

# Check service status
docker-compose -f docker-compose.staging.yml ps

# View logs
docker-compose -f docker-compose.staging.yml logs -f
```

## Service Access

Once deployed, services are accessible at:

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend Application | http://localhost:4200 | Use API credentials |
| Backend API | http://localhost:3000 | - |
| API Documentation | http://localhost:3000/api-docs | - |
| PostgreSQL | localhost:5433 | erp_admin / [DB_PASSWORD] |
| Redis Commander | - | - |
| RabbitMQ Management | http://localhost:15673 | erp_admin / [RABBITMQ_PASSWORD] |
| MinIO Console | http://localhost:9001 | erp_admin / [MINIO_PASSWORD] |
| Prometheus | http://localhost:9090 | - |
| Grafana | http://localhost:3001 | admin / [GRAFANA_PASSWORD] |
| Nginx | http://localhost:8080 | - |

## Database Management

### Run Migrations
```bash
# Execute migrations
docker-compose -f docker-compose.staging.yml exec backend npm run migration:run

# Create a new migration
docker-compose -f docker-compose.staging.yml exec backend npm run migration:create --name=MigrationName

# Revert last migration
docker-compose -f docker-compose.staging.yml exec backend npm run migration:revert
```

### Seed Data
```bash
# Load staging seed data
docker-compose -f docker-compose.staging.yml exec backend npm run seed:staging

# Clear all data (CAUTION!)
docker-compose -f docker-compose.staging.yml exec backend npm run db:reset
```

### Database Backup
```bash
# Create backup
docker-compose -f docker-compose.staging.yml exec postgres \
  pg_dump -U erp_admin -d erp_staging > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.staging.yml exec -T postgres \
  psql -U erp_admin -d erp_staging < backup-20250825-120000.sql
```

## Monitoring

### Health Checks
```bash
# Backend health
curl http://localhost:3000/health

# Database health
docker-compose -f docker-compose.staging.yml exec postgres pg_isready

# Redis health
docker-compose -f docker-compose.staging.yml exec redis redis-cli ping

# All services status
docker-compose -f docker-compose.staging.yml ps
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.staging.yml logs -f

# Specific service
docker-compose -f docker-compose.staging.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.staging.yml logs --tail=100
```

### Metrics & Dashboards
1. **Prometheus**: http://localhost:9090
   - Query metrics
   - View targets status
   - Configure alerts

2. **Grafana**: http://localhost:3001
   - Pre-configured dashboards
   - Custom visualizations
   - Alert management

## Testing

### Run Tests in Staging
```bash
# Unit tests
docker-compose -f docker-compose.staging.yml exec backend npm run test

# Integration tests
docker-compose -f docker-compose.staging.yml exec backend npm run test:integration

# E2E tests
docker-compose -f docker-compose.staging.yml exec backend npm run test:e2e

# Performance tests
npm run test:performance -- --env=staging
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env.staging
```

#### 2. Container Won't Start
```bash
# Check logs
docker-compose -f docker-compose.staging.yml logs <service-name>

# Rebuild container
docker-compose -f docker-compose.staging.yml build --no-cache <service-name>
```

#### 3. Database Connection Failed
```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.staging.yml ps postgres

# Test connection
docker-compose -f docker-compose.staging.yml exec postgres \
  psql -U erp_admin -d erp_staging -c "SELECT 1"
```

#### 4. Out of Memory
```bash
# Check memory usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Or add memory limits to docker-compose.staging.yml
```

### Reset Environment
```bash
# Stop and remove all containers
docker-compose -f docker-compose.staging.yml down -v

# Remove all data (CAUTION!)
docker volume prune -f

# Fresh start
./scripts/deploy-staging.sh
```

## Deployment Workflow

### Automated Deployment (GitHub Actions)
Pushes to `staging` branch trigger automatic deployment:

1. Run tests
2. Build Docker images
3. Push to registry
4. Deploy to staging server
5. Run migrations
6. Execute smoke tests
7. Send notifications

### Manual Deployment Steps
1. **Pre-deployment**
   ```bash
   # Create backup
   ./scripts/deploy-staging.sh --backup-only
   
   # Run tests locally
   npm test
   ```

2. **Deploy**
   ```bash
   # Standard deployment
   ./scripts/deploy-staging.sh
   
   # Skip tests
   ./scripts/deploy-staging.sh --skip-tests
   ```

3. **Post-deployment**
   ```bash
   # Verify deployment
   curl http://localhost:3000/health
   
   # Check logs
   docker-compose -f docker-compose.staging.yml logs --tail=50
   ```

### Rollback Procedure
```bash
# Automated rollback
./scripts/deploy-staging.sh --rollback

# Manual rollback
docker-compose -f docker-compose.staging.yml down
git checkout HEAD~1
docker-compose -f docker-compose.staging.yml up -d
```

## Security

### SSL/TLS Configuration
For production-like staging with HTTPS:

1. Generate certificates:
   ```bash
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout nginx/ssl/key.pem \
     -out nginx/ssl/cert.pem
   ```

2. Uncomment SSL configuration in `nginx/staging.conf`

3. Restart Nginx:
   ```bash
   docker-compose -f docker-compose.staging.yml restart nginx
   ```

### Access Control
- Implement IP whitelisting in `nginx/staging.conf`
- Use strong passwords for all services
- Regularly rotate credentials
- Monitor access logs

## Maintenance

### Regular Tasks
- **Daily**: Check logs and metrics
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Full backup and disaster recovery test

### Cleanup
```bash
# Remove unused images
docker image prune -a -f

# Clean build cache
docker builder prune -f

# Remove old logs
find ./logs -name "*.log" -mtime +30 -delete

# Clean old backups (keep last 5)
ls -t backups/*.sql | tail -n +6 | xargs rm -f
```

## CI/CD Integration

### GitHub Actions
The repository includes automated workflows:
- `.github/workflows/staging-deploy.yml`: Automated staging deployment
- `.github/workflows/tests.yml`: Test suite execution
- `.github/workflows/security-scan.yml`: Security vulnerability scanning

### Environment Variables for CI/CD
Set these secrets in GitHub repository settings:
- `STAGING_DB_PASSWORD`
- `STAGING_REDIS_PASSWORD`
- `STAGING_JWT_SECRET`
- `STAGING_SSH_KEY`
- `STAGING_HOST`
- `STAGING_USER`
- `SLACK_WEBHOOK`

## Support

### Resources
- **Documentation**: `/docs`
- **API Docs**: http://localhost:3000/api-docs
- **Issue Tracker**: https://github.com/tsaitung/erp-system/issues
- **Team Contact**: devops@tsaitung.com

### Getting Help
1. Check the logs first
2. Review this documentation
3. Search existing issues
4. Contact the DevOps team

---

**Last Updated**: 2025-08-25
**Version**: 1.0.0
**Maintained By**: 菜蟲農食 DevOps Team