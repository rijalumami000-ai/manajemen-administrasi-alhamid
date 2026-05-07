-- Authentication & Authorization Schema
-- Created: 2026-05-02
-- Purpose: User management, roles, and authentication

-- ============================================================================
-- TABLE: users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- bcrypt hashed
  email VARCHAR(100) UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'guru', 'staff')),
  phone VARCHAR(20),
  photo_url VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================================================
-- TABLE: sessions (Optional - for session tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================================
-- TABLE: activity_logs (Optional - for audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,  -- 'login', 'logout', 'create', 'update', 'delete'
  entity_type VARCHAR(50),  -- 'santri', 'guru', 'alumni', 'user', etc.
  entity_id INTEGER,
  description TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================================================
-- DEFAULT DATA: Admin User
-- ============================================================================
-- Default password: 'admin123' (hashed with bcrypt, cost factor 10)
-- IMPORTANT: Change this password after first login!
INSERT INTO users (username, password, email, full_name, role, is_active)
VALUES (
  'admin',
  '$2b$10$h98KFLha3agW6IFmSTFESuvYwIT/a09bjCm8I7bapOg/rL2KN9JD2',  -- 'admin123'
  'admin@sekolah.com',
  'Administrator',
  'admin',
  TRUE
)
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA: Additional Users (Optional)
-- ============================================================================
-- Sample Guru user
-- Password: 'guru123'
INSERT INTO users (username, password, email, full_name, role, is_active)
VALUES (
  'guru1',
  '$2b$10$RkL7bzy5s8hRCnHD67u9b.y4J6iOklCqk/5WXoPpm7bhF1pEHeOFW',  -- 'guru123'
  'guru1@sekolah.com',
  'Guru Contoh',
  'guru',
  TRUE
)
ON CONFLICT (username) DO NOTHING;

-- Sample Staff user
-- Password: 'staff123'
INSERT INTO users (username, password, email, full_name, role, is_active)
VALUES (
  'staff1',
  '$2b$10$9tkPvV7/.O2j/lZwtZ5K6OZmjUr4BHSY4hM2SBhS5lG/Il62IP2dS',  -- 'staff123'
  'staff1@sekolah.com',
  'Staff Contoh',
  'staff',
  TRUE
)
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- FUNCTIONS: Update timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLEANUP: Remove expired sessions (run periodically)
-- ============================================================================
-- This can be run as a cron job or scheduled task
-- DELETE FROM sessions WHERE expires_at < NOW();

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Default admin password is 'admin123' - CHANGE THIS IMMEDIATELY!
-- 2. All passwords are hashed with bcrypt (cost factor 10)
-- 3. Sessions expire after 1 hour (configurable in backend)
-- 4. Activity logs are kept indefinitely (consider archiving old logs)
-- 5. Inactive users cannot login but data is preserved
-- 6. Deleting a user cascades to sessions but preserves activity logs

-- ============================================================================
-- SECURITY REMINDERS
-- ============================================================================
-- [ ] Change default admin password
-- [ ] Use strong passwords (min 8 chars, complexity)
-- [ ] Enable HTTPS in production
-- [ ] Set secure JWT secret in .env
-- [ ] Implement rate limiting for login attempts
-- [ ] Regular security audits
-- [ ] Backup database regularly
