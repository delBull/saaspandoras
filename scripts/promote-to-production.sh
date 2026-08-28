#!/usr/bin/env bash
set -e

# ==============================================================================
# 🚀 PANDORAS GROWTH OS & HERMES — Automated Release & Promotion Script
# Flow: feat/<branch> -> staging -> main -> Return to feat/<branch>
# ==============================================================================

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "========================================================"
echo "📦 Iniciando pipeline de lanzamiento desde: $CURRENT_BRANCH"
echo "========================================================"

# 1. Comprobar que no haya cambios sin commitear
if ! git diff-index --quiet HEAD --; then
  echo "❌ Error: Tienes cambios pendientes sin commitear en '$CURRENT_BRANCH'."
  echo "👉 Haz 'git add .' y 'git commit -m \"...\"' antes de ejecutar este script."
  exit 1
fi

# 2. Verificaciones de Calidad Obligatorias (TypeScript + Tests)
echo ""
echo "🧪 [1/4] Verificando compilación TypeScript..."
~/.bun/bin/bun x tsc --noEmit
echo "✅ TypeScript: 0 errores."

echo ""
echo "🧪 [2/4] Ejecutando suite de tests de Hermes & Seguridad..."
~/.bun/bin/bun test src/lib/pandoras/core/domains/hermes/runtime/policy/__tests__/snarai-transparency.test.ts src/lib/pandoras/core/domains/hermes/runtime/__tests__/snarai-transparency.test.ts
echo "✅ Tests: 100% pasando."

# 3. Integración a STAGING
echo ""
echo "🔄 [3/4] Integrando a rama 'staging' y publicando en Vercel Preview..."
git checkout staging
git pull origin staging --rebase || true
git merge "$CURRENT_BRANCH" --no-edit
git push origin staging
echo "🚀 Staging publicado exitosamente."

# 4. Promoción a MAIN (Producción)
echo ""
echo "🚀 [4/4] Promoviendo a rama 'main' y publicando en Producción..."
git checkout main
git pull origin main --rebase || true
git merge staging --no-edit
git push origin main
echo "🎉 Producción actualizada exitosamente en dash.pandoras.finance."

# 5. Retornar a la rama de trabajo
git checkout "$CURRENT_BRANCH"
echo ""
echo "========================================================"
echo "✨ Todo listo. Has regresado a tu rama de trabajo: $CURRENT_BRANCH"
echo "========================================================"
