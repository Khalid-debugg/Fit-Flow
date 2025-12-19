-- UP
-- Create users table for authentication and authorization
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  permissions TEXT NOT NULL DEFAULT '{}',
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
BEGIN
  UPDATE users
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Insert default admin user (password: admin123)
-- IMPORTANT: Change this password immediately after first login!
INSERT INTO users (
  id,
  username,
  password_hash,
  full_name,
  email,
  is_admin,
  is_active,
  permissions
) VALUES (
  'admin001',
  'admin',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'System Administrator',
  NULL,
  1,
  1,
  '{}'
);

-- DOWN
-- Drop indexes
DROP INDEX IF EXISTS idx_users_is_active;
DROP INDEX IF EXISTS idx_users_is_admin;
DROP INDEX IF EXISTS idx_users_username;

-- Drop trigger
DROP TRIGGER IF EXISTS trg_users_updated_at;

-- Drop users table
DROP TABLE IF EXISTS users;
