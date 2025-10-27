-- Migration para sistema de referidos directo basado en wallet addresses
-- Ejecutar con: psql $DATABASE_URL < apps/dashboard/drizzle/referrals-migration.sql

-- Tabla de referidos realizados (simplificada usando wallet addresses directamente)
CREATE TABLE IF NOT EXISTS user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_wallet_address VARCHAR(42) NOT NULL, -- Wallet address de quien refirió
  referred_wallet_address VARCHAR(42) NOT NULL, -- Wallet address de quien fue referido
  referral_source VARCHAR(20) DEFAULT 'direct' CHECK (referral_source IN ('direct', 'link', 'code', 'social')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  referrer_points_awarded BOOLEAN DEFAULT false, -- Si ya se otorgaron puntos al referidor
  referred_points_awarded BOOLEAN DEFAULT false, -- Si ya se otorgaron puntos al referido
  referred_completed_onboarding BOOLEAN DEFAULT false, -- Si el referido completó acciones relevantes (login diario, etc)
  referred_first_project BOOLEAN DEFAULT false, -- Si el referido creó su primer proyecto
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP NULL,
  referrer_bonus_date TIMESTAMP NULL, -- Fecha cuando se dieron puntos al referidor
  referred_bonus_date TIMESTAMP NULL, -- Fecha cuando se dieron puntos al referido
  UNIQUE(referrer_wallet_address, referred_wallet_address) -- Evitar referidos duplicados
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON user_referrals(referrer_wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON user_referrals(referred_wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_referrals_status ON user_referrals(status);
CREATE INDEX IF NOT EXISTS idx_user_referrals_created_at ON user_referrals(created_at);

-- Trigger para mantener actualizado el conteo de referidos en gamification_profiles
CREATE OR REPLACE FUNCTION update_referrals_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Actualizar conteo cuando se complete un referido
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'completed' THEN
    UPDATE gamification_profiles
    SET referrals_count = referrals_count + 1
    WHERE wallet_address::VARCHAR(42) = NEW.referrer_wallet_address;
  END IF;

  -- Si se elimina un referido completado, restar del conteo
  IF TG_OP = 'DELETE' AND OLD.status = 'completed' THEN
    UPDATE gamification_profiles
    SET referrals_count = GREATEST(referrals_count - 1, 0)
    WHERE wallet_address::VARCHAR(42) = OLD.referrer_wallet_address;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER user_referrals_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_referrals
  FOR EACH ROW EXECUTE FUNCTION update_referrals_count();

-- Función para procesar referido automático
CREATE OR REPLACE FUNCTION process_wallet_referral(
  p_referrer_wallet VARCHAR(42),
  p_referred_wallet VARCHAR(42),
  p_source VARCHAR(20) DEFAULT 'direct'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  referral_exists BOOLEAN;
BEGIN
  -- Verificar si ya existe este referido
  SELECT EXISTS(
    SELECT 1 FROM user_referrals
    WHERE referrer_wallet_address = p_referrer_wallet
    AND referred_wallet_address = p_referred_wallet
  ) INTO referral_exists;

  -- Si ya existe, no hacer nada
  IF referral_exists THEN
    RETURN FALSE;
  END IF;

  -- Crear nuevo referido
  INSERT INTO user_referrals (
    referrer_wallet_address,
    referred_wallet_address,
    referral_source,
    status
  ) VALUES (
    p_referrer_wallet,
    p_referred_wallet,
    p_source,
    'pending'
  );

  RETURN TRUE;
END;
$$;

-- Trigger para auto-procesar referrals cuando usuarios conectan wallet por primera vez
-- (Se activará desde el API cuando detecte parámetro ref en URL)

-- Permisos (ajustar según necesidades)
-- GRANT SELECT, INSERT, UPDATE ON user_referrals TO app_user;
