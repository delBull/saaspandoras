-- =====================================================
-- CREAR TABLAS WHATSAPP MULTI-FLOW EN STAGING
-- =====================================================

-- whatsapp_users: Gestión de usuarios de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100),
    priority_level VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- whatsapp_sessions: Sesiones multi-flow
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    flow_type VARCHAR(50) NOT NULL, -- 'eight_q', 'high_ticket', 'support', 'human'
    state JSONB DEFAULT '{}' NOT NULL,
    current_step INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- whatsapp_messages: Log de mensajes
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    direction VARCHAR(10) NOT NULL, -- 'incoming', 'outgoing'
    body TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Índices y constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_users_phone 
ON whatsapp_users(phone);

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_sessions_user_flow_key
ON whatsapp_sessions(user_id, flow_type);

ALTER TABLE whatsapp_sessions 
ADD CONSTRAINT whatsapp_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES whatsapp_users(id);

ALTER TABLE whatsapp_messages
ADD CONSTRAINT whatsapp_messages_session_id_fkey
FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE;

-- Funciones para timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whatsapp_users_updated_at
    BEFORE UPDATE ON whatsapp_users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER whatsapp_sessions_updated_at
    BEFORE UPDATE ON whatsapp_sessions
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Migrar datos existentes (si los hay)
-- Nota: whatsapp_application_states es el antiguo formato, 
-- whatsapp_sessions es el nuevo multi-flow

