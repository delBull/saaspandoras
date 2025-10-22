#!/bin/bash

echo "🔍 Verificando consistencia entre ambientes..."

check_environment() {
    local ENV_NAME=$1
    local DB_URL=$2
    
    echo "🔎 Verificando $ENV_NAME..."
    export DATABASE_URL="$DB_URL"
    
    echo "  📊 Proyectos: $(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM projects;")"
    echo "  👥 Usuarios: $(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM users;")"
    echo "  ⚙️ Admins: $(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM administrators;")"
    
    # Verificar proyectos sin wallet
    local proyectos_sin_wallet=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM projects WHERE applicant_wallet_address IS NULL;")
    echo "  🚫 Proyectos sin wallet: $proyectos_sin_wallet"
    
    if [ "$proyectos_sin_wallet" -eq 0 ]; then
        echo "  ✅ $ENV_NAME: Todos los proyectos tienen wallet asignada"
    else
        echo "  ⚠️ $ENV_NAME: $proyectos_sin_wallet proyectos necesitan wallet"
    fi
}

# Verificar todos los ambientes
check_environment "LOCAL" "postgresql://Marco@localhost:5432/pandoras_local"
check_environment "STAGING" "postgresql://neondb_owner:npg_uj0h1LpbAQxi@ep-withered-thunder-adt88vka-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

echo "🎯 Verificación completa"
