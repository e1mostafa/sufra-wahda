# سُفرة واحدة — Software Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  Customer Web (Next.js) │ Restaurant Dashboard │ Admin │ Driver │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                      API GATEWAY (Nginx)                         │
│              Rate Limiting │ Load Balancing │ SSL                │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   ASP.NET Core Web API                           │
│                   Clean Architecture                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  Auth Module  │ │ Orders Module│ │ Delivery Mod.│            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ Menu Module  │ │Payment Module│ │ Notif. Module│            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────┬──────────────┬───────────────┬───────────────────────────┘
      │              │               │
┌─────▼──┐    ┌─────▼──┐    ┌──────▼──────┐
│ PgSQL  │    │ Redis  │    │  Cloudinary  │
│  DB    │    │ Cache  │    │  (Images)   │
└────────┘    └────────┘    └─────────────┘
```

## Clean Architecture Layers

### 1. Domain Layer (Core Business)
- Entities (Restaurant, Order, Customer, Driver, Product...)
- Value Objects (Money, Address, Coordinates...)
- Domain Events
- Repository Interfaces
- Domain Services

### 2. Application Layer
- Use Cases / Commands / Queries (CQRS with MediatR)
- DTOs (Data Transfer Objects)
- Validators (FluentValidation)
- Application Services
- Event Handlers

### 3. Infrastructure Layer
- Repository Implementations (EF Core)
- External Services (Fawry, Stripe, Firebase)
- Email / SMS providers
- Cloudinary integration
- Redis caching
- Background jobs (Hangfire)

### 4. API Layer (Presentation)
- Controllers
- Middleware (Auth, Exception, Logging)
- Filters
- Swagger / OpenAPI
- Response wrappers

## Technology Stack

### Frontend
| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Shadcn UI |
| State Management | Zustand |
| Data Fetching | React Query (TanStack) |
| Forms | React Hook Form + Zod |
| Maps | Google Maps API |
| Real-time | Socket.io-client |
| Animations | Framer Motion |

### Backend
| Layer | Technology |
|-------|------------|
| Framework | ASP.NET Core 8 Web API |
| Architecture | Clean Architecture + CQRS |
| Auth | JWT + Refresh Tokens |
| ORM | Entity Framework Core 8 |
| Caching | Redis (StackExchange.Redis) |
| Real-time | SignalR |
| Jobs | Hangfire |
| Docs | Swagger + NSwag |
| Validation | FluentValidation |
| Mapping | AutoMapper |

### Database
| Layer | Technology |
|-------|------------|
| Primary DB | PostgreSQL 16 |
| Cache | Redis 7 |
| Search | PostgreSQL Full-Text Search |
| File Storage | Cloudinary |

### Infrastructure
| Layer | Technology |
|-------|------------|
| Containerization | Docker + Docker Compose |
| Deployment | Railway |
| CI/CD | GitHub Actions |
| Monitoring | Sentry |
| Analytics | Mixpanel |
| Push Notifications | Firebase Cloud Messaging |
| SMS | Vonage / Twilio |
| Email | SendGrid |

## Security Architecture
- JWT with short expiry (15 min) + Refresh Tokens (7 days)
- HTTPS everywhere (TLS 1.3)
- Rate limiting per IP and per user
- SQL injection prevention (parameterized queries via EF Core)
- XSS protection headers
- CORS policy
- Input validation on all endpoints
- PCI-DSS compliant payment handling (tokenization)
- Data encryption at rest for sensitive fields
- Audit logging for all admin actions

## Scalability Design
- Stateless API (ready for horizontal scaling)
- Redis for session sharing across instances
- Database connection pooling
- CDN for static assets (Cloudinary)
- Lazy loading and pagination everywhere
- Background job queues for heavy operations
- Webhook-based payment confirmations
