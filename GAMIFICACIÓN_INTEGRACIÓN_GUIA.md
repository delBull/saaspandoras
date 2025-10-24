# 🚀 Guía Completa de Integración Gamificación Pandora's

**Fecha:** Octubre 2025
**Versión:** 1.0
**Estado:** Dashboard DB Ready | Sistema Gamificación Completo | API Modificada | Esperando Integración Final

---

## 📋 ÍNDICE

1. [🏗️ ESTRUCTURA ACTUAL DEL SISTEMA](#1️-estructura-actual-del-sistema)
2. [🎮 COMPONENTES DE GAMIFICACIÓN DISPONIBLES](#2️-componentes-de-gamificación-disponibles)
3. [🔧 INTEGRACIÓN PASO A PASO](#3️-integración-paso-a-paso)
4. [📡 ENDPOINTS NECESARIOS](#4️-endpoints-necesarios)
5. [🎨 COMPONENTES UI A INTEGRAR](#5️-componentes-ui-a-integrar)
6. [🔗 EVENTOS Y TRIGGERS](#6️-eventos-y-triggers)
7. [🎯 BASE DE DATOS FASE 1](#7️-base-de-datos-fase-1)
8. [📊 RENDIMIENTO Y MÉTRICAS](#8️-rendimiento-y-métricas)
9. [🚀 PLAN DE EJECUCIÓN](#9️-plan-de-ejecución)
10. [🔍 TESTING & MONITOREO](#0️-testing--monitoreo)

---

## 1️. ESTRUCTURA ACTUAL DEL SISTEMA

### 📦 Paquete Gamificación (`packages/gamification/`)

```
packages/gamification/src/
├── types/                     # Interfaces TypeScript
│   ├── index.ts              # Exportación de todos los tipos
│   ├── gamification.ts       # Tipos principales (UserGamificationProfile, Achievement)
│   ├── events.ts            # Eventos del sistema
│   └── rewards.ts           # Recompensas y unlocks
├── core/                     # Motores del sistema
│   ├── gamification-engine.ts # Motor principal
│   ├── points-manager.ts     # Gestión de puntos
│   ├── achievement-manager.ts # Logros y badges
│   ├── reward-manager.ts     # Recompensas
│   ├── event-system.ts       # Sistema de eventos automatizado
│   └── leaderboard-manager.ts # Rankings
├── components/               # UI Components
│   ├── GamificationHUD.tsx   # HUD flotante principal
│   ├── AchievementCard.tsx   # Tarjetas de logros
│   ├── LevelProgress.tsx     # Barra de progreso de nivel
│   ├── LeaderboardComponent.tsx # Tabla de líderes
│   ├── RewardModal.tsx       # Modal de recompensas
│   ├── GamificationDashboard.tsx # Dashboard completo
│   └── index.ts             # Exportación de componentes
├── hooks/                    # React Hooks personalizados
│   ├── useGamification.ts    # Hook principal
│   ├── useAchievements.ts    # Hook de logros
│   ├── useRewards.ts         # Hook de recompensas
│   └── index.ts             # Exportación
├── api/                      # Endpoints y servicios
│   ├── endpoints.ts          # Definiciones de endpoints
│   ├── client.ts             # Cliente HTTP
│   └── services/             # Servicios específicos
├── utils/                    # Utilidades
│   ├── tokenization-integration.ts # Integración DeFi
│   ├── database-service.ts   # Servicios de DB
│   └── helpers.ts           # Funciones auxiliares
└── index.ts                  # Punto de entrada
```

### 🗄️ Dashboard Actual (`apps/dashboard/`)

```
apps/dashboard/src/
├── app/
│   ├── providers.tsx         # 🚨 AQUÍ VA GamificationProvider
│   ├── layout.tsx            # Layout raíz
│   ├── (dashboard)/
│   │   ├── layout.tsx        # Layout del dashboard
│   │   ├── page.tsx          # Home dashboard
│   │   └── profile/
│   │       ├── page.tsx      # ✅ INTEGRAR GamificationHUD
│   │       ├── dashboard/
│   │       │   └── page.tsx  # ✅ INTEGRAR GamificationDashboard
│   │       └── projects/
│   │           └── page.tsx  # ✅ TRIGGEAR EVENTOS
├── components/               # Componentes del dashboard
├── hooks/                    # Hooks custom (useProfile)
├── lib/                      # Utilidades (auth, thirdweb)
└── types/                    # Tipos del dashboard
```

---

## 2️. COMPONENTES DE GAMIFICACIÓN DISPONIBLES

### 🎮 Componentes Principal

| Componente | Descripción | Props | Uso |
|------------|-------------|-------|-----|
| `GamificationProvider` | Provider raíz del sistema | `userId`, `showHUD`, `hudPosition` | Wrapppear toda la app |
| `GamificationHUD` | HUD flotante con puntos y nivel | `profile`, `position` | Mostrar en todas las páginas |
| `AchievementCard` | Tarjeta individual de logro | `achievement`, `showProgress` | Lista de logros del usuario |
| `LevelProgress` | Barra de progreso de nivel | `profile`, `showDetails` | En headers/dashboards |
| `LeaderboardComponent` | Tabla de clasificación | `entries`, `currentUserId` | Página de rankings |
| `RewardModal` | Modal de recompensa desbloqueada | `reward`, `isOpen`, `onClose` | Popup automático |
| `GamificationDashboard` | Dashboard completo de gamificación | `userId`, `compact` | Página dedicada de gamificación |

### 🔗 Hooks Disponibles

| Hook | Return | Uso |
|------|--------|-----|
| `useGamificationContext` | Nivel, puntos, progreso, logros, recompensas | Acceso a estado global |
| `useAchievements` | Logros del usuario, progreso | Gestión de logros |
| `useRewards` | Recompensas disponibles/canjes | Sistema de unlocks |

### 🎯 Hooks/Hooks Integrados

| Hook | Función | Trigger Evento |
|------|---------|----------------|
| `useThirdwebUserSync` | Sincroniza usuario al conectar wallet | `user_login` |
| `useProfile` | Obtiene datos de perfil del usuario | (solo lectura) |

---

## 3️. INTEGRACIÓN PASO A PASO

### Paso 1: 🔧 Instalar Dependencias

```bash
# Verificar instalación del paquete (ya debería estar)
cd apps/dashboard
npm ls @pandoras/gamification
```

### Paso 2: 🌿 Integrar Provider Principal

**Archivo:** `apps/dashboard/src/app/providers.tsx`

```tsx
"use client";

import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThirdwebProvider, AutoConnect } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { client } from "@/lib/thirdweb-client";
import { useThirdwebUserSync } from "@/hooks/useThirdwebUserSync";
// 🎮 IMPORTAR GAMIFICATION PROVIDER
import { GamificationProvider } from "@pandoras/gamification";

function UserSyncWrapper() {
  useThirdwebUserSync();
  return null;
}

// 🎮 COMPONENTE PARA INTEGRAR GAMIFICACIÓN
function GamificationWrapper({ children }: { children: React.ReactNode }) {
  // Hook para obtener el userId del contexto de autenticación
  const account = useActiveAccount(); // o similar
  const userId = account?.address;

  // Solo mostrar gamificación si hay usuario logueado
  if (!userId) return <>{children}</>;

  return (
    <GamificationProvider
      userId={userId}
      showHUD={true}
      hudPosition="top-right"
    >
      {children}
    </GamificationProvider>
  );
}

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  // Configuración de wallets para AutoConnect
  const wallets = [
    inAppWallet({
      auth: {
        options: [
          "google",
          "email",
          "apple",
          "facebook",
        ],
      },
    }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
  ];

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <ThirdwebProvider>
        <AutoConnect
          client={client}
          wallets={wallets}
          timeout={15000}
          onConnect={(wallet) => {
            if (process.env.NODE_ENV === 'development') {
              console.log("🔗 AutoConnect: Wallet conectada automáticamente", wallet.id);
            }
          }}
          onTimeout={() => {
            if (process.env.NODE_ENV === 'development') {
              console.log("⏰ AutoConnect: Timeout alcanzado");
            }
          }}
        />
        {/* 🎮 INTEGRAR GAMIFICATION WRAPPER */}
        <GamificationWrapper>
          {children}
        </GamificationWrapper>
        <UserSyncWrapper />
        <Toaster
          theme="dark"
          richColors
          position="top-center"
        />
      </ThirdwebProvider>
    </ThemeProvider>
  );
}
```

### Paso 3: 🎨 Agregar HUD a Layout Dashboard

**Archivo:** `apps/dashboard/src/app/(dashboard)/layout.tsx`

```tsx
import { Sidebar } from "@/components/sidebar";
import { NFTGate } from "@/components/nft-gate";
// 🎮 IMPORTAR HUD
import { GamificationHUD } from "@pandoras/gamification";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <main className="flex-1 p-6">
        {/* 🎮 HUD FLOTANTE EN DASHBOARD */}
        <GamificationHUD position="top-right" showLevel={true} showPoints={true} />

        <NFTGate>
          {children}
        </NFTGate>
      </main>
    </div>
  );
}
```

### Paso 4: 📊 Integrar Dashboard de Gamificación

**Archivo:** `apps/dashboard/src/app/(dashboard)/profile/dashboard/page.tsx`

```tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  FolderIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useProfile } from "@/hooks/useProfile";
import { useActiveAccount } from 'thirdweb/react';
// 🎮 IMPORTAR COMPONENTES
import {
  GamificationDashboard,
  AchievementCard,
  LevelProgress,
  useGamificationContext
} from "@pandoras/gamification";

export default function PandoriansDashboardPage() {
  const { profile } = useProfile();
  const account = useActiveAccount();
  const gamification = useGamificationContext();

  const dashboardData = calculateDashboardMetrics();

  return (
    <div className="p-6 space-y-6">
      {/* Header con progreso de nivel */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Dashboard {profile?.role === 'applicant' ? 'de Applicant' : 'Pandorian'}
          </h1>
          {/* 🎮 PROGRESO DE NIVEL EN HEADER */}
          <LevelProgress profile={profile} showDetails={true} />
        </div>
      </div>

      {/* Métricas del dashboard (mantenido) */}
      ...

      {/* 🎮 SECCIÓN DE GAMIFICACIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logros Recientes */}
        <Card>
          <CardHeader>
            <CardTitle>🏆 Logros Recientes</CardTitle>
            <CardDescription>Tus últimos achievements desbloqueados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gamification.recentAchievements?.slice(0, 3).map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  showProgress={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gamificación Dashboard Compacto */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Tu Progreso</CardTitle>
            <CardDescription>Nivel y puntos acumulados</CardDescription>
          </CardHeader>
          <CardContent>
            <GamificationDashboard userId={account?.address} compact={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Paso 5: 🔗 Conectar Eventos de Usuario

**Archivo:** `apps/dashboard/src/hooks/useThirdwebUserSync.ts`

```tsx
import { useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
// 🎮 IMPORTAR EVENT SYSTEM
import { EventType, gamificationEngine } from '@pandoras/gamification';

export function useThirdwebUserSync() {
  const account = useActiveAccount();

  useEffect(() => {
    if (account?.address) {
      const userId = account.address.toLowerCase();

      // 🎮 TRIGGER EVENTO DE LOGIN DIARIO
      gamificationEngine.trackEvent({
        userId,
        eventType: EventType.DAILY_LOGIN,
        metadata: {
          walletAddress: account.address,
          timestamp: new Date().toISOString()
        }
      });
    }
  }, [account?.address]);

  return { account };
}
```

---

## 4️. ENDPOINTS NECESARIOS

### 🔧 Crear Directorio API

```
apps/dashboard/src/app/api/gamification/
├── route.ts                    # GET /api/gamification (leaderboard general)
├── user/[id]/
│   ├── profile/route.ts        # GET /api/gamification/user/:id/profile
│   ├── achievements/route.ts   # GET /api/gamification/user/:id/achievements
│   └── rewards/route.ts        # GET /api/gamification/user/:id/rewards
├── track-event/route.ts        # POST /api/gamification/track-event
└── award-points/route.ts       # POST /api/gamification/award-points
```

### 📡 Endpoint Ejemplo: Track Event

**Archivo:** `apps/dashboard/src/app/api/gamification/track-event/route.ts`

```ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { gamificationEngine, EventType } from '@pandoras/gamification';

export async function POST(request: Request) {
  try {
    const requestHeaders = await headers();
    const headerWallet = requestHeaders.get('x-thirdweb-address') ||
                        requestHeaders.get('x-wallet-address') ||
                        requestHeaders.get('x-user-address');

    if (!headerWallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 401 });
    }

    const body = await request.json();
    const { eventType, metadata } = body;

    const userId = headerWallet.toLowerCase();

    // Validar eventType
    if (!Object.values(EventType).includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Trackear evento
    const result = await gamificationEngine.trackEvent({
      userId,
      eventType,
      metadata: {
        ...metadata,
        walletAddress: headerWallet,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({ success: true, result });

  } catch (error) {
    console.error('Gamification event tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 📊 Endpoint Ejemplo: User Profile

**Archivo:** `apps/dashboard/src/app/api/gamification/user/[id]/profile/route.ts`

```ts
import { NextResponse } from 'next/server';
import { gamificationEngine } from '@pandoras/gamification';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id.toLowerCase();

    const profile = await gamificationEngine.getUserProfile(userId);

    return NextResponse.json({
      ...profile,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gamification profile error:', error);
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
}
```

---

## 5️. COMPONENTES UI A INTEGRAR

### 🎯 Páginas Donde Integrar

| Página | Componente | Ubicación | Propósito |
|--------|------------|-----------|-----------|
| Todas las páginas del dashboard | `GamificationHUD` | Top-right floated | Puntos en tiempo real |
| `/profile` | `AchievementCard` list | Section del perfil | Mostrar logros desbloqueados |
| `/profile/dashboard` | `GamificationDashboard` | Panel dedicado | Progreso completo |
| `/leaderboard` (nuevo) | `LeaderboardComponent` | Página completa | Rankings globales |
| Modal de eventos | `RewardModal` | Popup automático | Recompensas desbloqueadas |

### 🎨 Estilos y Personalización

```tsx
// En providers.tsx o layout, puedes personalizar colores
<GamificationProvider
  userId={userId}
  showHUD={true}
  hudPosition="top-right"
  theme={{
    primary: '#22d3ee', // Cyan-400 (lime-400)
    secondary: '#a855f7', // Purple-400
    background: '#27272a' // Zinc-800
  }}
>
```

---

## 6️. EVENTOS Y TRIGGERS

### 🎪 Eventos Automáticos

| Acción del Usuario | Evento a Trigger | Puntos | Lugar de Implementación |
|--------------------|------------------|--------|-------------------------|
| ✅ Conectar wallet | `DAILY_LOGIN` | 10 | `useThirdwebUserSync.ts` |
| ✅ Aplicar a proyecto | `PROJECT_APPLICATION_SUBMITTED` | 50 | `ProjectApplicationForm.tsx` |
| ✅ Proyecto aprobado | `PROJECT_APPROVAL` | 100 | `admin/projects/[id]/approve` |
| ✅ Realizar inversión | `INVESTMENT` | 25 | `InvestmentFlow.tsx` |
| ✅ Referir amigo | `REFERRAL` | 200 | `ReferralSystem.tsx` |
| ✅ Completar curso | `EDUCATIONAL_CONTENT` | 100 | `CourseCompletion.tsx` |

### 🔄 Ejemplo de Implementación

```tsx
// En componente de aplicación de proyecto
import { gamificationEngine, EventType } from '@pandoras/gamification';

async function submitProjectApplication(projectData: any) {
  // Lógica existente...
  const response = await submitToBackend(projectData);

  if (response.success) {
    // 🎮 TRIGGER EVENTO DE GAMIFICACIÓN
    await gamificationEngine.trackEvent({
      userId: userWalletAddress,
      eventType: EventType.PROJECT_APPLICATION_SUBMITTED,
      metadata: {
        projectId: response.projectId,
        projectTitle: projectData.title,
        category: projectData.businessCategory
      }
    });

    // Mostrar notificación
    toast.success('¡Proyecto enviado! +50 puntos por participación');
  }
}
```

---

## 7️. BASE DE DATOS FASE 1

### 📋 Estado Actual

✅ **DB Local:** Limpia, tabla `users` consistente
✅ **DB Staging:** Sincronizada, tabla `users` presente
✅ **DB Production:** Sincronizada, tabla `users` presente
✅ **Gamificación:** Tablas vacías listas para uso

### 🗂️ Tablas de Gamificación Requeridas

```sql
-- Crear si no existen
CREATE TABLE IF NOT EXISTS gamification_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_level INT DEFAULT 1,
  total_points BIGINT DEFAULT 0,
  level_progress DECIMAL(5,2) DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  rarity VARCHAR(20) CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  points_required BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  progress DECIMAL(5,2) DEFAULT 100.0,
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS gamification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  points_awarded BIGINT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes necesarios
CREATE INDEX IF NOT EXISTS idx_gamification_profiles_user_id ON gamification_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_events_user_id ON gamification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_events_created_at ON gamification_events(created_at);
```

### 🚀 Migration Script

Crear `apps/dashboard/gamification-migration.sql` y ejecutar:

```bash
psql $DATABASE_URL < apps/dashboard/gamification-migration.sql
```

---

## 8️. RENDIMIENTO Y MÉTRICAS

### 📊 KPIs de Gamificación

- **Adopción:** % usuarios con perfil de gamificación activo
- **Engagement:** Eventos por usuario/día
- **Retención:** Usuariosreturning +7 días por gamificación
- **Conversión:** Aplicaciones completadas vs proyectos iniciados
- **Puntuación:** Puntos promedio por usuario

### 🔄 Actualización en Tiempo Real

- **WebSockets:** Para eventos en tiempo real (nivel ups, recompensas)
- **Polling:** Check de progreso cada 30 segundos
- **Push Notifications:** Browser notifications para achievements
- **Caching:** Redis para leaderboards y estadísticas globales

### 📈 A/B Testing

- **Testear rewards:** Descuentos vs puntos extra
- **Progress bars:** Diferentes diseños de progreso
- **Leaderboards:** Ranking temporal vs permanente

---

## 9️. PLAN DE EJECUCIÓN

### 🎯 Fase 1: Setup Básico (2-3 horas)

1. ✅ [**COMPLETADO**] Instalar dependencias
2. ✅ [**COMPLETADO**] Agregar GamificationProvider a `providers.tsx`
3. ✅ [**COMPLETADO**] Agregar GamificationHUD al layout
4. ⏳ Crear endpoint básico `/api/gamification/track-event`
5. ⏳ Conectar evento de login diario

### 🎯 Fase 2: UI Integration (3-4 horas)

6. ⏳ Agregar componentes al perfil (`/profile`)
7. ⏳ Crear página leaderboard (`/leaderboard`)
8. ⏳ Integrar dashboard de gamificación (`/profile/dashboard`)
9. ⏳ Agregar modales de recompensas

### 🎯 Fase 3: Event System (4-5 horas)

10. ⏳ Conectar aplicación de proyectos
11. ⏳ Conectar aprobaciones de proyectos (admin)
12. ⏳ Conectar sistema de referidos
13. ⏳ Conectar completación de cursos
14. ⏳ Testing de todos los eventos

### 🎯 Fase 4: Optimización y Analytics (2-3 horas)

15. ⏳ Crear queries de métricas
16. ⏳ Configurar caching de leaderboards
17. ⏳ Implementar sistema de recompensas canjeables
18. ⏳ Testing de carga y optimización

### 🛠️ Comandos de Testing

```bash
# Probar provider
npm run dev && verificar console logs

# Test endpoints
curl -X POST http://localhost:3000/api/gamification/track-event \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: YOUR_WALLET" \
  -d '{"eventType": "daily_login", "metadata": {"source": "test"}}'

# Verificar DB
psql $DATABASE_URL -c "SELECT * FROM gamification_profiles LIMIT 5;"
```

---

## 0️. TESTING & MONITOREO

### 🚦 Checklist de Testing

- [ ] HUD aparece en todas las páginas del dashboard
- [ ] Puntos se actualizan después de login
- [ ] Logros se desbloquean correctamente
- [ ] Leaderboard carga posiciones
- [ ] Recompensas se muestran en profile
- [ ] Eventos se registran en base de datos
- [ ] No hay errores en consola
- [ ] Performance no se ve afectada

### 📞 Debug Tools

```tsx
// En development, mostrar debug info
const { debugInfo } = useGamificationContext();

<pre className="text-xs">
  {JSON.stringify(debugInfo, null, 2)}
</pre>
```

### 🔍 Monitoreo en Producción

1. **Database Queries:** Monitorear queries lentas
2. **Error Rates:** Alertas en endpoints de gamificación
3. **User Adoption:** Dashboard de métricas de gam
