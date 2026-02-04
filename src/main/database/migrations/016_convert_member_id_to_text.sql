-- UP
-- Migration: Convert member ID from INTEGER to TEXT to support encrypted IDs
-- Description: Changes the members table ID from INTEGER to TEXT while preserving data

-- Disable foreign keys temporarily
PRAGMA foreign_keys = OFF;

-- Create new members table with TEXT ID
CREATE TABLE members_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  country_code TEXT DEFAULT '+20',
  phone TEXT NOT NULL UNIQUE,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  address TEXT,
  join_date DATE NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from old table (convert INTEGER to TEXT)
INSERT INTO members_new
SELECT
  CAST(id AS TEXT) as id,
  name,
  email,
  country_code,
  phone,
  gender,
  address,
  join_date,
  notes,
  created_at
FROM members;

-- Drop old table
DROP TABLE members;

-- Rename new table
ALTER TABLE members_new RENAME TO members;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;

-- DOWN
-- Rollback: Convert member ID from TEXT back to INTEGER

PRAGMA foreign_keys = OFF;

-- Create old members table with INTEGER ID
CREATE TABLE members_old (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  country_code TEXT DEFAULT '+20',
  phone TEXT NOT NULL UNIQUE,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  address TEXT,
  join_date DATE NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data back (only if IDs are numeric)
INSERT INTO members_old
SELECT
  CAST(id AS INTEGER) as id,
  name,
  email,
  country_code,
  phone,
  gender,
  address,
  join_date,
  notes,
  created_at
FROM members;

-- Drop new table
DROP TABLE members;

-- Rename old table
ALTER TABLE members_old RENAME TO members;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);

PRAGMA foreign_keys = ON;
