# CommunityIQ — Enterprise AI-Powered Civic Intelligence Platform

## Overview

CommunityIQ is a production-grade AI-powered civic intelligence platform that goes beyond traditional complaint management. It uses Artificial Intelligence, Geospatial Intelligence (GIS), Predictive Analytics, Real-time Collaboration, and Enterprise Automation to intelligently identify, verify, prioritize, predict, manage, and resolve civic issues.

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Citizens / Volunteers / Officials        │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────▼─────────┐
         │   Next.js 14 Web  │  (Adaptive Design System, PWA)
         │   React 18 + RSC   │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │   NestJS Backend  │  (REST API + WebSocket)
         └─────────┬─────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼───┐    ┌────▼────┐   ┌────▼────┐
│PostgreSQL│  │  Redis  │   │ Elastic │
│ + PostGIS│  │ (Cache) │   │ Search  │
└──────────┘  └─────────┘   └─────────┘
                   │
         ┌─────────▼─────────┐
         │  AI Intelligence  │
         │  Layer            │
         └─────────┬─────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼───┐    ┌────▼────┐   ┌────▼────┐
│Gemini │    │ OpenAI  │   │ Local   │
│  API  │    │  API    │   │ Models  │
└───────┘    └─────────┘   └─────────┘
```

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS + Framer Motion
- **State:** Zustand + React Query
- **Maps:** React-Leaflet
- **Charts:** Recharts
- **Design:** Adaptive multi-color theme system (every page has its own color palette)
- **PWA:** Full Progressive Web App support

### Backend
- **Framework:** NestJS 10
- **Language:** TypeScript
- **Database:** PostgreSQL 16 + PostGIS
- **Cache:** Redis 7
- **Search:** Elasticsearch 8
- **Auth:** JWT + Refresh Tokens + MFA
- **AI:** Google Gemini + OpenAI integration
- **Storage:** AWS S3 + CloudFront
- **Push:** Firebase Cloud Messaging

## Features

### Core Modules

| Module | Description |
|--------|-------------|
| **Smart Issue Reporting** | Multi-step form with images, video, audio, GPS, AI-assisted creation |
| **AI Intelligence Engine** | Classification, severity scoring, duplicate/fake detection, department recommendation |
| **Community Verification** | Citizen validation, voting, evidence upload, trust scoring |
| **Live GIS Map** | Interactive map with filters, clustering, heatmaps, risk zones |
| **Predictive Intelligence** | Flood/road/infrastructure predictions, early warnings |
| **Government Operations** | Issue queue, workforce management, SLA monitoring |
| **Community Heroes** | Leaderboards, badges, hero levels, volunteer coordination |
| **AI Assistant** | Natural language civic intelligence chat |
| **Analytics & Insights** | Dashboards, KPIs, department performance, AI reports |
| **Emergency Center** | Red alert system, emergency contacts, evacuation guidance |

### Adaptive Design System

Each page uses its own color palette:

| Page | Color Theme |
|------|------------|
| Dashboard | Blue + Purple + Cyan |
| Report Issue | Green + Emerald + Teal |
| Live Map | Emerald + Sky Blue + Teal |
| AI Assistant | Purple + Indigo + Cyan |
| Emergency | Red + Rose + Orange |
| Analytics | Navy Blue + Cyan + Gold |
| Government Ops | Royal Blue + Steel Gray |
| Community Heroes | Amber + Yellow + Orange |
| Profile | Teal + Sky Blue |
| Settings | Gray + Blue Accent |

### Security

- JWT authentication with refresh tokens
- Role-Based Access Control (RBAC)
- Multi-Factor Authentication (MFA)
- Rate limiting + API protection
- Input validation + sanitization
- Secure file upload handling
- Helmet security headers

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ with PostGIS
- Redis 7+
- Docker & Docker Compose (recommended)

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/your-org/communityiq.git
cd communityiq

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# API Docs: http://localhost:3001/docs
```

### Manual Setup

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run build
npm run seed  # Seed initial data
npm run start:dev

# Frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@communityiq.com | admin123 |
| Citizen | citizen@communityiq.com | citizen123 |
| Volunteer | volunteer@communityiq.com | volunteer123 |

## Project Structure

```
CommunityIQ/
├── frontend/                    # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── (auth)/         # Login, Register, Forgot Password
│   │   │   ├── (dashboard)/    # All dashboard pages
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── globals.css     # Global styles + design system
│   │   ├── components/         # Reusable UI components
│   │   │   ├── layout/         # Sidebar, Header, MobileNav
│   │   │   ├── dashboard/      # Dashboard widgets
│   │   │   ├── emergency/      # Emergency alert banner
│   │   │   └── ui/             # Generic UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── stores/             # Zustand state stores
│   │   └── lib/                # Utilities, API client, themes
│   └── public/                 # Static assets + PWA manifest
├── backend/                     # NestJS Backend
│   ├── src/
│   │   ├── modules/            # Feature modules
│   │   │   ├── auth/           # Authentication + RBAC
│   │   │   ├── users/          # User management
│   │   │   ├── issues/         # Issue CRUD + lifecycle
│   │   │   ├── ai/             # AI intelligence engine
│   │   │   ├── community/      # Community verification
│   │   │   ├── gis/            # PostGIS spatial queries
│   │   │   ├── notifications/  # FCM + in-app notifications
│   │   │   ├── emergency/      # Emergency alert system
│   │   │   ├── analytics/      # Dashboard + reporting
│   │   │   ├── volunteers/     # Community heroes
│   │   │   └── upload/         # S3 file uploads
│   │   ├── database/           # Entities + seeds
│   │   ├── config/             # App configuration
│   │   └── common/             # Guards, pipes, interceptors
│   └── .env.example            # Environment variables
├── shared/                      # Shared TypeScript types
├── docker-compose.yml           # Docker orchestration
├── Dockerfile                   # Multi-stage build
└── .github/workflows/           # CI/CD pipeline
```

## API Documentation

Backend API documentation is available via Swagger UI at `/docs` when the backend is running.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login |
| POST | /issues | Create new issue |
| GET | /issues | List issues with filters |
| GET | /issues/:id | Get issue details |
| POST | /ai/analyze | AI analysis of issue |
| GET | /gis/nearby | Nearby issues by location |
| GET | /analytics/dashboard | Dashboard metrics |
| POST | /emergency/alerts | Create emergency alert |
| GET | /community/leaderboard | Community leaderboard |

## Deployment

### Production Deployment

1. Configure environment variables in `.env`
2. Run `docker-compose -f docker-compose.prod.yml up -d`
3. Set up SSL certificates in `nginx/ssl/`
4. Configure DNS and load balancing
5. Set up monitoring and alerting

### Supported Platforms

- AWS (ECS/EKS + RDS + ElastiCache + S3 + CloudFront)
- Google Cloud (Cloud Run + Cloud SQL + Memorystore)
- Azure (Container Apps + Azure Database + Redis Cache)
- Vercel (Frontend) + Railway/Render (Backend)
- Self-hosted with Docker Compose

## Environment Variables

See `.env.example` in both `frontend/` and `backend/` for the full list of required environment variables.

### Required API Keys

| Service | Purpose |
|---------|---------|
| OpenAI API | AI text analysis, classification |
| Google Gemini API | AI vision, image analysis |
| AWS S3 | File storage |
| Firebase | Push notifications |
| Google Maps | Interactive maps (optional) |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built with ❤️ for smarter, more responsive cities.
