-- MIGRACIÓN: WHATSAPP PRE-APPLY LEADS SYSTEM
-- Versión v3.0 - 8 preguntas filtradas para protocolos de utilidad
-- Fecha: 2025-11-18

-- ============================================================================
-- DESCRIPCIÓN:
-- Esta migración añade soporte para el nuevo flujo de filtrado WhatsApp v3.0
-- que contiene 8 preguntas críticas para detectar protocolos de utilidad reales.
--
-- TABLA PRINCIPAL: whatsapp_preapply_leads
-- ============================================================================

-- Crear tabla para leads de pre-apply (flujo de 8 preguntas)
CREATE TABLE IF NOT EXISTS whatsapp_preapply_leads (
  id BIGSERIAL PRIMARY KEY,
  user_phone TEXT NOT NULL,
  step INTEGER DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'in_progress' NOT NULL,
  answers JSONB DEFAULT '{}' NOT NULL,
  applicant_name VARCHAR(256),
  applicant_email VARCHAR(256),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice único por teléfono de usuario para evitar duplicados
-- Solo permite un lead activo por teléfono
CREATE UNIQUE INDEX IF NOT EXISTS unique_whatsapp_lead_phone
ON whatsapp_preapply_leads(user_phone);

-- Índice para búsquedas por status (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_status
ON whatsapp_preapply_leads(status);

-- Índice para búsquedas por fecha de creación (analytics)
CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_created_at
ON whatsapp_preapply_leads(created_at);

-- Comentarios en la tabla para documentación
COMMENT ON TABLE whatsapp_preapply_leads IS 'Leads del filtro WhatsApp v3.0 - 8 preguntas críticas para protocolos de utilidad';
COMMENT ON COLUMN whatsapp_preapply_leads.user_phone IS 'Número de teléfono WhatsApp del usuario (único por conversacion activa)';
COMMENT ON COLUMN whatsapp_preapply_leads.step IS 'Paso actual en el cuestionario (0-7 para las 8 preguntas)';
COMMENT ON COLUMN whatsapp_preapply_leads.status IS 'Estado del lead: in_progress, completed, pending, approved, rejected';
COMMENT ON COLUMN whatsapp_preapply_leads.answers IS 'Respuestas JSON estructuradas a las 8 preguntas';
COMMENT ON COLUMN whatsapp_preapply_leads.applicant_name IS 'Nombre extraído automáticamente de Q3 (roles)';
COMMENT ON COLUMN whatsapp_preapply_leads.applicant_email IS 'Email extraído automáticamente de Q3 (roles)';

-- ============================================================================
-- TRIGGERS PARA AUTO-UPDATED_AT
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_whatsapp_leads_updated_at ON whatsapp_preapply_leads;
CREATE TRIGGER update_whatsapp_leads_updated_at
  BEFORE UPDATE ON whatsapp_preapply_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DATOS INICIALES (OPCIONAL)
-- ============================================================================
-- No se incluyen datos iniciales ya que esta tabla maneja leads nuevos

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Query para verificar que la tabla se creó correctamente:
-- SELECT
--   schemaname,
--   tablename,
--   tableowner
-- FROM pg_tables
-- WHERE tablename = 'whatsapp_preapply_leads';

-- Query para ver estructura de la tabla:
-- \d whatsapp_preapply_leads;

-- Query para ver índices:
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE tablename = 'whatsapp_preapply_leads'
-- ORDER BY indexname;

-- ============================================================================
-- MANUAL DE USO POST-MIGRACIÓN
-- ============================================================================

/*
1. EJECUTAR ESTA MIGRACIÓN:
   - En STAGING: Ejecutar file: staging/migration-whatsapp-preapply-leads.sql
   - En PRODUCTION: Ejecutar file: production/migration-whatsapp-preapply-leads.sql
   - En LOCAL: Ejecutar file: local/migration-whatsapp-preapply-leads.sql

2. VERIFICAR MIGRACIÓN:
   - Conectar a DB y verificar tabla existe: \dt whatsapp_preapply_leads
   - Verificar controles: \d whatsapp_preapply_leads

3. CONFIGURACIÓN POST-MIGRACIÓN:
   - El código ya está preparado para usar esta tabla
   - Webhook: /api/whatsapp/preapply está listo
   - Admin: /api/admin/whatsapp-preapply está listo

4. DEPLOYMENT:
   - Subir esta migración junto con el deploy de código
   - La migración es backwards-compatible (no rompe funcionalidad existente)

5. MONITOREO:
   - Monitorear logs con prefijo "[PRE-APPLY]" para el nuevo flujo
   - Admin dashboard mostrará leads en nueva pestaña "WA Leads"
*/
