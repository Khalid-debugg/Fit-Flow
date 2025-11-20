export interface Settings {
  id?: string

  language: 'ar' | 'en'
  currency: string

  allowedGenders: 'male' | 'female' | 'both'

  defaultPaymentMethod: 'cash' | 'card' | 'bank'

  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  backupFolderPath?: string
  lastBackupDate?: string

  createdAt?: string
  updatedAt?: string
}

export interface SettingsDbRow {
  id: '1'

  language: 'ar' | 'en'
  currency: string
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

  allowed_genders: 'male' | 'female' | 'both'

  default_payment_method: 'cash' | 'card' | 'bank'

  auto_backup: 0 | 1
  backup_frequency: 'daily' | 'weekly' | 'monthly'
  backup_folder_path: string
  backup_location: string
  last_backup_date: string | null
  backup_enabled: 0 | 1

  created_at: string
  updated_at: string
}

export const CURRENCIES = [
  { code: 'EGP', name: 'Egyptian Pound', arSymbol: 'ج.م', enSymbol: 'EGP' },
  { code: 'USD', name: 'US Dollar', arSymbol: '$', enSymbol: 'USD' },
  { code: 'EUR', name: 'Euro', arSymbol: '€', enSymbol: 'EUR' },
  { code: 'GBP', name: 'British Pound', arSymbol: '£', enSymbol: 'GBP' },
  { code: 'SAR', name: 'Saudi Riyal', arSymbol: 'ر.س', enSymbol: 'SAR' },
  { code: 'AED', name: 'UAE Dirham', arSymbol: 'د.إ', enSymbol: 'AED' },
  { code: 'KWD', name: 'Kuwaiti Dinar', arSymbol: 'د.ك', enSymbol: 'KWD' },
  { code: 'QAR', name: 'Qatari Riyal', arSymbol: 'ر.ق', enSymbol: 'QAR' },
  { code: 'BHD', name: 'Bahraini Dinar', arSymbol: 'د.ب', enSymbol: 'BHD' },
  { code: 'OMR', name: 'Omani Rial', arSymbol: 'ر.ع', enSymbol: 'OMR' },
  { code: 'JOD', name: 'Jordanian Dinar', arSymbol: 'د.ا', enSymbol: 'JOD' },
  { code: 'LBP', name: 'Lebanese Pound', arSymbol: 'ل.ل', enSymbol: 'LBP' },
  { code: 'TND', name: 'Tunisian Dinar', arSymbol: 'د.ت', enSymbol: 'TND' },
  { code: 'MAD', name: 'Moroccan Dirham', arSymbol: 'د.م', enSymbol: 'MAD' },
  { code: 'DZD', name: 'Algerian Dinar', arSymbol: 'د.ج', enSymbol: 'DZD' },
  { code: 'IQD', name: 'Iraqi Dinar', arSymbol: 'د.ع', enSymbol: 'IQD' },
  { code: 'SYP', name: 'Syrian Pound', arSymbol: 'ل.س', enSymbol: 'SYP' },
  { code: 'YER', name: 'Yemeni Rial', arSymbol: 'ر.ي', enSymbol: 'YER' },
  { code: 'SDG', name: 'Sudanese Pound', arSymbol: 'ج.س', enSymbol: 'SDG' },
  { code: 'LYD', name: 'Libyan Dinar', arSymbol: 'د.ل', enSymbol: 'LYD' }
]
export interface BackupFile {
  name: string
  path: string
  size: number
  created: string
}
export interface BackupInfo {
  lastBackup?: string
  nextBackup?: string
  backupSize?: number
  folderPath?: string
  status: 'success' | 'failed' | 'pending' | 'uploading'
  message?: string
}
