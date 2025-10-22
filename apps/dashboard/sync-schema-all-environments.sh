#!/bin/bash

# ============================================================================
# Script Maestro para Sincronizar Schema entre Todos los Ambientes
# ============================================================================

set -e  # Parar en cualquier error

echo "🚀 Iniciando sincronización completa de schema..."

# ============================================================================
# FUNCIÓN PARA SINCRONIZAR UN AMBIENTE
# ============================================================================
sync_environment() {
    local ENV_NAME=$1
    local DB_URL=$2
    
    echo "🔄 Sincronizando $ENV_NAME..."
    export DATABASE_URL="$DB_URL"
    
    # 1. Aplicar todas las migraciones de Drizzle
    echo "📊 Aplicando migraciones Drizzle en $ENV_NAME..."
    npx drizzle-kit push
    
    # 2. Ejecutar scripts adicionales si existen
    if [ -f "./insert-test-data.sql" ]; then
        echo "🧪 Insertando datos de prueba en $ENV_NAME..."
        psql $DATABASE_URL -f insert-test-data.sql
    fi
    
    # 3. Ejecutar script de wallets (si hay proyectos)
    if psql $DATABASE_URL -c "SELECT COUNT(*) FROM projects;" | grep -q "[1-9]"; then
        echo "🔗 Ejecutando corrección de wallets en $ENV_NAME..."
        psql $DATABASE_URL -f fix-missing-wallet-assignments.sql
    else
        echo "📭 No hay proyectos en $ENV_NAME, omitiendo corrección de wallets"
    fi
    
    echo "✅ $ENV_NAME sincronizado correctamente"
}

# ============================================================================
# EJECUTAR SINCRONIZACIÓN PARA CADA AMBIENTE
# ============================================================================

# 1. LOCAL (tu ambiente de desarrollo)
echo "🏠 Sincronizando ambiente LOCAL..."
sync_environment "LOCAL" "postgresql://Marco@localhost:5432/pandoras_local"

# 2. STAGING
echo "🌍 Sincronizando ambiente STAGING..."
sync_environment "STAGING" "postgresql://neondb_owner:npg_uj0h1LpbAQxi@ep-withered-thunder-adt88vka-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 3. MAIN/PRODUCCIÓN (cuando llegue el momento)
# echo "🚀 Sincronizando ambiente PRODUCCIÓN..."
# sync_environment "PRODUCCIÓN" "postgresql://neondb_owner:npg_MjazsA5ybWQ3@ep-summer-bread-adqdsnx4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

echo "🎉 ¡Sincronización completa! Todos los ambientes tienen el mismo schema"
