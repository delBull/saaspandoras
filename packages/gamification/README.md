# 🎮 @pandoras/gamification

Sistema completo de gamificación para la plataforma Pandora's Finance. Diseñado específicamente para plataformas de tokenización con mecánicas de engagement avanzadas.

## 🚀 Características

- **Sistema de Puntos y Niveles** - Progresión automática basada en actividades
- **Logros y Badges** - Sistema de achievements con rarezas
- **Recompensas** - Sistema de unlocks y beneficios
- **Leaderboard** - Tabla de líderes y competencia
- **Eventos y Triggers** - Sistema de eventos automatizado
- **Componentes UI Premium** - Componentes reutilizables con diseño avanzado
- **Integración Tokenización** - Optimizado para plataformas DeFi

## 📦 Instalación

```bash
# El package ya está incluido en el monorepo
# Para usarlo en otros proyectos:
npm install @pandoras/gamification
```

## 🎯 Uso Básico

### 1. Provider Setup

```tsx
import { GamificationProvider } from '@pandoras/gamification';

export function App({ userId }: { userId: string }) {
  return (
    <GamificationProvider
      userId={userId}
      showHUD={true}
      hudPosition="top-right"
    >
      <YourApp />
    </GamificationProvider>
  );
}
```

### 2. Usar el Hook

```tsx
import { useGamificationContext } from '@pandoras/gamification';

function UserProfile() {
  const gamification = useGamificationContext();

  return (
    <div>
      <h2>Nivel {gamification.currentLevel}</h2>
      <p>{gamification.totalPoints} puntos</p>
      <p>{gamification.levelProgress}% al siguiente nivel</p>
    </div>
  );
}
```

### 3. Componentes UI

```tsx
import {
  GamificationHUD,
  AchievementCard,
  LevelProgress,
  Leaderboard,
  RewardModal
} from '@pandoras/gamification';

// HUD flotante
<GamificationHUD profile={profile} position="top-right" />

// Tarjeta de logro
<AchievementCard achievement={achievement} showProgress={true} />

// Progreso de nivel
<LevelProgress profile={profile} showDetails={true} />

// Tabla de líderes
<Leaderboard entries={leaderboard} currentUserId={userId} />

// Modal de recompensa
<RewardModal reward={reward} isOpen={isOpen} onClose={onClose} />
```

## 🎮 Sistema de Puntos

### Puntuación por Actividad

| Actividad | Puntos | Categoría |
|-----------|--------|-----------|
| Aplicar proyecto | 50 | PROJECT_APPLICATION |
| Proyecto aprobado | 100 | PROJECT_APPROVAL |
| Hacer inversión | 25 | INVESTMENT |
| Login diario | 10 | DAILY_LOGIN |
| Referir usuario | 200 | REFERRAL |
| Completar curso | 100 | EDUCATIONAL_CONTENT |

### Sistema de Niveles

- **Nivel 1-2:** Principiante (100-200 puntos)
- **Nivel 3-4:** Constructor (300-500 puntos)
- **Nivel 5-7:** Inversor (600-1000 puntos)
- **Nivel 8-10:** Elite (1100+ puntos)

## 🏆 Sistema de Logros

### Categorías de Logros

- **Proyectos** - Aplicaciones y aprobaciones
- **Inversiones** - Volumen y diversificación
- **Comunidad** - Referidos y contribuciones
- **Aprendizaje** - Cursos y conocimiento
- **Especiales** - Eventos y milestones

### Rareza de Logros

- **Común** - Fáciles de obtener
- **Poco Común** - Requieren esfuerzo moderado
- **Raro** - Logros significativos
- **Épico** - Muy difíciles de obtener
- **Legendario** - Extremadamente raros

## 🎁 Sistema de Recompensas

### Tipos de Recompensas

- **Descuentos** - Reducción en fees
- **Puntos Extra** - Bonus de puntuación
- **Acceso Exclusivo** - Features premium
- **Badges** - Insignias especiales
- **Títulos** - Nombres personalizados
- **Crypto Rewards** - Tokens o NFTs

## 📊 APIs Disponibles

### Eventos y Tracking

```typescript
// Trackear evento
POST /api/gamification/track-event
{
  "userId": "user_123",
  "eventType": "project_application_submitted",
  "metadata": {
    "projectTitle": "Mi Proyecto",
    "category": "tech_startup"
  }
}

// Otorgar puntos
POST /api/gamification/award-points
{
  "userId": "user_123",
  "points": 50,
  "reason": "Aplicación de proyecto",
  "category": "PROJECT_APPLICATION"
}
```

