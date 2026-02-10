# Fullstack CRUD App

A modern full-stack blog application with authentication, built with React, Fastify, and PostgreSQL.

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Vite** - Build tool and dev server
- **Vitest** - Unit testing
- **Playwright** - E2E testing

### Backend
- **Fastify** - High-performance Node.js framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Zod** - Schema validation
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Infrastructure
- **Docker Compose** - Container orchestration
- **GitHub Actions** - CI/CD pipeline
- **nginx** - Frontend static server (production)

## Project Structure

```
fullstack-crud-app/
├── api/                    # Backend API
│   ├── src/
│   │   ├── auth/          # Auth routes, JWT, password hashing
│   │   ├── posts/         # Posts CRUD routes and schemas
│   │   ├── middleware/    # Auth middleware, security (CORS, rate-limit)
│   │   ├── config.ts      # Environment validation
│   │   ├── db.ts          # Prisma client
│   │   ├── errors.ts      # Custom error classes
│   │   ├── errorHandler.ts # Global error handler
│   │   └── server.ts      # Fastify app setup
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── test/              # API tests
│   └── Dockerfile
│
├── frontend/              # React frontend
│   ├── src/
│   │   ├── api/          # API client and type definitions
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # Auth context
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   ├── routes/       # Router and protected routes
│   │   └── utils/        # Utilities (token storage)
│   ├── Dockerfile
│   └── nginx.conf
│
├── tests/                 # Playwright E2E tests
│   ├── auth.spec.ts
│   └── posts.spec.ts
│
├── docker-compose.yml     # Full stack orchestration
├── playwright.config.ts   # E2E test configuration
└── .github/workflows/     # CI/CD pipeline
```

## Getting Started

### Prerequisites
- Node.js 20+
- Docker and Docker Compose
- npm

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YongamaD/fullstack-crud-app.git
   cd fullstack-crud-app
   ```

2. **Start the database**
   ```bash
   docker compose up -d db
   ```

3. **Setup the API**
   ```bash
   cd api
   cp .env.example .env
   npm install
   npx prisma migrate dev
   npm run dev
   ```

4. **Setup the frontend** (new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the app**
   - Frontend: http://localhost:5173
   - API: http://localhost:3000
   - API Health: http://localhost:3000/health

### Docker Setup (Full Stack)

```bash
# Start all services
docker compose up -d

# Access
# Frontend: http://localhost:8080
# API: http://localhost:3000
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/auth/me` | Get current user (auth required) |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | List published posts (public) |
| GET | `/posts?page=1&limit=10&search=term` | Paginated search |
| GET | `/posts/:id` | Get single post |
| GET | `/posts/me` | List user's posts (auth required) |
| POST | `/posts` | Create post (auth required) |
| PUT | `/posts/:id` | Update post (owner only) |
| DELETE | `/posts/:id` | Delete post (owner only) |

## Environment Variables

### API (`api/.env`)
```env
DATABASE_URL="postgresql://app:app@localhost:5432/app_dev?schema=public"
JWT_SECRET="your-secret-key-at-least-32-characters"
PORT=3000
HOST="0.0.0.0"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

### Frontend
```env
VITE_API_URL="http://localhost:3000"
```

## Testing

### Run All Tests
```bash
# API unit tests
cd api && npm test

# Frontend unit tests
cd frontend && npm test

# E2E tests (requires running app)
npx playwright test
```

### Test Coverage

| Category | Tests |
|----------|-------|
| API (Vitest) | 53 |
| Frontend Unit (Vitest) | 97 |
| E2E (Playwright) | 30 |
| **Total** | **180** |

## CI/CD Pipeline

The GitHub Actions pipeline runs on every push and PR:

1. **Frontend Job**
   - Lint, typecheck, unit tests, build

2. **API Job**
   - Typecheck, unit tests (with PostgreSQL service)

3. **E2E Job** (after frontend & api pass)
   - Starts API and frontend servers
   - Runs Playwright tests

## Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Authentication** - Secure token-based auth
- **Input Validation** - Zod schemas on all endpoints
- **CORS Protection** - Configurable allowed origins
- **Rate Limiting** - 100 requests per 15 minutes
- **Security Headers** - Helmet middleware (XSS, clickjacking protection)
- **Error Handling** - No sensitive info leaked in errors

## Design System

The frontend uses CSS custom properties for consistent theming:

- **Colors**: Primary (indigo), neutrals, semantic (success, error, warning)
- **Spacing**: 4px base unit scale
- **Typography**: System font stack with readable sizes
- **Components**: 44px touch targets, focus rings, responsive breakpoints

## Scripts

### API
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run test     # Run tests
npm run typecheck # TypeScript check
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run test     # Run unit tests
npm run lint     # ESLint
npm run typecheck # TypeScript check
```

### Root
```bash
npx playwright test              # Run E2E tests
npx playwright test --ui         # Interactive test UI
npx playwright test --debug      # Debug mode
```

## License

ISC
