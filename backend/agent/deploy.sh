#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -n "${1:-}" ]; then
  DEPLOY_ENV="$1"
  echo -e "${BLUE}Using specified environment: ${DEPLOY_ENV}${NC}"
else
  if [ -d "terraform" ]; then
    ACTIVE_ENVS=$(cd terraform 2>/dev/null && terraform output -json active_environments 2>/dev/null | grep -o '"[^"]*"' | tr -d '"' | head -1 || echo "")
    if [ -n "$ACTIVE_ENVS" ]; then
      DEPLOY_ENV="$ACTIVE_ENVS"
      echo -e "${GREEN}Auto-detected environment from Terraform: ${DEPLOY_ENV}${NC}"
    else
      DEPLOY_ENV="staging"
      echo -e "${YELLOW}Terraform outputs not available, using default: ${DEPLOY_ENV}${NC}"
    fi
  else
    DEPLOY_ENV="staging"
    echo -e "${YELLOW}Terraform directory not found, using default: ${DEPLOY_ENV}${NC}"
  fi
fi

ECS_CLUSTER_NAME="${DEPLOY_ENV}"
ECS_SERVICE_NAME="${DEPLOY_ENV}-service"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deploy Configuration${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Environment:    ${DEPLOY_ENV}"
echo "ECS Cluster:    ${ECS_CLUSTER_NAME}"
echo "ECS Service:    ${ECS_SERVICE_NAME}"
echo -e "${BLUE}========================================${NC}"

echo "Updating ECS service to use the latest task definition..."

aws ecs update-service \
  --force-new-deployment \
  --cluster "${ECS_CLUSTER_NAME}" \
  --service "${ECS_SERVICE_NAME}" | jq

echo "Waiting for ECS service to stabilize..."

aws ecs wait services-stable \
  --cluster "${ECS_CLUSTER_NAME}" \
  --services "${ECS_SERVICE_NAME}"

echo "ECS service is stable."
