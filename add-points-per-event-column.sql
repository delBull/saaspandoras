-- Script para agregar la columna points_per_event faltante en producción

-- Verificar si la columna ya existe antes de crearla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'achievements'
        AND column_name = 'points_per_event'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "achievements"
        ADD COLUMN "points_per_event" INTEGER DEFAULT 0;

        RAISE NOTICE '✅ Columna points_per_event agregada exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️  La columna points_per_event ya existe';
    END IF;
END $$;

-- Mostrar estado final
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'achievements'
AND table_schema = 'public'
ORDER BY ordinal_position;
