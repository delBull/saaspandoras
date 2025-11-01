# 🏗️ Guía de Arquitectura Modular - Proyecto Pandora's

**Fecha:** Octubre 2025
**Versión:** 1.0
**Estado:** Sistema Acoplado → Arquitectura Modular
**Prioridad:** ALTA - Necesidad para desarrollo escalable

---

## 📋 ÍNDICE

1. [🎯 PROBLEMA ACTUAL y SOLUCIÓN PROPUESTA](#1️-problema-actual-y-solución-propuesta)
2. [🏛️ ARQUITECTURA PROPUESTA - PRINCIPIOS](#2️-arquitectura-propuesta---principios)
3. [📦 ESTRUCTURA MODULAR](#3️-estructura-modular)
4. [🚀 FASES DE IMPLEMENTACIÓN](#4️-fases-de-implementación)
5. [🎮 SERVICIOS INDEPENDIENTES - AUTENTICACIÓN](#5️-servicios-independientes---autenticación)
6. [💼 SERVICIOS INDEPENDIENTES - PROYECTOS](#6️-servicios-independientes---proyectos)
7. [🗄️ SERVICIOS INDEPENDIENTES - BASE DE DATOS](#7️-servicios-independientes---base-de-datos)
8. [🧬 SERVICIOS INDEPENDIENTES - GAMIFICACIÓN](#8️-servicios-independientes---gamificación)
9. [⚡ SISTEMA DE EVENTOS - COMMUNICATION BUS](#9️-sistema-de-eventos---communication-bus)
10. [🔧 APIs Y ENDPOINTS MODULARES](#0️-apis-y-endpoints-modulares)
11. [🧪 TESTING - UNITARIO Y INTEGRACIÓN](#1️-testing---unitario-e-integración)
12. [🚀 DEPLOYMENT y MONITOREO](#2️-deployment-y-monitoreo)
13. [👥 DESARROLLO DISTRIBUIDO](#3️-desarrollo-distribuido)
14. [📈 MÉTRICAS y KPI](#4️-métricas-y-kpi)

---

## 1️. PROBLEMA ACTUAL y SOLUCIÓN PROPUESTA

### 🚨 **Problemas Identificados:**

1. **Acoplamento Alto:** Las funcionalidades están fuertemente acopladas
   - Cambiar autenticación requiere cambios en todo el proyecto
   - Modificar proyectos afecta al dashboard
   - Gamificación depende de usuarios existentes

2. **Dependencias Circulares:** Servicios dependen unos de otros
   - Autenticación necesita usuarios
   - Proyectos necesitan autenticación
   - Gamificación necesita ambos

3. **Reaceleración Constante:** Cuando cambias una funcionalidad, rompes otras
   - Miedo a modificar código existente
   - Tiempo perdido en debugging
   - Frustración del desarrollo

4. **Escalabilidad Limitada:** No puedes agregar nuevas funcionalidades fácilmente

### ✅ **Solución Propuesta:**

**Patrón de Arquitectura Modular Apollo:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PANDORA'S DASHBOARD APP                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                API GATEWAY & COMMUNICATION BUS             │ │
│  │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐ │ │
│  │  │AUTH API  │PROJECTS  │DATABASE │GAMIFY   │BLOCKCHAIN │ │ │
│  │  │SERVICE   │API       │API      │API      │API        │ │ │
│  │  └──────────┴──────────┴──────────┴──────────┴──────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 📊 **ANÁLISIS DETALLADO DEL DASHBOARD ACTUAL**

### 🔍 **Estructura Actual del Dashboard Pandora's:**

**Hooks Analizados:**
- `useProfile` - Fetch de perfil con SWR, cache avanzado, errores quota-aware
- `useThirdwebUserSync` - Sincronización automática de usuarios Thirdweb
- `useFeaturedProjects` - Lista de proyectos destacados
- `useProjectActions` - Acciones CRUD para proyectos

**APIs Existentes:**
- `/api/profile` - Perfil de usuario (GET/POST)
- `/api/projects*` - Múltiples rutas de proyectos
- `/api/gamification/*` - Sistema de gamificación (events, leaderboard, profile, rewards)
- `/api/auth/*` - Autenticación y sesiones
- `/api/user-sync/*` - Sincronización de usuarios
- `/api/admin/*` - Funciones administrativas

**Tecnologías Principales:**
- **ORM:** Drizzle con PostgreSQL
- **Caching:** SWR para React con configuración avanzada
- **Auth:** Thirdweb wallets + social login
- **State Management:** Hooks custom + context local
- **Error Handling:** Graceful degradation, quota limits

### 🎯 **Beneficios Esperados:**

- ✅ **Independencia Total:** Cada servicio funciona separado
- ✅ **Desarrollo Paralelo:** Múltiples desarrolladores en diferentes módulos
- ✅ **Testing Aislado:** Unit test sin dependencias
- ✅ **Deployment Independiente:** Deploy servicios por separado
- ✅ **Escalabilidad:** Agregar nuevos módulos sin afectar existentes
- ✅ **Mantenibilidad:** Cambiar un servicio no afecta otros

---

## 2️. ARQUITECTURA PROPUESTA - PRINCIPIOS

### 🏛️ **Principios Arquitecturales:**

1. **Separation of Concerns:** Cada servicio tiene una responsabilidad única
2. **Single Responsibility:** Un servicio = Una funcionalidad
3. **Dependency Injection:** Servicios no conocen implementaciones internas
4. **Event-Driven Communication:** Comunicación vía eventos, no llamadas directas
5. **API-First Design:** APIs first, luego consumers
6. **Stateless Services:** Los servicios no mantienen estado compartido

### 🔧 **Tecnologías por Capa:**

```
Frontend Layer (Dashboard):
├── React + TypeScript + Next.js
├── @pandoras/ui (Shared Components)
├── Axios/Fetch para API calls
└── Local Storage/Session Storage

API Gateway Layer:
├── Next.js API Routes
├── RabbitMQ/Redis PubSub (Event Bus)
├── Rate Limiting & Security
└── API Versioning (v1, v2, etc.)

Service Layer:
├── Independent Services
├── Express.js + TypeScript
├── Database per Service
├── Event Publishing
└── Health Checks

Database Layer:
├── PostgreSQL (Primary)
├── Redis (Caching)
├── Event Store (Audit)
└── Separate DB per Service (Eventual)

Communication Layer:
├── REST APIs (Sync)
├── WebSockets (Real-time)
├── Event Bus (Async)
└── Message Queues
```

---

## 3️. ESTRUCTURA MODULAR

### 📁 **Nueva Estructura del Proyecto:**

```
saaspandoras/
├── apps/
│   ├── dashboard/          # 🎨 Frontend Dashboard (Consumer)
│   │   ├── src/
│   │   │   ├── services/   # 🔗 API Service Clients
│   │   │   │   ├── auth.ts
│   │   │   │   ├── projects.ts
│   │   │   │   ├── gamification.ts
│   │   │   │   └── api-client.ts
│   │   │   └── contexts/   # 🎭 React Contexts (Local)
│   │   │       ├── AuthContext.tsx
│   │   │       └── ProjectContext.tsx
│   │   └── package.json
│   ├── services/           # 🚀 Backend Services (Providers)
│   │   ├── auth-service/   # 🔐 Servicio de Autenticación
│   │   ├── projects-service/ # 💼 Servicio de Proyectos
│   │   ├── gamification-service/ # 🎮 Servicio de Gamificación
│   │   ├── database-service/ # 🗄️ Servicio de Base de Datos
│   │   └── blockchain-service/ # ⛓️ Servicio de Blockchain
│   └── landing/            # 📄 Landing Page
├── packages/               # 📚 Shared Libraries
│   ├── ui/                 # 🎨 Shared UI Components
│   ├── config/             # ⚙️ Shared Configuration
│   ├── types/              # 🏷️ Shared TypeScript Types
│   ├── db/                 # 🗄️ Database Drivers & Schemas
│   └── events/             # 📢 Event Definitions
├── tools/                  # 🛠️ Developer Tools
│   ├── docker-compose.yml  # 🐳 Local Development Stack
│   ├── scripts/           # 🚀 Deployment Scripts
│   └── monitoring/        # 📊 Health Checks
└── docs/                   # 📚 Documentation
    ├── api/               # 📖 API Documentation
    ├── architecture/      # 🏗️ Architecture Decisions
    └── development/       # 👨‍💻 Development Guides
```

### 🎯 **Reglas de Comunicación:**

```
Service A ──📡───► Service B (API Call)
Service A ──📢───► Event Bus ──🎧───► Service B (Events)
Service A ───🔗───► Shared Package (Types, Utils)
```

**NO DIRECTO:**
```
Service A ───❌───► Internal Code of Service B
```

---

## 4️. FASES DE IMPLEMENTACIÓN

### 🎯 **Fase 1: Base Infraestructura (1-2 semanas)**

**Prioridad:** ALTA - Requerido para todo lo demás

1. **Crear Event Bus**
   ```bash
   npm install @pandoras/event-bus shared-types
   ```

2. **Setup Communication Layer**
   ```typescript
   // packages/events/index.ts
   export const AUTH_EVENTS = {
     USER_LOGIN: 'auth.user.login',
     USER_LOGOUT: 'auth.user.logout'
   };

   export const PROJECT_EVENTS = {
     PROJECT_CREATED: 'project.created',
     PROJECT_APPROVED: 'project.approved'
   };
   ```

3. **Configurar Servicios Independientes**
   ```bash
   # Crear services/ directory
   mkdir apps/services
   cd apps/services
   mkdir auth-service projects-service gamification-service
   ```

4. **Health Checks y Monitoreo**
   ```typescript
   // Cada servicio expone /health endpoint
   GET /health → { status: 'ok', uptime: 1234 }
   ```

### 🎯 **Fase 2: Servicio de Autenticación (1 semana)**

**Prioridad:** ALTA - Base de todo

1. **Crear Servicio Independiente**
   ```
   apps/services/auth-service/
   ├── src/
   │   ├── auth.controller.ts
   │   ├── auth.service.ts
   │   ├── user.model.ts
   │   ├── jwt.strategy.ts
   │   └── index.ts
   ├── test/
   ├── package.json
   └── Dockerfile
   ```

2. **API Independiente**
   ```typescript
   // POST /auth/login
   // POST /auth/register
   // GET /auth/me
   // POST /auth/refresh
   ```

3. **Event Publishing**
   ```typescript
   @Post('/login')
   async login(@Body() credentials) {
     const user = await this.authService.login(credentials);
     this.eventBus.publish(AUTH_EVENTS.USER_LOGIN, { userId: user.id });
     return user;
   }
   ```

4. **Dashboard Integration**
   ```typescript
   // apps/dashboard/src/services/auth.ts
   export class AuthApi {
     static async login(credentials: LoginDto) {
       return apiClient.post('/auth/login', credentials);
     }

     static async getProfile() {
       return apiClient.get('/auth/me');
     }
   }
   ```

### 🎯 **Fase 3: Servicio de Proyectos (1 semana)**

**Prioridad:** ALTA - Core business logic

1. **Servicio Independiente**
   ```
   apps/services/projects-service/
   ├── src/
   │   ├── projects.controller.ts
   │   ├── projects.service.ts
   │   ├── project.model.ts
   │   └── index.ts
   ├── events/              # 📢 Project Events
   ├── migrations/          # 🗄️ DB Migrations
   └── package.json
   ```

2. **API Endpoints**
   ```typescript
   // GET /projects → List all projects
   // POST /projects → Create project
   // GET /projects/:id → Get specific project
   // PUT /projects/:id → Update project
   ```

3. **Event Integration**
   ```typescript
   @Post()
   async createProject(@Body() data: CreateProjectDto) {
     const project = await this.projectsService.create(data);
     this.eventBus.publish(PROJECT_EVENTS.PROJECT_CREATED, {
       projectId: project.id,
       userId: project.userId
     });
     return project;
   }
   ```

### 🎯 **Fase 4: Servicio de Base de Datos (1 semana)**

**Prioridad:** ALTA - Necesario para todos

1. **Servicio de DB Genérico**
   ```typescript
   // packages/db/index.ts
   export class DatabaseService {
     private pool: Pool;

     async query(table: string, operation: DBOperation) {
       // Generic query execution
     }

     async migrate() {
       // Schema migrations
     }
   }
   ```

2. **Schema por Servicio**
   ```sql
   -- auth-service/schema.sql
   CREATE TABLE users (...);

   -- projects-service/schema.sql
   CREATE TABLE projects (...);
   ```

3. **Connection Management**
   ```typescript
   // Each service manages its own DB connection
   const dbService = new DatabaseService({
     uri: process.env.AUTH_DB_URI,
     schema: 'auth'
   });
   ```

### 🎯 **Fase 5: Servicio de Gamificación (2 semanas)**

**Prioridad:** MEDIA - Enhanced feature

1. **Servicio Independiente**
   ```
   apps/services/gamification-service/
   ├── achievements/
   ├── points/
   ├── rewards/
   └── events/
   ```

2. **Integration con Otros Servicios**
   ```typescript
   // Escucha eventos de projects-service
   @EventListener(PROJECT_EVENTS.PROJECT_APPROVED)
   async onProjectApproved(event: ProjectEventData) {
     await this.pointsService.awardPoints(event.userId, 100, 'project_approved');
   }
   ```

### 🎯 **Fase 6: Dashboard como Consumer Final (1 semana)**

**Prioridad:** MEDIA - Todo depende de servicios

1. **API Clients**
   ```typescript
   // apps/dashboard/src/services/api-client.ts
   export const apiClient = axios.create({
     baseURL: process.env.API_GATEWAY_URL
   });

   export const authApi = {
     login: (data) => apiClient.post('/auth/login', data),
     getProfile: () => apiClient.get('/auth/me')
   };
   ```

2. **React Integration**
   ```typescript
   // apps/dashboard/src/hooks/useAuth.ts
   export function useAuth() {
     const login = async (credentials) => {
       const response = await authApi.login(credentials);
       // Handle JWT, redirect, etc.
     };
     return { login };
   }
   ```

---

## 5️. SERVICIOS INDEPENDIENTES - AUTENTICACIÓN

### 🏗️ **Estructura del Servicio:** (BASADO EN ANÁLISIS DEL DASHBOARD ACTUAL)

**Análisis del Dashboard Actual:**
- ✅ Autenticación: Thirdweb wallets con social login (Google, Email)
- ✅ Hooks: `useThirdwebUserSync`, `useProfile`, custom user management
- ✅ APIs: `/api/auth/session`, `/api/user-sync/connect`
- ✅ DB: Drizzle ORM con PostgreSQL
- ✅ Estado: SWR para caching optimizado

**Principales Responsabilidades a Independizar:**
1. **User Management:** Create, read, update, delete users
2. **Authentication:** Wallet connection, JWT tokens, session management
3. **Profile Management:** KYC data, user preferences, extended info

```
apps/services/auth-service/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts      # 🚪 Login/Register endpoints (basado en useThirdwebUserSync)
│   │   └── oauth.controller.ts     # 🔐 Social login endpoints
│   ├── services/
│   │   ├── auth.service.ts         # 🔑 Core auth logic
│   │   ├── jwt.service.ts          # 🧾 JWT token management
│   │   └── user.service.ts         # 👤 User CRUD operations
│   ├── models/
│   │   ├── user.model.ts           # 👤 User entity
│   │   ├── session.model.ts        # 🔒 Session management
│   │   └── oauth.model.ts          # 🔐 OAuth providers
│   ├── guards/
│   │   ├── jwt.guard.ts            # 🛡️ Route protection
│   │   └── roles.guard.ts          # 👑 Role-based access
│   ├── strategies/
│   │   ├── jwt.strategy.ts         # 🧾 JWT verification
│   │   ├── google.strategy.ts      # 🔵 Google OAuth
│   │   └── twitter.strategy.ts     # 🐦 Twitter OAuth
│   ├── events/
│   │   └── auth.events.ts          # 📢 Auth event definitions
│   └── index.ts
├── test/
│   ├── unit/
│   └── integration/
├── docker/
│   └── Dockerfile
├── migrations/
│   └── 001_create_users_table.sql
└── package.json
```

### 📡 **API Contract (OpenAPI Spec):**

```yaml
openapi: 3.0.0
info:
  title: Pandora's Auth API
  version: v1.0.0
  description: Authentication and User Management Service

servers:
  - url: https://api.pandoras.finance/auth
    description: Production server

paths:
  /login:
    post:
      summary: User login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email: { type: string, format: email }
                password: { type: string }
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'

  /register:
    post:
      summary: User registration
      # ... similar structure

  /me:
    get:
      summary: Get current user profile
      security:
        - bearerAuth: []
      # ... profile response

  /refresh:
    post:
      summary: Refresh access token
      # ... token refresh

components:
  schemas:
    LoginResponse:
      type: object
      properties:
        user: { $ref: '#/components/schemas/User' }
        accessToken: { type: string }
        refreshToken: { type: string }
        expiresIn: { type: number }

    User:
      type: object
      properties:
        id: { type: string }
        email: { type: string }
        name: { type: string }
        walletAddress: { type: string }
        role: { type: string, enum: [user, admin, applicant] }
```

### 🔄 **Event Publishing:**

```typescript
// src/services/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private eventBus: EventBusService
  ) {}

  async login(credentials: LoginDto): Promise<User> {
    const user = await this.userService.validateUser(credentials);

    // 📢 Publish login event
    await this.eventBus.publish(AUTH_EVENTS.USER_LOGIN, {
      userId: user.id,
      timestamp: new Date(),
      source: 'email'
    });

    return user;
  }
}
```

### 🧪 **Testing Strategy:**

```typescript
// test/integration/auth.integration.test.ts
describe('Auth Service Integration', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();
  });

  it('should login user and publish event', async () => {
    // Arrange
    const loginDto = { email: 'test@pandoras.finance', password: 'test123' };

    // Act
    const result = await authService.login(loginDto);

    // Assert
    expect(result).toBeDefined();
    expect(eventBus.publish).toHaveBeenCalledWith(
      AUTH_EVENTS.USER_LOGIN,
      expect.objectContaining({ userId: result.id })
    );
  });
});
```

---

## 6️. SERVICIOS INDEPENDIENTES - PROYECTOS

### 🏗️ **Estructura del Servicio:**

```
apps/services/projects-service/
├── src/
│   ├── controllers/
│   │   ├── projects.controller.ts   # 📋 Project CRUD
│   │   ├── applications.controller.ts # 📤 Application management
│   │   └── reviews.controller.ts    # ✅ Review system
│   ├── services/
│   │   ├── projects.service.ts      # 🏗️ Core business logic
│   │   ├── validation.service.ts    # ✅ Project validation
│   │   └── approval.service.ts      # 🎯 Approval workflow
│   ├── models/
│   │   ├── project.model.ts         # 📄 Project entity
│   │   ├── application.model.ts     # 📤 Application entity
│   │   └── review.model.ts          # ✅ Review entity
│   ├── events/
│   │   └── project.events.ts        # 📢 Project event definitions
│   ├── workflows/
│   │   └── approval.workflow.ts     # 🔄 Approval state machine
│   └── index.ts
├── test/
├── docker/
├── migrations/
└── package.json
```

### 📊 **Domain Model:**

```typescript
// src/models/project.model.ts
export class Project {
  id: string;
  title: string;
  description: string;
  applicantId: string;  // 👤 Foreign Key to Auth Service
  status: ProjectStatus;
  businessCategory: BusinessCategory;
  targetAmount: number;
  raisedAmount: number;
  createdAt: Date;
  updatedAt: Date;

  // Relationships resolved via API calls
  applicant?: User;    // From Auth Service
  applications?: Application[];
  reviews?: Review[];
}

// State Machine for Projects
export const PROJECT_STATUSES = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  LIVE: 'live',
  COMPLETED: 'completed',
  REJECTED: 'rejected'
} as const;
```

### 🔄 **Event-Driven Architecture:**

```typescript
// src/events/project.events.ts
export const PROJECT_EVENTS = {
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_SUBMITTED: 'project.submitted',
  PROJECT_APPROVED: 'project.approved',
  PROJECT_REJECTED: 'project.rejected',
  PROJECT_FUNDED: 'project.funded',
  PROJECT_COMPLETED: 'project.completed',

  APPLICATION_RECEIVED: 'project.application.received',
  APPLICATION_APPROVED: 'project.application.approved',

  REVIEW_ADDED: 'project.review.added',
  REVIEW_UPDATED: 'project.review.updated'
} as const;

// src/services/projects.service.ts
@Injectable()
export class ProjectsService {
  constructor(
    private projectRepo: ProjectRepository,
    private eventBus: EventBusService
  ) {}

  async createProject(data: CreateProjectDto): Promise<Project> {
    const project = await this.projectRepo.create(data);

    // 📢 Publish domain event
    await this.eventBus.publish(PROJECT_EVENTS.PROJECT_CREATED, {
      projectId: project.id,
      applicantId: project.applicantId,
      data: {
        title: project.title,
        category: project.businessCategory
      }
    });

    return project;
  }
}
```

### 🏗️ **Approval Workflow:**

```typescript
// src/workflows/approval.workflow.ts
export class ApprovalWorkflow {
  @WorkflowHandler(PROJECT_EVENTS.PROJECT_SUBMITTED)
  async handleSubmission(event: ProjectEvent) {
    // 1. Initial validation
    await this.validationService.validateProject(event.projectId);

    // 2. KYC Check via Auth Service
    const applicantKyc = await this.authApiClient.getKycStatus(event.applicantId);

    // 3. Business Logic Check
    if (!this.businessRulesValidator.isEligible(event.data)) {
      await this.rejectProject(event.projectId, 'Business rules violation');
      return;
    }

    // 4. Auto-approval or Admin review
    if (this.shouldAutoApprove(event.data)) {
      await this.autoApproveProject(event.projectId);
    } else {
      await this.sendToAdminReview(event.projectId);
    }
  }
}
```

---

## 7️. SERVICIOS INDEPENDIENTES - BASE DE DATOS

### 🏗️ **Servicio de DB Genérico:**

```
packages/db/
├── index.ts                    # 🚪 Main exports
├── src/
│   ├── connection.ts           # 🔌 DB Connection management
│   ├── migration.ts            # 🗄️ Migration system
│   ├── query-builder.ts        # 🔍 SQL Query builder
│   ├── transaction.ts          # 🔄 Transaction management
│   └── pool-manager.ts         # 🏊 Connection pooling
├── drivers/
│   ├── postgres.driver.ts      # 🐘 PostgreSQL driver
│   ├── redis.driver.ts         # 🔴 Redis driver
│   └── mongodb.driver.ts       # 🍃 MongoDB driver
├── schemas/
│   ├── shared.schema.ts        # 🔗 Shared entities
│   ├── auth.schema.ts          # 👤 Auth entities
│   ├── projects.schema.ts      # 💼 Project entities
│   └── gamification.schema.ts  # 🎮 Game entities
└── package.json
```

### 🔧 **Uso por Servicios:**

```typescript
// apps/services/auth-service/src/database.ts
import { DatabaseService, PostgresDriver } from '@pandoras/db';

export const databaseService = new DatabaseService({
  driver: new PostgresDriver({
    uri: process.env.AUTH_DB_URI,
    schema: 'auth'
  }),
  migrations: ['./migrations/*'],
  logger: console
});

// Query execution with type safety
const users = await databaseService.query<User>('users')
  .where('email', '=', email)
  .select(['id', 'name', 'email']);
```

### 🏗️ **Schema Migration Strategy:**

```typescript
// packages/db/src/migration.ts
export class MigrationManager {
  async runMigrations(serviceName: string): Promise<void> {
    const migrations = await this.loadMigrations(serviceName);

    for (const migration of migrations) {
      await this.executeMigration(migration);
      await this.recordMigration(migration);
    }
  }

  private async loadMigrations(serviceName: string): Promise<Migration[]> {
    // Load from apps/services/{serviceName}/migrations/
    // or packages/db/schemas/{serviceName}.schema.ts
  }
}
```

### 🎯 **Transactional Commands:**

```typescript
// Atomic operations across services (if needed)
await databaseService.transaction(async (tx) => {
  // User creation in auth service
  const user = await tx.query('users').insert(userData);

  // Project update in projects service
  await tx.query('projects').where('userId', user.id).update({
    status: 'active'
  });

  // Event publication
  await eventBus.publish('user.project.created', {
    userId: user.id,
    projectId: project.id
  });
});
```

---

## 8️. SERVICIOS INDEPENDIENTES - GAMIFICACIÓN

### 🏗️ **Arquitectura Basada en Eventos:**

```
apps/services/gamification-service/
├── src/
│   ├── core/
│   │   ├── points-engine.ts       # 🎯 Core points calculation
│   │   ├── achievement-engine.ts  # 🏆 Achievement unlocking
│   │   ├── reward-engine.ts       # 🎁 Reward distribution
│   │   └── leaderboard-engine.ts  # 🥇 Rankings calculation
│   ├── listeners/
│   │   ├── auth.listener.ts       # 👂 Auth service events
│   │   ├── project.listener.ts    # 👂 Project service events
│   │   └── blockchain.listener.ts # 👂 Blockchain events
│   ├── api/
│   │   ├── achievements.api.ts    # 🏆 Achievement endpoints
│   │   ├── points.api.ts          # 🎯 Points endpoints
│   │   ├── rewards.api.ts         # 🎁 Rewards endpoints
│   │   └── leaderboard.api.ts     # 🥇 Leaderboard endpoints
│   ├── models/
│   │   ├── user-profile.model.ts  # 👤 User gamification profile
│   │   ├── achievement.model.ts   # 🏆 Achievement definitions
│   │   ├── user-points.model.ts   # 🎯 User points history
│   │   └── user-rewards.model.ts  # 🎁 User reward claims
│   ├── events/
│   │   └── gamification.events.ts # 📢 Event definitions
│   └── index.ts
├── events/
├── migrations/
└── package.json
```

### 🎯 **Event Listeners Pattern:**

```typescript
// src/listeners/project.listener.ts
import { EventBusSubscriber } from '@pandoras/event-bus';
import { PROJECT_EVENTS } from '@pandoras/events';

@EventSubscriber()
export class ProjectEventListener {
  constructor(
    private pointsEngine: PointsEngine,
    private achievementEngine: AchievementEngine
  ) {}

  @On(PROJECT_EVENTS.PROJECT_CREATED)
  async onProjectCreated(event: ProjectCreatedEvent) {
    await this.pointsEngine.awardPoints({
      userId: event.applicantId,
      points: 50,
      reason: 'Project creation',
      category: 'PROJECT_APPLICATION'
    });

    // Check for achievements
    await this.achievementEngine.checkUnlockConditions(
      event.applicantId,
      'first_project'
    );
  }

  @On(PROJECT_EVENTS.PROJECT_APPROVED)
  async onProjectApproved(event: ProjectApprovedEvent) {
    // Award bonus points
    await this.pointsEngine.awardPoints({
      userId: event.applicantId,
      points: 100,
      reason: 'Project approval bonus',
      category: 'PROJECT_APPROVAL'
    });
  }
}
```

### 🎁 **Reward Distribution System:**

```typescript
// src/core/reward-engine.ts
export class RewardEngine {
  async distributeReward(userId: string, rewardId: string): Promise<void> {
    const reward = await this.rewardRepo.findById(rewardId);
    const userProfile = await this.userProfileRepo.findByUserId(userId);

    // Check eligibility
    if (!this.isEligible(userProfile, reward)) {
      throw new Error('User not eligible for reward');
    }

    // Apply reward
    await this.applyReward(userId, reward);

    // Mark as claimed
    await this.userRewardRepo.create({
      userId,
      rewardId,
      claimedAt: new Date()
    });

    // Publish event
    await this.eventBus.publish(GAMIFICATION_EVENTS.REWARD_CLAIMED, {
      userId,
      rewardId,
      rewardType: reward.type
    });
  }

  private async applyReward(userId: string, reward: Reward): Promise<void> {
    switch (reward.type) {
      case 'DISCOUNT':
        await this.discountService.applyDiscount(userId, reward.value);
        break;
      case 'POINTS_BONUS':
        await this.pointsEngine.awardPoints(userId, reward.value, 'reward_bonus');
        break;
      case 'FEATURE_UNLOCK':
        await this.featureUnlockService.unlock(userId, reward.featureId);
        break;
    }
  }
}
```

---

## 9️. SISTEMA DE EVENTOS - COMMUNICATION BUS

### 📢 **Event Bus Architecture:**

```typescript
// packages/event-bus/index.ts
export interface Event {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: Date;
  source: string;
  version: string;
}

export interface EventBus {
  publish(event: Event): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): Subscription;
  unsubscribe(subscription: Subscription): void;
}

// Redis-based implementation
export class RedisEventBus implements EventBus {
  constructor(private redis: Redis) {}

  async publish(event: Event): Promise<void> {
    await this.redis.publish(event.type, JSON.stringify(event));
  }

  subscribe(eventType: string, handler: EventHandler): Subscription {
    // Redis subscription logic
  }
}
```

### 🎧 **Message Patterns:**

```typescript
// Point-to-Point (Request-Reply)
const response = await eventBus.request(AUTH_EVENTS.GET_USER_PROFILE, {
  userId: '123'
});

// Publish-Subscribe (Fire-and-Forget)
await eventBus.publish(PROJECT_EVENTS.PROJECT_CREATED, {
  projectId: '456',
  applicantId: '123',
  title: 'Nuevo proyecto'
});

// Event Streaming (Real-time updates)
eventBus.subscribe(PROJECT_EVENTS.PROJECT_STATUS_CHANGED, (event) => {
  // Update UI in real-time
  updateProjectStatus(event.projectId, event.newStatus);
});
```

### 🔧 **Event Versioning:**

```typescript
// Version control for backward compatibility
export const EVENT_VERSIONS = {
  USER_LOGIN: 'v1.0',
  PROJECT_CREATED: 'v2.1', // Added new fields
  ACHIEVEMENT_UNLOCKED: 'v1.2' // Added metadata
};

// Upcasting strategy for event evolution
export function upcastEvent(event: Event): Event {
  switch (event.type) {
    case PROJECT_EVENTS.PROJECT_CREATED:
      return event.version === 'v1.0'
        ? migrateV1ToV2(event) // Add missing fields
        : event;
  }
}
```

---

## 0️. APIs Y ENDPOINTS MODULARES

### 🌐 **API Gateway Structure:**

```typescript
// apps/dashboard/src/pages/api/v1/[...slug].ts
import { createAPIHandler } from '@pandoras/api-gateway';

export const API_ROUTES = {
  // Auth Service Routes
  '/auth/login': 'auth-service:3001',
  '/auth/register': 'auth-service:3001',
  '/auth/me': 'auth-service:3001',
  '/auth/refresh': 'auth-service:3001',

  // Projects Service Routes
  '/projects': 'projects-service:3002',
  '/projects/:id': 'projects-service:3002',
  '/projects/:id/applications': 'projects-service:3002',

  // Gamification Service Routes
  '/gamification/me': 'gamification-service:3003',
  '/gamification/achievements': 'gamification-service:3003',
  '/gamification/leaderboard': 'gamification-service:3003',

  // Database Service Routes (Admin only)
  '/admin/db/migrate': 'database-service:3004'
};

export default createAPIHandler(API_ROUTES, {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  authentication: true,
  logging: true
});
```

### 🔐 **Security & Middleware:**

```typescript
// packages/api-gateway/src/middleware/auth.middleware.ts
export function authenticateRequest(req: NextRequest): boolean {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) return false;

  try {
    // Validate JWT against Auth Service
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return true;
  } catch (error) {
    return false;
  }
}

// Rate limiting with Redis
export async function checkRateLimit(identifier: string): Promise<boolean> {
  const redis = new Redis(process.env.REDIS_URL);
  const key = `ratelimit:${identifier}`;

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, 900); // 15 minutes
  }

  return current <= 100; // Max 100 requests per 15 minutes
}
```

---

## 1️. TESTING - UNITARIO Y INTEGRACIÓN

### 🧪 **Strategy de Testing:**

```typescript
// apps/services/auth-service/test/auth.integration.test.ts
describe('Auth Service Integration', () => {
  let app: INestApplication;
  let eventBusMock: jest.Mocked<EventBusService>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AuthModule],
    })
    .overrideProvider(EventBusService)
    .useValue({
      publish: jest.fn(),
    })
    .compile();

    app = moduleFixture.createNestApplication();
    eventBusMock = moduleFixture.get(EventBusService);
    await app.init();
  });

  it('should login user and publish event', async () => {
    // Arrange
    const loginDto = {
      email: 'user@pandoras.finance',
      password: 'password123'
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/login')
      .send(loginDto)
      .expect(200);

    // Assert
    expect(response.body).toHaveProperty('accessToken');
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      AUTH_EVENTS.USER_LOGIN,
      expect.any(Object)
    );
  });
});
```

### 🔄 **Contract Testing entre Servicios:**

```typescript
// test/contracts/auth-to-projects.contract.test.ts
describe('Auth <-> Projects Contract', () => {
  it('should handle user creation and project association', async () => {
    // 1. Create user in Auth Service
    const user = await authApi.createUser({
      email: 'test@pandoras.finance',
      walletAddress: '0x123...'
    });

    // 2. Verify user exists in Auth DB
    const authUser = await authDatabase.query('users', { id: user.id });
    expect(authUser).toBeDefined();

    // 3. Check that Projects Service can see the user
    const projectsUser = await projectsApi.getUser(user.id);
    expect(projectsUser.id).toBe(user.id);

    // 4. Create project for user
    const project = await projectsApi.createProject({
      title: 'Test Project',
      applicantId: user.id
    });

    // 5. Verify foreign key integrity
    expect(project.applicantId).toBe(user.id);
  });
});
```

### 🚀 **CI/CD Pipeline:**

```yaml
# .github/workflows/test-services.yml
name: Test Services
on: [push, pull_request]

jobs:
  test-auth-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup services
        run: docker-compose up -d postgres redis
      - name: Run auth service tests
        run: |
          cd apps/services/auth-service
          npm test

  test-projects-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup services
        run: docker-compose up -d postgres redis auth-service
      - name: Run projects service tests
        run: |
          cd apps/services/projects-service
          npm test
```

---

## 2️. DEPLOYMENT y MONITOREO

### 🚀 **Estrategia de Deployment:**

```bash
# Monorepo deployment strategy
turbo run build --filter='./apps/dashboard/**'
turbo run deploy --filter='./apps/services/**' --concurrency=3
```

### 🐳 **Docker Compose para Desarrollo:**

```yaml
# docker-compose.yml (root)
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: pandoras_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # Services run independently
  auth-service:
    build: ./apps/services/auth-service
    ports:
      - "3001:3000"
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/auth_db

  projects-service:
    build: ./apps/services/projects-service
    ports:
      - "3002:3000"
    depends_on:
      - postgres
      - auth-service
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/projects_db

  gamification-service:
    build: ./apps/services/gamification-service
    ports:
      - "3003:3000"
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/gamification_db

volumes:
  postgres_data:
```

### 📊 **Health Monitoring:**

```typescript
// apps/dashboard/src/pages/api/health.ts
export default async function handler(req: NextRequest) {
  // Check all service health
  const healthChecks = await Promise.allSettled([
    fetchServiceHealth('auth-service', '3001'),
    fetchServiceHealth('projects-service', '3002'),
    fetchServiceHealth('gamification-service', '3003'),
    fetchServiceHealth('database-service', '3004'),
  ]);

  const healthStatus = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: healthChecks.map((result, index) => ({
      service: ['auth', 'projects', 'gamification', 'database'][index],
      status: result.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      responseTime: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }))
  };

  const isOverallHealthy = healthChecks.every(
    check => check.status === 'fulfilled'
  );

  return NextResponse.json(healthStatus, {
    status: isOverallHealthy ? 200 : 503
  });
}
```

### 🔧 **Zero-Downtime Deployments:**

```bash
# Blue-green deployment strategy
kubectl set image deployment/auth-service auth-service=new-version
kubectl rollout status deployment/auth-service

# Traffic shifting
kubectl set image deployment/auth-service-router auth-service=new-version
```

---

## 3️. DESARROLLO DISTRIBUIDO

### 👥 **Organización por Equipos:**

```
Equipo Auth (2 desarrolladores)
├── Junior Dev: User registration, JWT tokens
├── Senior Dev: OAuth integrations, Security

Equipo Projects (3 desarrolladores)
├── Frontend Dev: Project creation forms, Dashboard
├── Backend Dev: API endpoints, Business logic
├── QA: Testing, Integration testing

Equipo Gamification (2 desarrolladores)
├── Game Designer: Achievement rules, Rewards
├── Backend Dev: Event processing, Leaderboards
```

### 📋 **Workflow Git Branching:**

```
main                    # Prod always deployable
├── staging            # Integration branch
│   ├── feature/auth-oauth    # Auth team working
│   ├── feature/project-forms # Projects team working
│   └── feature/achievements  # Gamification team working
└── hotfix/auth-security-fix  # Emergency fixes
```

### 📅 **Sprint Planning:**

```markdown
## Sprint 3: Modularización Fase 2

### Equipo Auth
- **Goal:** Completar OAuth social login
- **Stories:**
  - Implement Google OAuth
  - Add Twitter OAuth
  - JWT refresh token rotation
- **Demo:** OAuth funcionando en staging

### Equipo Projects
- **Goal:** Sistema de aplicación completo
- **Stories:**
  - Rich text editor para descripciones
  - Image upload con Cloudinary
  - Notification system
- **Demo:** Flujo completo de aplicación

### Equipo Gamification
- **Goal:** Achievements dinámicos
- **Stories:**
  - Achievement templates
  - Progress tracking
  - Reward claiming system
- **Demo:** Unlock achievements en tiempo real
```

### 🔄 **Daily Standups:**

```
Auth Team:
- "Terminé Google OAuth, esperando review"
- "JWT rotation pendiente, database_service no responde"

Projects Team:
- "Image upload funciona, pero tamaño limitado"
- "Notification system bloqueado por auth event"

Gamification Team:
- "Achievement templates listos, testing pendiente"
- "Event listener para projects events funciona"
```

---

## 4️. MÉTRICAS y KPI

### 📊 **Métricas de Arquitectura:**

```typescript
// Service Health Metrics
const serviceMetrics = {
  authService: {
    responseTime: '45ms',
    errorRate: '0.01%',
    throughput: '1000 rpm'
  },
  projectsService: {
    responseTime: '120ms',
    errorRate: '0.5%',
    throughput: '300 rpm'
  },
  gamificationService: {
    responseTime: '30ms',
    errorRate: '0.0%',
    throughput: '2000 rpm'
  }
};

// Event Bus Performance
const eventMetrics = {
  publishedEventsPerMinute: 450,
  consumedEventsPerMinute: 445,
  failedEvents: 5,
  avgProcessingTime: '25ms'
};
```

### 🎯 **KPIs por Servicio:**

```typescript
const kpis = {
  developmentEfficiency: {
    // Más deployments por semana
    deploymentsPerWeek: 14, // vs 7 anteriormente
    // Menos bugs en producción
    productionBugs: 2, // vs 15
    // Tiempo de feature delivery
    featureDeliveryTime: 3.5 // days vs 2 weeks
  },

  systemReliability: {
    // Service uptime
    authServiceUptime: '99.9%',
    projectsServiceUptime: '99.5%',
    gamificationServiceUptime: '99.95%',

    // Inter-service calls success rate
    serviceCommunicationSuccess: '99.7%'
  },

  businessImpact: {
    // User registration rate
    userGrowthRate: '+25% month',
    // Project creation rate
    projectCreationRate: '+40% week',
    // Gamification engagement
    achievementUnlockRate: '+150% week'
  }
};
```

### 📈 **Dashboard de Métricas:**

```typescript
// packages/monitoring/src/dashboard.ts
export class MonitoringDashboard {
  async generateReport(): Promise<ReportData> {
    const systemHealth = await this.getSystemHealth();
    const userMetrics = await this.getUserMetrics();
    const performanceMetrics = await this.getPerformanceMetrics();

    return {
      timestamp: new Date(),
      systemHealth,
      userMetrics,
      performanceMetrics,
      alerts: this.generateAlerts(),
      recommendations: this.generateRecommendations()
    };
  }
}
```

### 🚨 **Alertas y Monitoreo:**

```yaml
# alerting/alerts.yml
alerts:
  - name: service-down
    condition: up == 0
    labels:
      severity: critical
    annotations:
      summary: "Service {{ $labels.service }} is down"

  - name: high-error-rate
    condition: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
    labels:
      severity: warning
    annotations:
      summary: "High error rate on {{ $labels.service }}"

  - name: slow-response
    condition: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
    labels:
      severity: warning
    annotations:
      summary: "Slow response time on {{ $labels.service }}"
```

---

## 🎉 **CONCLUSIÓN**

Esta guía proporciona una **hoja de ruta completa** para transformar tu aplicacion monolítica en una **arquitectura modular escalable**.

### 🚀 **Próximos Pasos In