### Consultas

```typescript
// Perfil de usuario
GET /api/gamification/user/{id}/profile

// Logros del usuario
GET /api/gamification/user/{id}/achievements

// Recompensas disponibles
GET /api/gamification/user/{id}/rewards

// Leaderboard
GET /api/gamification/leaderboard/{type}
```

## 🔧 Configuración Avanzada

### Eventos Personalizados

```typescript
import { EventType } from '@pandoras/gamification';

// Crear evento personalizado
const customEvent = {
  id: 'custom_event',
  name: 'Evento Personalizado',
  points: 75,
  category: EventCategory.SPECIAL
};
```

### Triggers Automatizados

```typescript
// Triggers basados en condiciones
const triggers = [
  {
    eventType: EventType.PROJECT_APPLICATION_SUBMITTED,
    conditions: [
      { type: 'project_count', operator: 'greater_than', value: 5 }
    ],
    actions: [
      { type: 'award_points', value: 100 },
      { type: 'unlock_achievement', value: 'project_enthusiast' }
    ]
  }
];
```

## 🎨 Personalización

### Temas y Colores

```typescript
// Personalizar colores por rareza
const rarityColors = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-blue-500 to-blue-600',
  rare: 'from-purple-500 to-purple-600',
  epic: 'from-yellow-500 to-orange-500',
  legendary: 'from-red-500 to-purple-500'
};
```

### Animaciones

```typescript
// Configurar animaciones
const animations = {
  achievementUnlock: {
    duration: 2000,
    easing: 'easeOut',
    scale: 1.1
  }
};
```

## 🚀 Ejemplo de Integración Completa

```tsx
import {
  GamificationProvider,
  GamificationHUD,
  AchievementCard,
  useGamificationContext
} from '@pandoras/gamification';

function TokenizationApp({ userId }: { userId: string }) {
  return (
    <GamificationProvider userId={userId}>
      <div className="min-h-screen">
        <GamificationHUD position="top-right" />

        <main>
          <ProjectApplicationForm />
          <UserAchievements />
          <Leaderboard />
        </main>
      </div>
    </GamificationProvider>
  );
}

function UserAchievements() {
  const { achievements, isLoading } = useGamificationContext();

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {achievements.map(achievement => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
          showProgress={true}
        />
      ))}
    </div>
  );
}
```

## 📈 Métricas y Analytics

### KPIs de Gamificación

- **Tasa de engagement** - Tiempo activo en plataforma
- **Progresión de usuarios** - Velocidad de subida de nivel
- **Retención** - Usuarios que regresan por gamificación
- **Conversión** - Aplicaciones completadas vs iniciadas

### Monitoreo

```typescript
// Tracking automático de eventos
const events = [
  'project_application_started',
  'project_application_completed',
  'investment_made',
  'daily_login',
  'achievement_unlocked'
];
```

## 🔒 Seguridad y Privacidad

- **Datos anonimizados** para leaderboards
- **Encriptación** de información sensible
- **Control de acceso** granular
- **Auditoría completa** de acciones

## 🛠️ Desarrollo

### Scripts Disponibles

```bash
npm run build    # Compilar el package
npm run test     # Ejecutar tests
npm run lint     # Verificar código
npm run dev      # Desarrollo con watch
```

### Estructura del Código

```
src/
├── types/          # Interfaces y tipos
├── core/           # Lógica de negocio
├── components/     # Componentes UI
├── hooks/          # Custom hooks
├── api/           # API endpoints
└── utils/         # Utilidades
```

## 🎯 Próximas Funcionalidades

- [ ] **NFTs dinámicos** para badges
- [ ] **Tournaments** y competiciones
- [ ] **Social features** (amistades, guilds)
- [ ] **Mobile optimization** completa
- [ ] **Real-time updates** con WebSockets

## 📞 Soporte

Para soporte técnico o consultas sobre integración:

- **Documentación:** [GitHub Wiki](https://github.com/saaspandoras/gamification)
- **Issues:** [GitHub Issues](https://github.com/saaspandoras/gamification/issues)
- **Discussions:** [GitHub Discussions](https://github.com/saaspandoras/gamification/discussions)

---

**🎮 Desarrollado por Pandora's Finance Team**
**📧 contacto@pandoras.finance**
**🌐 https://pandoras.finance**