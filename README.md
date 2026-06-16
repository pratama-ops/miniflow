# MiniFlow

A distributed workflow execution engine built with NestJS, BullMQ, and PostgreSQL. Designed to handle background job execution at scale with real-time observability.

## Architecture
## Architecture

```mermaid
flowchart TD
    Client["Client\n(Swagger / API Consumer)"]
    
    Client -->|HTTP Request| API["REST API\n(NestJS)"]
    
    API -->|Authenticate| Auth["Auth Module\n(JWT + Passport)"]
    API -->|CRUD| WorkflowModule["Workflow Module\n(PostgreSQL via Prisma)"]
    API -->|Trigger Job| JobService["Job Service"]
    
    JobService -->|Create Job Record| DB[("PostgreSQL\n(Prisma)")]
    JobService -->|Push to Queue| Queue["Redis Queue\n(BullMQ)"]
    
    Queue -->|Consume Job| Worker["Job Processor\n(Worker)"]
    
    Worker -->|Execute Steps| Steps["Step Execution\n(http / email / transform)"]
    Worker -->|Update Status| DB
    
    API -->|Monitor| BullBoard["Bull Board\nDashboard"]
    BullBoard -->|Read Queue State| Queue
```

## Features

- **Dynamic Workflow Definition** — define multi-step workflows as JSON, stored and executed dynamically
- **Async Job Execution** — jobs are queued and executed in the background without blocking API responses
- **Real-time Status Tracking** — track job and step-level status (PENDING → RUNNING → COMPLETED/FAILED)
- **Automatic Retry** — failed jobs are automatically retried by BullMQ
- **Per-user Job Quota** — configurable concurrent job limit per tenant
- **Queue Observability** — built-in Bull Board dashboard for real-time queue monitoring
- **JWT Authentication** — secure endpoints with JWT-based auth
- **API Documentation** — interactive Swagger UI

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | NestJS |
| Queue | BullMQ |
| Cache / Queue Storage | Redis |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + Passport |
| Containerization | Docker |

## Getting Started

### Prerequisites

- Node.js 22+
- Docker + Docker Compose

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/miniflow.git
cd miniflow
```

2. Install dependencies

```bash
npm install
```

3. Copy environment variables

```bash
cp .env.example .env
```

4. Start infrastructure (PostgreSQL + Redis)

```bash
docker compose up -d postgres redis
```

5. Run database migrations

```bash
npx prisma migrate dev
```

6. Start the application

```bash
npm run start:dev
```

### Running with Docker

To run the full stack including the app:

```bash
docker compose up -d
```

## API Documentation

Once running, visit:

- **Swagger UI** — `http://localhost:3000/docs`
- **Bull Board** — `http://localhost:3000/queue`

## API Overview

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login and get JWT token |

### Workflow
| Method | Endpoint | Description |
|---|---|---|
| POST | /workflow | Create a new workflow |
| GET | /workflow | Get all workflows |
| GET | /workflow/:id | Get workflow by ID |
| PATCH | /workflow/:id | Update workflow |
| DELETE | /workflow/:id | Delete workflow |

### Job
| Method | Endpoint | Description |
|---|---|---|
| POST | /job/trigger | Trigger a workflow execution |
| GET | /job | Get all jobs |
| GET | /job/:id | Get job details with steps |

## Workflow Definition Example

```json
{
  "name": "Daily Report",
  "description": "Fetch and send daily report",
  "triggerType": "MANUAL",
  "steps": [
    {
      "index": 1,
      "name": "fetch_data",
      "type": "http",
      "config": { "url": "https://api.example.com/data" }
    },
    {
      "index": 2,
      "name": "transform",
      "type": "transform",
      "config": {}
    },
    {
      "index": 3,
      "name": "send_email",
      "type": "email",
      "config": { "to": "report@example.com" }
    }
  ]
}
```

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@localhost:5432/miniflow |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| JWT_SECRET | Secret key for JWT signing | your_secret_key |
| PORT | App port (optional) | 3000 |

## Key Technical Decisions

**Why BullMQ over simple async functions?**
BullMQ provides persistent job storage, automatic retries, concurrency control, and a monitoring UI — none of which are available with plain async/await.

**Why dynamic JSON steps instead of hardcoded workflows?**
Storing step definitions as JSON allows workflows to be created and modified via API without code changes or redeployment.

**Why per-user job quota?**
In a multi-tenant system, unbounded job execution per user can starve other tenants. Quota enforcement ensures fair resource distribution.

## License

MIT