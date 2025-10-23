# 🔄 Sincronización de Datos entre Entornos

## Problema Identificado

Tu aplicación funciona correctamente en **local** pero en **staging/production** no se muestran los datos porque las bases de datos son diferentes:

- **Local**: `postgresql://Marco@localhost:5432/pandoras_local`
- **Staging**: `postgresql://neondb_owner:***@ep-withered-thunder-adt88vka-pooler.c-2.us-east-1.aws.neon.tech/neondb`

## ✅ Solución: Scripts de Sincronización

He creado dos scripts para sincronizar los datos entre entornos:

### 1. Exportar datos locales
```bash
node export-local-data.js
```

**¿Qué hace?**
- Exporta todos los usuarios, proyectos, administradores y datos de gamificación
- Crea un archivo `local-data-export.json` con todos los datos
- Usa upsert (ON CONFLICT) para evitar duplicados

### 2. Importar datos a staging
```bash
node import-staging-data.js
```

**¿Qué hace?**
- Lee el archivo `local-data-export.json`
- Importa todos los datos a la base de datos de staging
- Usa upsert para actualizar registros existentes

## 🚀 Pasos para Sincronizar

### Paso 1: Exportar datos locales
```bash
cd /Users/Marco/Documents/Company/Crypto/Pandoras/dApps/saaspandoras/saaspandoras
node export-local-data.js
```

**Resultado esperado:**
```
🔄 Iniciando exportación de datos locales...
📊 Conectando a base de datos local: postgresql://***:***@localhost:5432/pandoras_local
✅ Conexión establecida con base de datos local
📊 Datos encontrados:
   👥 Usuarios: 4
   📁 Proyectos: 11
   🛡️  Administradores: 3
📤 Exportando usuarios...
📤 Exportando proyectos...
📤 Exportando administradores...
✅ Datos exportados exitosamente a: /Users/Marco/Documents/Company/Crypto/Pandoras/dApps/saaspandoras/saaspandoras/local-data-export.json
```

### Paso 2: Importar datos a staging
```bash
node import-staging-data.js
```

**Resultado esperado:**
```
🔄 Iniciando importación de datos a staging...
📊 Conectando a base de datos staging: postgresql://***:***@neon.tech/neondb
✅ Conexión establecida con base de datos staging
📁 Archivo de exportación encontrado
📊 Datos actuales en staging:
   👥 Usuarios: 0
   📁 Proyectos: 0
   🛡️  Administradores: 0
📥 Importando usuarios...
📥 Importando administradores...
📥 Importando proyectos...
✅ Usuarios importados: 4/4
✅ Administradores importados: 3/3
✅ Proyectos importados: 11/11
📊 Datos finales en staging:
   👥 Usuarios: 4
   📁 Proyectos: 11
   🛡️  Administradores: 3
✅ Importación completada exitosamente!
```

## 🔧 Verificación

Después de la importación, verifica que los datos estén en staging:

```bash
# Verificar usuarios
psql "postgresql://neondb_owner:npg_uj0h1LpbAQxi@ep-withered-thunder-adt88vka-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT COUNT(*) FROM users;"

# Verificar proyectos
psql "postgresql://neondb_owner:npg_uj0h1LpbAQxi@ep-withered-thunder-adt88vka-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT COUNT(*) FROM projects;"

# Verificar administradores
psql "postgresql://neondb_owner:npg_uj0h1LpbAQxi@ep-withered-thunder-adt88vka-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT COUNT(*) FROM administrators;"
```

## 🎯 Problemas que se Solucionan

Después de la sincronización, estos problemas deberían estar resueltos:

1. ✅ **Dropdown de proyectos en /profile** - Se mostrarán los proyectos de usuarios que tienen proyectos
2. ✅ **Acceso a /profile/dashboard** - Ya no saldrá "denegado" porque los usuarios existirán en staging
3. ✅ **Admin dashboard** - Se mostrarán usuarios y proyectos porque la base de datos tendrá datos

## 🔄 Actualizaciones Futuras

Cuando hagas cambios en local y quieras actualizar staging:

1. Haz los cambios en local
2. Ejecuta `node export-local-data.js`
3. Ejecuta `node import-staging-data.js`
4. Haz deploy a Vercel

## ⚠️ Notas Importantes

- Los scripts usan **upsert** (ON CONFLICT) para evitar duplicados
- Los IDs se generan automáticamente en la base de destino
- Los timestamps se preservan correctamente
- Los datos de gamificación también se sincronizan

## 🆘 Si Hay Problemas

Si encuentras errores:

1. **Error de conexión**: Verifica que las credenciales de base de datos sean correctas
2. **Error de permisos**: Asegúrate de que el usuario de la BD tenga permisos de INSERT/UPDATE
3. **Error de sintaxis**: Los scripts están optimizados para PostgreSQL

¡Los scripts están listos para usar! 🚀
