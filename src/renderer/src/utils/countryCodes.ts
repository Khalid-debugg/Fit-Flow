export interface CountryCode {
  code: string // e.g., "+1", "+20"
  country: string // English name
  countryAr: string // Arabic name
  iso: string // ISO country code (e.g., "US", "EG")
  minLength: number // Minimum phone number length (excluding country code)
  maxLength: number // Maximum phone number length (excluding country code)
}

export const COUNTRY_CODES: CountryCode[] = [
  // Middle East & North Africa
  {
    code: '+20',
    country: 'Egypt',
    countryAr: 'مصر',
    iso: 'EG',
    minLength: 10,
    maxLength: 10
  },
  {
    code: '+966',
    country: 'Saudi Arabia',
    countryAr: 'السعودية',
    iso: 'SA',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+971',
    country: 'UAE',
    countryAr: 'الإمارات',
    iso: 'AE',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+965',
    country: 'Kuwait',
    countryAr: 'الكويت',
    iso: 'KW',
    minLength: 8,
    maxLength: 8
  },
  {
    code: '+974',
    country: 'Qatar',
    countryAr: 'قطر',
    iso: 'QA',
    minLength: 8,
    maxLength: 8
  },
  {
    code: '+973',
    country: 'Bahrain',
    countryAr: 'البحرين',
    iso: 'BH',
    minLength: 8,
    maxLength: 8
  },
  {
    code: '+968',
    country: 'Oman',
    countryAr: 'عمان',
    iso: 'OM',
    minLength: 8,
    maxLength: 8
  },
  {
    code: '+962',
    country: 'Jordan',
    countryAr: 'الأردن',
    iso: 'JO',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+961',
    country: 'Lebanon',
    countryAr: 'لبنان',
    iso: 'LB',
    minLength: 7,
    maxLength: 8
  },
  {
    code: '+970',
    country: 'Palestine',
    countryAr: 'فلسطين',
    iso: 'PS',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+963',
    country: 'Syria',
    countryAr: 'سوريا',
    iso: 'SY',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+964',
    country: 'Iraq',
    countryAr: 'العراق',
    iso: 'IQ',
    minLength: 10,
    maxLength: 10
  },
  {
    code: '+967',
    country: 'Yemen',
    countryAr: 'اليمن',
    iso: 'YE',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+212',
    country: 'Morocco',
    countryAr: 'المغرب',
    iso: 'MA',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+213',
    country: 'Algeria',
    countryAr: 'الجزائر',
    iso: 'DZ',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+216',
    country: 'Tunisia',
    countryAr: 'تونس',
    iso: 'TN',
    minLength: 8,
    maxLength: 8
  },
  {
    code: '+218',
    country: 'Libya',
    countryAr: 'ليبيا',
    iso: 'LY',
    minLength: 9,
    maxLength: 10
  },
  {
    code: '+249',
    country: 'Sudan',
    countryAr: 'السودان',
    iso: 'SD',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+222',
    country: 'Mauritania',
    countryAr: 'موريتانيا',
    iso: 'MR',
    minLength: 8,
    maxLength: 8
  },
  {
    code: '+253',
    country: 'Djibouti',
    countryAr: 'جيبوتي',
    iso: 'DJ',
    minLength: 8,
    maxLength: 8
  },
  {
    code: '+252',
    country: 'Somalia',
    countryAr: 'الصومال',
    iso: 'SO',
    minLength: 7,
    maxLength: 9
  },
  {
    code: '+98',
    country: 'Iran',
    countryAr: 'إيران',
    iso: 'IR',
    minLength: 10,
    maxLength: 10
  },
  {
    code: '+90',
    country: 'Turkey',
    countryAr: 'تركيا',
    iso: 'TR',
    minLength: 10,
    maxLength: 10
  },
  {
    code: '+93',
    country: 'Afghanistan',
    countryAr: 'أفغانستان',
    iso: 'AF',
    minLength: 9,
    maxLength: 9
  },

  // Major World Currencies
  {
    code: '+1',
    country: 'United States / Canada',
    countryAr: 'الولايات المتحدة / كندا',
    iso: 'US',
    minLength: 10,
    maxLength: 10
  },
  {
    code: '+44',
    country: 'United Kingdom',
    countryAr: 'المملكة المتحدة',
    iso: 'GB',
    minLength: 10,
    maxLength: 10
  },
  { code: '+33', country: 'France', countryAr: 'فرنسا', iso: 'FR', minLength: 9, maxLength: 9 },
  { code: '+49', country: 'Germany', countryAr: 'ألمانيا', iso: 'DE', minLength: 10, maxLength: 11 },
  { code: '+39', country: 'Italy', countryAr: 'إيطاليا', iso: 'IT', minLength: 9, maxLength: 10 },
  { code: '+34', country: 'Spain', countryAr: 'إسبانيا', iso: 'ES', minLength: 9, maxLength: 9 },
  { code: '+86', country: 'China', countryAr: 'الصين', iso: 'CN', minLength: 11, maxLength: 11 },
  { code: '+81', country: 'Japan', countryAr: 'اليابان', iso: 'JP', minLength: 10, maxLength: 10 },
  { code: '+82', country: 'South Korea', countryAr: 'كوريا الجنوبية', iso: 'KR', minLength: 9, maxLength: 10 },
  { code: '+91', country: 'India', countryAr: 'الهند', iso: 'IN', minLength: 10, maxLength: 10 },
  {
    code: '+7',
    country: 'Russia / Kazakhstan',
    countryAr: 'روسيا / كازاخستان',
    iso: 'RU',
    minLength: 10,
    maxLength: 10
  },

  // Europe
  { code: '+41', country: 'Switzerland', countryAr: 'سويسرا', iso: 'CH', minLength: 9, maxLength: 9 },
  { code: '+43', country: 'Austria', countryAr: 'النمسا', iso: 'AT', minLength: 10, maxLength: 11 },
  {
    code: '+32',
    country: 'Belgium',
    countryAr: 'بلجيكا',
    iso: 'BE',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+31',
    country: 'Netherlands',
    countryAr: 'هولندا',
    iso: 'NL',
    minLength: 9,
    maxLength: 9
  },
  { code: '+46', country: 'Sweden', countryAr: 'السويد', iso: 'SE', minLength: 9, maxLength: 9 },
  { code: '+47', country: 'Norway', countryAr: 'النرويج', iso: 'NO', minLength: 8, maxLength: 8 },
  {
    code: '+45',
    country: 'Denmark',
    countryAr: 'الدنمارك',
    iso: 'DK',
    minLength: 8,
    maxLength: 8
  },
  { code: '+358', country: 'Finland', countryAr: 'فنلندا', iso: 'FI', minLength: 9, maxLength: 10 },
  { code: '+48', country: 'Poland', countryAr: 'بولندا', iso: 'PL', minLength: 9, maxLength: 9 },
  {
    code: '+420',
    country: 'Czech Republic',
    countryAr: 'التشيك',
    iso: 'CZ',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+36',
    country: 'Hungary',
    countryAr: 'المجر',
    iso: 'HU',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+40',
    country: 'Romania',
    countryAr: 'رومانيا',
    iso: 'RO',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+30',
    country: 'Greece',
    countryAr: 'اليونان',
    iso: 'GR',
    minLength: 10,
    maxLength: 10
  },
  {
    code: '+351',
    country: 'Portugal',
    countryAr: 'البرتغال',
    iso: 'PT',
    minLength: 9,
    maxLength: 9
  },
  { code: '+353', country: 'Ireland', countryAr: 'إيرلندا', iso: 'IE', minLength: 9, maxLength: 9 },
  { code: '+380', country: 'Ukraine', countryAr: 'أوكرانيا', iso: 'UA', minLength: 9, maxLength: 9 },

  // Asia-Pacific
  {
    code: '+92',
    country: 'Pakistan',
    countryAr: 'باكستان',
    iso: 'PK',
    minLength: 10,
    maxLength: 10
  },
  {
    code: '+880',
    country: 'Bangladesh',
    countryAr: 'بنغلاديش',
    iso: 'BD',
    minLength: 10,
    maxLength: 10
  },
  {
    code: '+94',
    country: 'Sri Lanka',
    countryAr: 'سريلانكا',
    iso: 'LK',
    minLength: 9,
    maxLength: 9
  },
  { code: '+977', country: 'Nepal', countryAr: 'نيبال', iso: 'NP', minLength: 10, maxLength: 10 },
  { code: '+95', country: 'Myanmar', countryAr: 'ميانمار', iso: 'MM', minLength: 8, maxLength: 10 },
  {
    code: '+66',
    country: 'Thailand',
    countryAr: 'تايلاند',
    iso: 'TH',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+60',
    country: 'Malaysia',
    countryAr: 'ماليزيا',
    iso: 'MY',
    minLength: 9,
    maxLength: 10
  },
  {
    code: '+65',
    country: 'Singapore',
    countryAr: 'سنغافورة',
    iso: 'SG',
    minLength: 8,
    maxLength: 8
  },
  {
    code: '+62',
    country: 'Indonesia',
    countryAr: 'إندونيسيا',
    iso: 'ID',
    minLength: 9,
    maxLength: 11
  },
  {
    code: '+63',
    country: 'Philippines',
    countryAr: 'الفلبين',
    iso: 'PH',
    minLength: 10,
    maxLength: 10
  },
  {
    code: '+84',
    country: 'Vietnam',
    countryAr: 'فيتنام',
    iso: 'VN',
    minLength: 9,
    maxLength: 10
  },
  {
    code: '+852',
    country: 'Hong Kong',
    countryAr: 'هونغ كونغ',
    iso: 'HK',
    minLength: 8,
    maxLength: 8
  },
  {
    code: '+886',
    country: 'Taiwan',
    countryAr: 'تايوان',
    iso: 'TW',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+61',
    country: 'Australia',
    countryAr: 'أستراليا',
    iso: 'AU',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+64',
    country: 'New Zealand',
    countryAr: 'نيوزيلندا',
    iso: 'NZ',
    minLength: 9,
    maxLength: 10
  },

  // Africa
  {
    code: '+27',
    country: 'South Africa',
    countryAr: 'جنوب أفريقيا',
    iso: 'ZA',
    minLength: 9,
    maxLength: 9
  },
  {
    code: '+234',
    country: 'Nigeria',
    countryAr: 'نيجيريا',
    iso: 'NG',
    minLength: 10,
    maxLength: 10
  },
  { code: '+254', country: 'Kenya', countryAr: 'كينيا', iso: 'KE', minLength: 9, maxLength: 10 },
  { code: '+233', country: 'Ghana', countryAr: 'غانا', iso: 'GH', minLength: 9, maxLength: 9 },
  {
    code: '+255',
    country: 'Tanzania',
    countryAr: 'تنزانيا',
    iso: 'TZ',
    minLength: 9,
    maxLength: 9
  },
  { code: '+256', country: 'Uganda', countryAr: 'أوغندا', iso: 'UG', minLength: 9, maxLength: 9 },
  {
    code: '+251',
    country: 'Ethiopia',
    countryAr: 'إثيوبيا',
    iso: 'ET',
    minLength: 9,
    maxLength: 9
  },

  // Americas
  { code: '+52', country: 'Mexico', countryAr: 'المكسيك', iso: 'MX', minLength: 10, maxLength: 10 },
  {
    code: '+55',
    country: 'Brazil',
    countryAr: 'البرازيل',
    iso: 'BR',
    minLength: 10,
    maxLength: 11
  },
  {
    code: '+54',
    country: 'Argentina',
    countryAr: 'الأرجنتين',
    iso: 'AR',
    minLength: 10,
    maxLength: 10
  },
  { code: '+56', country: 'Chile', countryAr: 'تشيلي', iso: 'CL', minLength: 9, maxLength: 9 },
  {
    code: '+57',
    country: 'Colombia',
    countryAr: 'كولومبيا',
    iso: 'CO',
    minLength: 10,
    maxLength: 10
  },
  { code: '+51', country: 'Peru', countryAr: 'بيرو', iso: 'PE', minLength: 9, maxLength: 9 },
  {
    code: '+58',
    country: 'Venezuela',
    countryAr: 'فنزويلا',
    iso: 'VE',
    minLength: 10,
    maxLength: 10
  }
]

// Sort by country name (English) alphabetically
COUNTRY_CODES.sort((a, b) => a.country.localeCompare(b.country))

// Helper function to validate phone number length
export function validatePhoneNumber(countryCode: string, phoneNumber: string): boolean {
  const country = COUNTRY_CODES.find((c) => c.code === countryCode)
  if (!country) return false

  const digitCount = phoneNumber.replace(/\D/g, '').length
  return digitCount >= country.minLength && digitCount <= country.maxLength
}

// Helper function to get country by code
export function getCountryByCode(code: string): CountryCode | undefined {
  return COUNTRY_CODES.find((c) => c.code === code)
}

// Helper function to format phone number display
export function formatPhoneDisplay(countryCode: string, phoneNumber: string): string {
  const codeWithoutPlus = countryCode.replace('+', '')
  return `${codeWithoutPlus}${phoneNumber}`
}
