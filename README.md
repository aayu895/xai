# 🏛️ XAI-Gov — Transparent AI Framework for Accountable Governance

> An enterprise-grade AI governance platform that makes government AI systems **transparent, explainable, accountable, ethical, and trustworthy**.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat&logo=python)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://docker.com)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0-orange?style=flat)](https://xgboost.readthedocs.io)
[![SHAP](https://img.shields.io/badge/SHAP-0.45-red?style=flat)](https://shap.readthedocs.io)

---

## 📋 Overview

XAI-Gov demonstrates how **Explainable AI (XAI)** can be applied to government decision-making systems:

- 🏠 Welfare eligibility
- 🎓 Scholarship approvals
- 🏥 Healthcare prioritization
- 💰 Subsidy distribution
- 📋 Citizen grievance systems

For every AI decision, the platform explains:
- **WHY** the decision was made
- **WHICH** factors influenced it and by how much
- **HOW** confident the AI system is
- **WHETHER** the system is fair and unbiased
- **WHO** reviewed or approved the decision
- **COMPLETE** immutable audit history

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     XAI-Gov Platform                        │
├──────────────┬──────────────────────┬───────────────────────┤
│   Frontend   │      Backend API     │      AI/ML Engine     │
│  Next.js 14  │   Python FastAPI     │  XGBoost + SHAP/LIME  │
│  TypeScript  │   JWT Auth           │  Feature Importance   │
│  Tailwind    │   SQLAlchemy ORM     │  Fairness Metrics     │
│  Framer      │   REST APIs          │  Confidence Scoring   │
│  Recharts    │   Rate Limiting      │  Bias Detection       │
├──────────────┴──────────────────────┴───────────────────────┤
│                  PostgreSQL 16 Database                      │
│          Users | Decisions | Explanations | Audit Logs      │
├─────────────────────────────────────────────────────────────┤
│              Docker Compose Deployment                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- (Optional for local dev) Python 3.11+, Node.js 20+

### 1. Clone & Start

```bash
git clone https://github.com/your-org/xai-gov.git
cd xai-gov

# Start everything with Docker
docker-compose up --build
```

The first run will:
1. Start PostgreSQL
2. Train all 4 AI models (welfare, scholarship, healthcare, subsidy)
3. Launch the FastAPI backend on **http://localhost:8000**
4. Launch the Next.js frontend on **http://localhost:3000**

### 2. Seed Demo Data

```bash
# After docker-compose up, in a new terminal:
docker exec -it xaigov_backend python scripts/seed.py
```

### 3. Access the Platform

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Frontend (Landing Page) |
| http://localhost:8000/api/docs | FastAPI Swagger UI |
| http://localhost:8000/api/redoc | API ReDoc |

---

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| 👤 Citizen | ravi.kumar@example.com | Citizen@123 |
| 🏛️ Officer | officer.sharma@gov.in | Officer@123 |
| ⚙️ Admin | admin@xaigov.in | Admin@123 |

---

## 📁 Project Structure

```
xai-gov/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # FastAPI route handlers
│   │   ├── core/               # Config, security, dependencies
│   │   ├── db/                 # DB session, base model
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic services
│   │   └── ml/                 # XGBoost + SHAP/LIME engine
│   ├── main.py                 # FastAPI app entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── app/                # Next.js App Router pages
│       │   ├── landing/        # Public landing page
│       │   ├── auth/           # Login & Register
│       │   └── dashboard/      # Citizen, Officer, Admin portals
│       ├── components/         # Reusable UI components
│       │   ├── charts/         # SHAP, Confidence, Trend charts
│       │   ├── layout/         # Sidebar, Header
│       │   └── shared/         # StatCard, DecisionCard
│       ├── lib/                # API client (axios)
│       ├── store/              # Zustand auth store
│       └── types/              # TypeScript types
├── scripts/
│   └── seed.py                 # Database seeder
├── data/
│   └── sample_dataset.csv      # Sample gov dataset
├── docker-compose.yml
└── README.md
```

---

## 🤖 AI/ML Stack

### Models
- **Algorithm**: XGBoost (XGBClassifier) with 200 estimators
- **Domains**: Welfare, Scholarship, Healthcare, Subsidy
- **Features**: Income, Family Size, Education, Health, Region, Employment, Age, Disability

### Explainability
| Method | Purpose |
|--------|---------|
| SHAP TreeExplainer | Feature attribution per prediction |
| LIME | Local perturbation-based explanation |
| Feature Importance | Global XGBoost importance scores |

### Fairness
- Per-prediction fairness score computed
- Region-based bias detection flag
- Officer override tracking for accountability

---

## 📡 API Reference

### Authentication
```
POST /api/v1/auth/register   — Register new user
POST /api/v1/auth/login      — Login, get JWT
GET  /api/v1/auth/me         — Get current user
```

### Decisions
```
POST /api/v1/decisions/              — Submit application (AI inference)
GET  /api/v1/decisions/my            — Get my decisions (citizen)
GET  /api/v1/decisions/all           — Get all decisions (officer/admin)
GET  /api/v1/decisions/{id}          — Get decision detail + explanation
POST /api/v1/decisions/{id}/review   — Officer review
POST /api/v1/decisions/{id}/appeal   — Submit appeal
```

### Analytics
```
GET /api/v1/analytics/stats          — Dashboard statistics
GET /api/v1/analytics/citizen-stats  — Citizen-specific stats
GET /api/v1/analytics/audit-logs     — Audit trail
GET /api/v1/analytics/model-performance — AI model metrics
GET /api/v1/analytics/trend-data     — Decision trends
GET /api/v1/analytics/users          — User list (admin)
```

### Reports
```
GET /api/v1/reports/{id}/pdf         — Download PDF transparency report
```

---

## 🛡️ Security

- JWT-based authentication (access + refresh tokens)
- bcrypt password hashing (12 rounds)
- Role-based access control (citizen/officer/admin)
- SQL injection protection via SQLAlchemy ORM
- Rate limiting via slowapi
- CORS configuration
- Environment variable-based secrets

---

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| db | 5432 | PostgreSQL 16 |
| backend | 8000 | FastAPI + Uvicorn |
| frontend | 3000 | Next.js 14 |

---

## 🔮 Future Improvements

1. **Multilingual Support** — 22 Indian language explanations via NLG
2. **Blockchain Audit Trail** — Immutable DLT-based decision ledger
3. **Mobile App** — React Native citizen app with push notifications
4. **LLM Explanations** — GPT-style natural language report generation
5. **Multi-Ministry Integration** — Scale to health, tax, agriculture domains
6. **Real-Time Bias Monitoring** — Continuous fairness metric tracking
7. **Federated Learning** — Privacy-preserving cross-ministry model training

---

## 👥 Team

- **Aayushi Jha** — R24EA003
- **Adithya M** — R24EA006
- **Bhoomika M** — R24EA020

School of Computing and Information Technology  
REVA University, Bengaluru  
`#EducateToEnterprise`

---

## 📄 License

MIT License — See LICENSE for details.
