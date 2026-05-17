#!/bin/bash
set -e

echo "🏛️  XAI-Gov — Starting Up"
echo "================================"

# Check docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker not found. Please install Docker first."
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo "❌ Docker Compose not found. Please install Docker Compose first."
  exit 1
fi

echo "✅ Docker found"

# Build and start
echo ""
echo "🔨 Building and starting services..."
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check health
RETRIES=0
MAX_RETRIES=20
until curl -sf http://localhost:8000/health > /dev/null 2>&1; do
  RETRIES=$((RETRIES+1))
  if [ $RETRIES -ge $MAX_RETRIES ]; then
    echo "❌ Backend did not become healthy. Check logs: docker-compose logs backend"
    exit 1
  fi
  echo "   Waiting for backend... ($RETRIES/$MAX_RETRIES)"
  sleep 5
done

echo "✅ Backend is healthy!"

# Seed
echo ""
echo "🌱 Seeding demo data..."
docker exec xaigov_backend python scripts/seed.py

echo ""
echo "================================"
echo "🚀 XAI-Gov is running!"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  API Docs:  http://localhost:8000/api/docs"
echo ""
echo "Demo Credentials:"
echo "  👤 Citizen:  ravi.kumar@example.com / Citizen@123"
echo "  🏛️  Officer:  officer.sharma@gov.in / Officer@123"
echo "  ⚙️  Admin:   admin@xaigov.in / Admin@123"
echo "================================"
