CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY CHECK (id = '1'),
  
    language TEXT DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
  currency TEXT DEFAULT 'EGP',
  
  allowed_genders TEXT DEFAULT 'both' CHECK (allowed_genders IN ('male', 'female', 'both')),
  
  default_payment_method TEXT DEFAULT 'cash' CHECK (default_payment_method IN ('cash', 'card', 'transfer', 'e-wallet')),
  
  auto_backup INTEGER DEFAULT 1 CHECK (auto_backup IN (0, 1)),
  backup_frequency TEXT DEFAULT 'weekly' CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
  backup_folder_path TEXT, 
  last_backup_date DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS trg_settings_updated_at
AFTER UPDATE ON settings
BEGIN
  UPDATE settings
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL UNIQUE,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  address TEXT,
  join_date DATE NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS membership_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  is_offer INTEGER NOT NULL CHECK (is_offer IN (0, 1)),
  duration_days INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amount_paid REAL NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
);

CREATE TABLE IF NOT EXISTS check_ins (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('week', 'month', 'year', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_revenue REAL NOT NULL,
  total_members INTEGER NOT NULL,
  new_members INTEGER NOT NULL,
  total_memberships INTEGER NOT NULL,
  new_memberships INTEGER NOT NULL,
  total_check_ins INTEGER NOT NULL,
  generated_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_dates ON reports(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_member_id ON check_ins(member_id);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_check_ins_member_date ON check_ins(member_id, DATE(check_in_time));

INSERT OR IGNORE INTO settings (
  id, 
  language, 
  currency, 
  allowed_genders,
  default_payment_method,
  auto_backup,
  backup_frequency
) VALUES (
  '1', 
  'ar', 
  'EGP', 
  'both',
  'cash',
  1,
  'weekly'
);