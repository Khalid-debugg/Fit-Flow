-- UP
-- Migration: Add ON UPDATE CASCADE to foreign keys
-- Description: Allows member IDs to be updated without breaking foreign key constraints

-- Disable foreign keys temporarily
PRAGMA foreign_keys = OFF;

-- 1. Recreate memberships table with ON UPDATE CASCADE
CREATE TABLE memberships_new (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price REAL NOT NULL,
  amount_paid REAL NOT NULL,
  remaining_balance REAL NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  payment_method TEXT NOT NULL,
  payment_date DATE NOT NULL,
  remaining_check_ins INTEGER,
  is_custom INTEGER DEFAULT 0 CHECK (is_custom IN (0, 1)),
  price_modifier_type TEXT CHECK (price_modifier_type IN ('multiplier', 'discount', 'custom', NULL)),
  price_modifier_value REAL,
  custom_price_name TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES membership_plans(id) ON UPDATE CASCADE
);

INSERT INTO memberships_new SELECT * FROM memberships;
DROP TABLE memberships;
ALTER TABLE memberships_new RENAME TO memberships;

CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_payment_status ON memberships(payment_status);

-- 2. Recreate membership_payments table with ON UPDATE CASCADE
CREATE TABLE membership_payments_new (
  id TEXT PRIMARY KEY,
  membership_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'e-wallet')),
  payment_date DATE NOT NULL,
  payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN ('completed', 'scheduled', 'pending')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO membership_payments_new SELECT * FROM membership_payments;
DROP TABLE membership_payments;
ALTER TABLE membership_payments_new RENAME TO membership_payments;

CREATE INDEX IF NOT EXISTS idx_membership_payments_membership_id ON membership_payments(membership_id);

-- 3. Recreate check_ins table with ON UPDATE CASCADE
CREATE TABLE check_ins_new (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO check_ins_new SELECT * FROM check_ins;
DROP TABLE check_ins;
ALTER TABLE check_ins_new RENAME TO check_ins;

CREATE INDEX IF NOT EXISTS idx_check_ins_member_id ON check_ins(member_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_member_date ON check_ins(member_id, DATE(check_in_time));

-- 4. Recreate whatsapp_notifications table with ON UPDATE CASCADE
CREATE TABLE whatsapp_notifications_new (
  id TEXT PRIMARY KEY,
  membership_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_date DATETIME NOT NULL,
  days_before_expiry INTEGER NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO whatsapp_notifications_new SELECT * FROM whatsapp_notifications;
DROP TABLE whatsapp_notifications;
ALTER TABLE whatsapp_notifications_new RENAME TO whatsapp_notifications;

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_membership ON whatsapp_notifications(membership_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_member ON whatsapp_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_sent_date ON whatsapp_notifications(sent_date);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_expiry ON whatsapp_notifications(expiry_date);

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;

-- DOWN
-- Rollback: Remove ON UPDATE CASCADE from foreign keys

PRAGMA foreign_keys = OFF;

-- Revert memberships table
CREATE TABLE memberships_old (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price REAL NOT NULL,
  amount_paid REAL NOT NULL,
  remaining_balance REAL NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  payment_method TEXT NOT NULL,
  payment_date DATE NOT NULL,
  remaining_check_ins INTEGER,
  is_custom INTEGER DEFAULT 0 CHECK (is_custom IN (0, 1)),
  price_modifier_type TEXT CHECK (price_modifier_type IN ('multiplier', 'discount', 'custom', NULL)),
  price_modifier_value REAL,
  custom_price_name TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
);

INSERT INTO memberships_old SELECT * FROM memberships;
DROP TABLE memberships;
ALTER TABLE memberships_old RENAME TO memberships;

CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_payment_status ON memberships(payment_status);

-- Revert membership_payments table
CREATE TABLE membership_payments_old (
  id TEXT PRIMARY KEY,
  membership_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'e-wallet')),
  payment_date DATE NOT NULL,
  payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN ('completed', 'scheduled', 'pending')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE
);

INSERT INTO membership_payments_old SELECT * FROM membership_payments;
DROP TABLE membership_payments;
ALTER TABLE membership_payments_old RENAME TO membership_payments;

CREATE INDEX IF NOT EXISTS idx_membership_payments_membership_id ON membership_payments(membership_id);

-- Revert check_ins table
CREATE TABLE check_ins_old (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

INSERT INTO check_ins_old SELECT * FROM check_ins;
DROP TABLE check_ins;
ALTER TABLE check_ins_old RENAME TO check_ins;

CREATE INDEX IF NOT EXISTS idx_check_ins_member_id ON check_ins(member_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_member_date ON check_ins(member_id, DATE(check_in_time));

-- Revert whatsapp_notifications table
CREATE TABLE whatsapp_notifications_old (
  id TEXT PRIMARY KEY,
  membership_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_date DATETIME NOT NULL,
  days_before_expiry INTEGER NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

INSERT INTO whatsapp_notifications_old SELECT * FROM whatsapp_notifications;
DROP TABLE whatsapp_notifications;
ALTER TABLE whatsapp_notifications_old RENAME TO whatsapp_notifications;

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_membership ON whatsapp_notifications(membership_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_member ON whatsapp_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_sent_date ON whatsapp_notifications(sent_date);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_expiry ON whatsapp_notifications(expiry_date);

PRAGMA foreign_keys = ON;
