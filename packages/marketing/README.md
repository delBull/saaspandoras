# @pandoras/marketing

**Sistema de marketing independiente y reutilizable para landing pages y email campaigns**

## 🎯 **Características Principales**

- ✅ **Framework Agnóstico**: Funciona con React, Next.js, Vue, etc.
- ✅ **Landing Pages Reutilizables**: Componentes modulares para marketing
- ✅ **Email Marketing**: Integración con Resend
- ✅ **Analytics**: Tracking de eventos y conversiones  
- ✅ **A/B Testing**: Tests de variantes integrados
- ✅ **Forms**: Formularios optimizados para conversión
- ✅ **TypeScript**: Tipos completos incluidos

## 🚀 **Instalación**

```bash
npm install @pandoras/marketing
# o
yarn add @pandoras/marketing
```

## 📦 **Uso Básico**

### Importar Componentes

```tsx
import { 
  HeroSection, 
  EmailCaptureForm,
  FeatureSection 
} from '@pandoras/marketing/components'
```

### Ejemplo: Landing Page Básica

```tsx
import { HeroSection, EmailCaptureForm } from '@pandoras/marketing/components'

export default function MyLandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection
        title="Construye Protocolos de Lealtad"
        subtitle="Activa tu comunidad con incentivos reales"
        cta={{
          text: "Empezar Gratis",
          href: "#signup",
          style: "primary"
        }}
        background={{ type: "gradient", value: "from-blue-500 to-purple-500" }}
      />
      
      <EmailCaptureForm
        title="Mantente al Día"
        description="Recibe actualizaciones sobre nuevas funciones"
        buttonText="Suscribirse"
        onSubmit={(data) => {
          console.log('Nuevo suscriptor:', data)
        }}
      />
    </div>
  )
}
```

## 🏗️ **Arquitectura**

```
packages/marketing/
├── src/
│   ├── components/          # Componentes UI
│   ├── email/              # Email templates & Resend
│   ├── forms/              # Formularios optimizados
│   ├── analytics/          # Tracking & eventos
│   ├── templates/          # Plantillas de landing pages
│   ├── types/              # Tipos TypeScript
│   └── utils/              # Helpers
├── examples/               # Ejemplos de uso
└── dist/                   # Build output
```

## 📧 **Email Marketing**

### Configurar Resend

```tsx
import { EmailService } from '@pandoras/marketing/email'

const emailService = new EmailService({
  apiKey: process.env.RESEND_API_KEY!,
  from: 'noreply@tudominio.com'
})

// Enviar welcome email
await emailService.send({
  to: 'user@email.com',
  template: 'welcome',
  data: { name: 'Usuario' }
})
```

### Formularios con Email

```tsx
import { NewsletterForm } from '@pandoras/marketing/components'

<NewsletterForm
  title="Newsletter Mensual"
  description="Las mejores prácticas de Web3"
  listId="newsletter-monthly"
  onSuccess={() => {
    // Redirigir o mostrar mensaje
  }}
/>
```

## 📊 **Analytics & Tracking**

```tsx
import { Analytics } from '@pandoras/marketing/analytics'

const analytics = new Analytics({
  googleAnalyticsId: 'GA_MEASUREMENT_ID',
  customEvents: ['lead_generated', 'email_signup']
})

// Trackear evento
analytics.track('lead_generated', {
  source: 'hero_form',
  value: 1
})
```

## 🧪 **A/B Testing**

```tsx
import { ABTestProvider } from '@pandoras/marketing/ab-testing'

<ABTestProvider
  name="hero-cta-test"
  variants={[
    { id: 'control', weight: 50 },
    { id: 'variant-a', weight: 50 }
  ]}
>
  {({ variant }) => (
    <HeroSection
      cta={{
        text: variant === 'control' 
          ? "Empezar Gratis" 
          : "Comenzar Ahora"
      }}
    />
  )}
</ABTestProvider>
```

## 🎨 **Temas y Personalización**

```tsx
import { MarketingProvider } from '@pandoras/marketing'

<MarketingProvider
  theme={{
    brand: {
      name: 'Mi Marca',
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#8B5CF6'
      }
    }
  }}
>
  <YourComponents />
</MarketingProvider>
```

## 🔧 **Configuración**

### Variables de Entorno

```env
RESEND_API_KEY=re_your_api_key
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
FACEBOOK_PIXEL_ID=your_pixel_id
```

### Configuración en Next.js

```tsx
// next.config.js
module.exports = {
  transpilePackages: ['@pandoras/marketing'],
  experimental: {
    optimizePackageImports: ['@pandoras/marketing']
  }
}
```

## 📚 **Componentes Disponibles**

### Hero Section
```tsx
<HeroSection
  title="Tu Título Principal"
  subtitle="Descripción del producto"
  cta={{ text: "CTA", href: "#", style: "primary" }}
/>
```

### Features Grid
```tsx
<FeatureSection
  title="Características"
  items={[
    { title: "Feature 1", description: "Descripción" },
    { title: "Feature 2", description: "Descripción" }
  ]}
/>
```

### Forms
- `EmailCaptureForm` - Captura emails
- `NewsletterForm` - Newsletter signup
- `ContactForm` - Contacto general

## 🎯 **Ejemplos de Uso**

Mira la carpeta `examples/` para casos de uso completos:
- `examples/nextjs/` - Implementación en Next.js
- `examples/react/` - React puro
- `examples/dashboard/` - En panel de administración

## 🤝 **Contribución**

1. Fork el repo
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -am 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 **Licencia**

MIT License - ver [LICENSE](LICENSE) para detalles

---

**¿Dudas?** Abre un issue o revisa los ejemplos en `examples/`