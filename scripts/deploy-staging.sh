#!/bin/bash

# Staging Environment Deployment Script
# Usage: ./scripts/deploy-staging.sh [options]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="staging"
COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deploy-$(date +%Y%m%d-%H%M%S).log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "${ENV_FILE}.example" ]; then
            warning "Environment file not found. Creating from template..."
            cp "${ENV_FILE}.example" "$ENV_FILE"
            error "Please configure $ENV_FILE with actual values"
        else
            error "Environment file $ENV_FILE not found"
        fi
    fi
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p "$BACKUP_DIR"
    
    log "Prerequisites check completed"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    BACKUP_NAME="backup-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
    BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
    
    # Backup database
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "postgres"; then
        log "Backing up database..."
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
            -U erp_admin -d erp_staging > "${BACKUP_PATH}-db.sql" 2>/dev/null || true
    fi
    
    # Backup volumes
    log "Backing up Docker volumes..."
    docker run --rm \
        -v $(pwd)/${BACKUP_DIR}:/backup \
        -v erp_postgres_data:/postgres_data:ro \
        -v erp_redis_data:/redis_data:ro \
        alpine tar czf /backup/${BACKUP_NAME}-volumes.tar.gz \
        /postgres_data /redis_data 2>/dev/null || true
    
    log "Backup completed: ${BACKUP_PATH}"
}

# Pull latest changes
pull_latest() {
    log "Pulling latest changes from repository..."
    
    # Check for uncommitted changes
    if ! git diff --quiet HEAD; then
        warning "Uncommitted changes detected"
        read -p "Do you want to stash changes? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git stash
        else
            error "Please commit or stash changes before deployment"
        fi
    fi
    
    # Pull latest changes
    git pull origin staging || error "Failed to pull latest changes"
    
    log "Repository updated"
}

# Build and deploy
deploy() {
    log "Starting deployment to ${ENVIRONMENT}..."
    
    # Load environment variables
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
    
    # Pull latest images
    log "Pulling Docker images..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Stop current containers
    log "Stopping current containers..."
    docker-compose -f "$COMPOSE_FILE" down
    
    # Start new containers
    log "Starting new containers..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_health
    
    log "Deployment completed successfully"
}

# Check service health
check_health() {
    log "Checking service health..."
    
    # Check backend health
    if ! curl -f http://localhost:3000/health &>/dev/null; then
        error "Backend health check failed"
    fi
    
    # Check database connection
    if ! docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U erp_admin &>/dev/null; then
        error "Database health check failed"
    fi
    
    # Check Redis
    if ! docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping &>/dev/null; then
        warning "Redis health check failed"
    fi
    
    # Show service status
    docker-compose -f "$COMPOSE_FILE" ps
    
    log "All services are healthy"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations
    docker-compose -f "$COMPOSE_FILE" exec -T backend npm run migration:run || {
        warning "Migration failed, attempting rollback..."
        rollback
        error "Deployment failed due to migration error"
    }
    
    log "Migrations completed successfully"
}

# Run tests
run_tests() {
    log "Running smoke tests..."
    
    # Run API tests
    docker-compose -f "$COMPOSE_FILE" exec -T backend npm run test:e2e || {
        warning "Tests failed"
        read -p "Continue deployment despite test failures? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            rollback
            error "Deployment cancelled due to test failures"
        fi
    }
    
    log "Tests completed"
}

# Rollback deployment
rollback() {
    warning "Rolling back deployment..."
    
    # Stop current containers
    docker-compose -f "$COMPOSE_FILE" down
    
    # Restore from backup if available
    LATEST_BACKUP=$(ls -t ${BACKUP_DIR}/backup-*.sql 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        log "Restoring from backup: $LATEST_BACKUP"
        # Restore database
        docker-compose -f "$COMPOSE_FILE" up -d postgres
        sleep 10
        docker-compose -f "$COMPOSE_FILE" exec -T postgres psql \
            -U erp_admin -d erp_staging < "$LATEST_BACKUP"
    fi
    
    # Restart services with previous version
    git checkout HEAD~1
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log "Rollback completed"
}

# Clean up old resources
cleanup() {
    log "Cleaning up old resources..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove old backups (keep last 5)
    ls -t ${BACKUP_DIR}/backup-*.sql 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    
    # Remove old logs (keep last 30 days)
    find ./logs -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    log "Cleanup completed"
}

# Show deployment status
show_status() {
    log "Deployment Status:"
    echo "===================="
    echo "Environment: $ENVIRONMENT"
    echo "Services:"
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "Resource Usage:"
    docker stats --no-stream
    echo ""
    echo "Recent Logs:"
    docker-compose -f "$COMPOSE_FILE" logs --tail=20
}

# Main execution
main() {
    log "Starting deployment process for $ENVIRONMENT environment"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --rollback)
                rollback
                exit 0
                ;;
            --status)
                show_status
                exit 0
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --skip-backup    Skip backup before deployment"
                echo "  --skip-tests     Skip running tests after deployment"
                echo "  --rollback       Rollback to previous deployment"
                echo "  --status         Show current deployment status"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    # Execute deployment steps
    check_prerequisites
    
    if [ "$SKIP_BACKUP" != "true" ]; then
        backup_current
    fi
    
    pull_latest
    deploy
    run_migrations
    
    if [ "$SKIP_TESTS" != "true" ]; then
        run_tests
    fi
    
    cleanup
    show_status
    
    log "Deployment completed successfully!"
    echo -e "${GREEN}✓ Staging environment is ready at http://localhost:8080${NC}"
}

# Run main function
main "$@"