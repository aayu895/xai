#!/bin/bash
# XAI-Gov Quick Start Script
set -e

echo "╔══════════════════════════════════════════════════╗"
echo "║         XAI-Gov — Quick Start                   ║"
echo "║   Transparent AI for Accountable Governance     ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker not found. Please install Docker first."
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo "❌ docker-compose not found."
  exit 1
fi

echo "🔨 Building and starting services..."
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be healthy (60s)..."
sleep 60

echo ""
echo "🌱 Seeding database with demo data..."
docker-compose run --rm seeder 2>/dev/null || echo "⚠ Seed may have already run."

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║              XAI-Gov is Ready! 🚀               ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Frontend:  http://localhost:3000               ║"
echo "║  Backend:   http://localhost:8000               ║"
echo "║  API Docs:  http://localhost:8000/api/docs      ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Demo Accounts:                                 ║"
echo "║  Citizen: ravi.kumar@example.com / Citizen@123  ║"
echo "║  Officer: officer.sharma@gov.in  / Officer@123  ║"
echo "║  Admin:   admin@xaigov.in        / Admin@123    ║"
echo "╚══════════════════════════════════════════════════╝"
