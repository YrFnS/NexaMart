/**
 * Centralized Reference Data for NexaMart
 *
 * This file contains ALL reference/config data used across the application.
 * It is importable from both client components and server-side API routes.
 *
 * Icons are referenced by string name (e.g., 'Monitor', 'Shirt') so that
 * components can map them to actual React components without this file
 * depending on React.
 */

// ============================================================================
// Car Reference Data
// ============================================================================

export const CAR_MAKES = [
  { value: 'Toyota', label: 'Toyota', labelAr: 'تويوتا' },
  { value: 'Nissan', label: 'Nissan', labelAr: 'نيسان' },
  { value: 'Hyundai', label: 'Hyundai', labelAr: 'هيونداي' },
  { value: 'BMW', label: 'BMW', labelAr: 'بي إم دبليو' },
  { value: 'Mercedes', label: 'Mercedes', labelAr: 'مرسيدس' },
  { value: 'Honda', label: 'Honda', labelAr: 'هوندا' },
  { value: 'Ford', label: 'Ford', labelAr: 'فورد' },
  { value: 'Chevrolet', label: 'Chevrolet', labelAr: 'شيفروليه' },
  { value: 'Kia', label: 'Kia', labelAr: 'كيا' },
  { value: 'Lexus', label: 'Lexus', labelAr: 'لكزس' },
] as const;

export const CAR_MAKE_MODELS: Record<string, { value: string; label: string; labelAr: string }[]> = {
  'Toyota': [
    { value: 'Camry', label: 'Camry', labelAr: 'كامري' },
    { value: 'Corolla', label: 'Corolla', labelAr: 'كورولا' },
    { value: 'RAV4', label: 'RAV4', labelAr: 'راف 4' },
    { value: 'Land Cruiser', label: 'Land Cruiser', labelAr: 'لاند كروزر' },
    { value: 'Hilux', label: 'Hilux', labelAr: 'هايلكس' },
  ],
  'Nissan': [
    { value: 'Patrol', label: 'Patrol', labelAr: 'باترول' },
    { value: 'Altima', label: 'Altima', labelAr: 'ألتيما' },
    { value: 'X-Trail', label: 'X-Trail', labelAr: 'إكس تريل' },
    { value: 'Sunny', label: 'Sunny', labelAr: 'صني' },
  ],
  'Hyundai': [
    { value: 'Tucson', label: 'Tucson', labelAr: 'توسان' },
    { value: 'Elantra', label: 'Elantra', labelAr: 'النترا' },
    { value: 'Santa Fe', label: 'Santa Fe', labelAr: 'سانتا في' },
    { value: 'Accent', label: 'Accent', labelAr: 'أكسنت' },
  ],
  'BMW': [
    { value: 'X5', label: 'X5', labelAr: 'إكس 5' },
    { value: '3 Series', label: '3 Series', labelAr: 'الفئة 3' },
    { value: '5 Series', label: '5 Series', labelAr: 'الفئة 5' },
    { value: 'X3', label: 'X3', labelAr: 'إكس 3' },
  ],
  'Mercedes': [
    { value: 'C-Class', label: 'C-Class', labelAr: 'سي كلاس' },
    { value: 'E-Class', label: 'E-Class', labelAr: 'إي كلاس' },
    { value: 'GLE', label: 'GLE', labelAr: 'جل إي' },
    { value: 'S-Class', label: 'S-Class', labelAr: 'إس كلاس' },
  ],
  'Honda': [
    { value: 'Civic', label: 'Civic', labelAr: 'سيفيك' },
    { value: 'Accord', label: 'Accord', labelAr: 'أكورد' },
    { value: 'CR-V', label: 'CR-V', labelAr: 'سي آر في' },
    { value: 'HR-V', label: 'HR-V', labelAr: 'إتش آر في' },
  ],
  'Ford': [
    { value: 'F-150', label: 'F-150', labelAr: 'إف 150' },
    { value: 'Explorer', label: 'Explorer', labelAr: 'إكسبلورر' },
    { value: 'Mustang', label: 'Mustang', labelAr: 'موستانج' },
    { value: 'Edge', label: 'Edge', labelAr: 'إيدج' },
  ],
  'Chevrolet': [
    { value: 'Tahoe', label: 'Tahoe', labelAr: 'تاهو' },
    { value: 'Silverado', label: 'Silverado', labelAr: 'سيلفرادو' },
    { value: 'Malibu', label: 'Malibu', labelAr: 'ماليبو' },
    { value: 'Equinox', label: 'Equinox', labelAr: 'إكوينوكس' },
  ],
  'Kia': [
    { value: 'Sportage', label: 'Sportage', labelAr: 'سبورتاج' },
    { value: 'Optima', label: 'Optima', labelAr: 'أوبتيما' },
    { value: 'Seltos', label: 'Seltos', labelAr: 'سيلتوس' },
    { value: 'Carnival', label: 'Carnival', labelAr: 'كارنفال' },
  ],
  'Lexus': [
    { value: 'ES', label: 'ES', labelAr: 'إي إس' },
    { value: 'RX', label: 'RX', labelAr: 'آر إكس' },
    { value: 'LX', label: 'LX', labelAr: 'إل إكس' },
    { value: 'NX', label: 'NX', labelAr: 'إن إكس' },
  ],
};

export const FUEL_TYPES = [
  { value: 'gasoline', label: 'Gasoline', labelAr: 'بنزين' },
  { value: 'diesel', label: 'Diesel', labelAr: 'ديزل' },
  { value: 'hybrid', label: 'Hybrid', labelAr: 'هجين' },
  { value: 'electric', label: 'Electric', labelAr: 'كهربائي' },
] as const;

export const TRANSMISSIONS = [
  { value: 'automatic', label: 'Automatic', labelAr: 'أوتوماتيك' },
  { value: 'manual', label: 'Manual', labelAr: 'يدوي' },
] as const;

export const BODY_TYPES = [
  { value: 'sedan', label: 'Sedan', labelAr: 'سيدان' },
  { value: 'suv', label: 'SUV', labelAr: 'دفع رباعي' },
  { value: 'hatchback', label: 'Hatchback', labelAr: 'هاتشباك' },
  { value: 'pickup', label: 'Pickup', labelAr: 'بيك أب' },
  { value: 'coupe', label: 'Coupe', labelAr: 'كوبيه' },
  { value: 'van', label: 'Van', labelAr: 'فان' },
] as const;

export const CAR_CONDITIONS = [
  { value: 'new', label: 'New', labelAr: 'جديد' },
  { value: 'used', label: 'Used', labelAr: 'مستعمل' },
] as const;

export const CAR_COLORS = [
  { value: 'White', label: 'White', labelAr: 'أبيض' },
  { value: 'Black', label: 'Black', labelAr: 'أسود' },
  { value: 'Silver', label: 'Silver', labelAr: 'فضي' },
  { value: 'Gray', label: 'Gray', labelAr: 'رمادي' },
  { value: 'Red', label: 'Red', labelAr: 'أحمر' },
  { value: 'Blue', label: 'Blue', labelAr: 'أزرق' },
  { value: 'Green', label: 'Green', labelAr: 'أخضر' },
] as const;

// ============================================================================
// MENA Cities (comprehensive — used across API routes, components, etc.)
// ============================================================================

export const MENA_CITIES = [
  { value: 'Dubai', label: 'Dubai', labelAr: 'دبي' },
  { value: 'Riyadh', label: 'Riyadh', labelAr: 'الرياض' },
  { value: 'Amman', label: 'Amman', labelAr: 'عمان' },
  { value: 'Cairo', label: 'Cairo', labelAr: 'القاهرة' },
  { value: 'Baghdad', label: 'Baghdad', labelAr: 'بغداد' },
  { value: 'Kuwait', label: 'Kuwait City', labelAr: 'الكويت' },
  { value: 'Manama', label: 'Manama', labelAr: 'المنامة' },
  { value: 'Muscat', label: 'Muscat', labelAr: 'مسقط' },
] as const;

/** Extended city data with coordinates and country info — single source of truth */
export const MENA_CITIES_EXTENDED = [
  { key: 'riyadh', name: 'Riyadh', nameAr: 'الرياض', country: 'Saudi Arabia', countryAr: 'السعودية', lat: 24.7136, lng: 46.6753 },
  { key: 'jeddah', name: 'Jeddah', nameAr: 'جدة', country: 'Saudi Arabia', countryAr: 'السعودية', lat: 21.5433, lng: 39.1728 },
  { key: 'dubai', name: 'Dubai', nameAr: 'دبي', country: 'UAE', countryAr: 'الإمارات', lat: 25.2048, lng: 55.2708 },
  { key: 'abu-dhabi', name: 'Abu Dhabi', nameAr: 'أبوظبي', country: 'UAE', countryAr: 'الإمارات', lat: 24.4539, lng: 54.3773 },
  { key: 'kuwait-city', name: 'Kuwait City', nameAr: 'مدينة الكويت', country: 'Kuwait', countryAr: 'الكويت', lat: 29.3759, lng: 47.9774 },
  { key: 'baghdad', name: 'Baghdad', nameAr: 'بغداد', country: 'Iraq', countryAr: 'العراق', lat: 33.3152, lng: 44.3661 },
  { key: 'amman', name: 'Amman', nameAr: 'عمان', country: 'Jordan', countryAr: 'الأردن', lat: 31.9454, lng: 35.9284 },
  { key: 'doha', name: 'Doha', nameAr: 'الدوحة', country: 'Qatar', countryAr: 'قطر', lat: 25.2854, lng: 51.5310 },
  { key: 'muscat', name: 'Muscat', nameAr: 'مسقط', country: 'Oman', countryAr: 'عمان', lat: 23.5880, lng: 58.3829 },
  { key: 'cairo', name: 'Cairo', nameAr: 'القاهرة', country: 'Egypt', countryAr: 'مصر', lat: 30.0444, lng: 31.2357 },
  { key: 'beirut', name: 'Beirut', nameAr: 'بيروت', country: 'Lebanon', countryAr: 'لبنان', lat: 33.8938, lng: 35.5018 },
  { key: 'casablanca', name: 'Casablanca', nameAr: 'الدار البيضاء', country: 'Morocco', countryAr: 'المغرب', lat: 33.5731, lng: -7.5898 },
  { key: 'manama', name: 'Manama', nameAr: 'المنامة', country: 'Bahrain', countryAr: 'البحرين', lat: 26.2285, lng: 50.5860 },
] as const;

/** Simple city name list for product card location badges */
export const MENA_CITY_NAMES = [
  'Baghdad', 'Dubai', 'Riyadh', 'Amman', 'Cairo',
  'Kuwait City', 'Doha', 'Muscat', 'Jeddah', 'Beirut',
  'Casablanca', 'Tunis', 'Abu Dhabi', 'Manama', 'Damascus',
] as const;

/** Shipping distance matrix between MENA cities (km) */
export const MENA_CITY_DISTANCES: Record<string, Record<string, number>> = {
  riyadh: { jeddah: 950, dubai: 980, 'abu-dhabi': 950, 'kuwait-city': 650, baghdad: 1050, amman: 1250, doha: 500, muscat: 1200, cairo: 1650 },
  jeddah: { riyadh: 950, dubai: 1700, 'abu-dhabi': 1650, 'kuwait-city': 1350, baghdad: 1650, amman: 950, doha: 1350, muscat: 1900, cairo: 1300 },
  dubai: { riyadh: 980, jeddah: 1700, 'abu-dhabi': 150, 'kuwait-city': 1250, baghdad: 1450, amman: 2000, doha: 400, muscat: 450, cairo: 2400 },
  'abu-dhabi': { riyadh: 950, jeddah: 1650, dubai: 150, 'kuwait-city': 1100, baghdad: 1300, amman: 1900, doha: 350, muscat: 400, cairo: 2300 },
  'kuwait-city': { riyadh: 650, jeddah: 1350, dubai: 1250, 'abu-dhabi': 1100, baghdad: 550, amman: 1200, doha: 700, muscat: 1400, cairo: 1300 },
  baghdad: { riyadh: 1050, jeddah: 1650, dubai: 1450, 'abu-dhabi': 1300, 'kuwait-city': 550, amman: 800, doha: 1150, muscat: 1600, cairo: 1300 },
  amman: { riyadh: 1250, jeddah: 950, dubai: 2000, 'abu-dhabi': 1900, 'kuwait-city': 1200, baghdad: 800, doha: 1650, muscat: 2200, cairo: 500 },
  doha: { riyadh: 500, jeddah: 1350, dubai: 400, 'abu-dhabi': 350, 'kuwait-city': 700, baghdad: 1150, amman: 1650, muscat: 700, cairo: 1950 },
  muscat: { riyadh: 1200, jeddah: 1900, dubai: 450, 'abu-dhabi': 400, 'kuwait-city': 1400, baghdad: 1600, amman: 2200, doha: 700, cairo: 2600 },
  cairo: { riyadh: 1650, jeddah: 1300, dubai: 2400, 'abu-dhabi': 2300, 'kuwait-city': 1300, baghdad: 1300, amman: 500, doha: 1950, muscat: 2600 },
};

/** Shipping carriers operating in MENA */
export const MENA_SHIPPING_CARRIERS = [
  { id: 'aramex', name: 'Aramex', nameAr: 'أرامكس', logo: '📦' },
  { id: 'dhl', name: 'DHL Express', nameAr: 'دي إتش إل إكسبرس', logo: '✈️' },
  { id: 'smsa', name: 'SMSA Express', nameAr: 'سمسا إكسبرس', logo: '🚚' },
  { id: 'naqel', name: 'Naqel Express', nameAr: 'ناقل إكسبرس', logo: '🐪' },
  { id: 'fetchr', name: 'Fetchr', nameAr: 'فيتشر', logo: '📍' },
  { id: 'spl', name: 'SPL', nameAr: 'إس بي إل', logo: '📮' },
] as const;

// ============================================================================
// Classifieds Categories
// ============================================================================

export const CLASSIFIEDS_CATEGORIES = [
  { id: 'Electronics', icon: 'Smartphone', color: 'from-blue-500 to-cyan-500', nameAr: 'إلكترونيات' },
  { id: 'Fashion', icon: 'Shirt', color: 'from-pink-500 to-rose-500', nameAr: 'أزياء' },
  { id: 'Home & Garden', icon: 'Home', color: 'from-amber-500 to-orange-500', nameAr: 'منزل وحديقة' },
  { id: 'Beauty', icon: 'Sparkles', color: 'from-purple-500 to-fuchsia-500', nameAr: 'تجميل' },
  { id: 'Gaming', icon: 'Gamepad2', color: 'from-red-500 to-pink-500', nameAr: 'ألعاب' },
  { id: 'Motors', icon: 'Car', color: 'from-gray-600 to-gray-800', nameAr: 'سيارات' },
  { id: 'Sports', icon: 'Dumbbell', color: 'from-green-500 to-lime-500', nameAr: 'رياضة' },
  { id: 'Books', icon: 'BookOpen', color: 'from-yellow-600 to-amber-600', nameAr: 'كتب' },
  { id: 'Kids & Baby', icon: 'Baby', color: 'from-sky-400 to-blue-400', nameAr: 'أطفال' },
  { id: 'Art & Collectibles', icon: 'Palette', color: 'from-indigo-500 to-violet-500', nameAr: 'فن ومقتنيات' },
  { id: 'Pets', icon: 'Dog', color: 'from-orange-400 to-amber-400', nameAr: 'حيوانات' },
  { id: 'Jobs', icon: 'Briefcase', color: 'from-teal-500 to-emerald-500', nameAr: 'وظائف' },
  { id: 'Health', icon: 'Pill', color: 'from-red-400 to-rose-400', nameAr: 'صحة' },
  { id: 'Education', icon: 'GraduationCap', color: 'from-blue-600 to-indigo-600', nameAr: 'تعليم' },
  { id: 'Food', icon: 'Utensils', color: 'from-amber-500 to-yellow-500', nameAr: 'طعام' },
] as const;

/** Near-me category filters */
export const NEAR_ME_CATEGORY_FILTERS = [
  { key: 'all', label: 'All', labelAr: 'الكل', icon: '🔍' },
  { key: 'Cars', label: 'Cars', labelAr: 'سيارات', icon: '🚗' },
  { key: 'Electronics', label: 'Electronics', labelAr: 'إلكترونيات', icon: '📱' },
  { key: 'Fashion', label: 'Fashion', labelAr: 'أزياء', icon: '👗' },
  { key: 'Home', label: 'Home', labelAr: 'المنزل', icon: '🏠' },
  { key: 'Services', label: 'Services', labelAr: 'خدمات', icon: '🔧' },
] as const;

/** Classifieds city list (for Select dropdowns) */
export const CLASSIFIEDS_CITIES = [
  { id: 'dubai', name: 'Dubai', nameAr: 'دبي' },
  { id: 'riyadh', name: 'Riyadh', nameAr: 'الرياض' },
  { id: 'cairo', name: 'Cairo', nameAr: 'القاهرة' },
  { id: 'amman', name: 'Amman', nameAr: 'عمان' },
  { id: 'baghdad', name: 'Baghdad', nameAr: 'بغداد' },
  { id: 'kuwait', name: 'Kuwait City', nameAr: 'الكويت' },
  { id: 'doha', name: 'Doha', nameAr: 'الدوحة' },
  { id: 'beirut', name: 'Beirut', nameAr: 'بيروت' },
  { id: 'muscat', name: 'Muscat', nameAr: 'مسقط' },
  { id: 'manama', name: 'Manama', nameAr: 'المنامة' },
  { id: 'casablanca', name: 'Casablanca', nameAr: 'الدار البيضاء' },
  { id: 'tunis', name: 'Tunis', nameAr: 'تونس' },
] as const;

// ============================================================================
// Property Reference Data
// ============================================================================

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment', labelAr: 'شقة', icon: 'Building2' },
  { value: 'villa', label: 'Villa', labelAr: 'فيلا', icon: 'Home' },
  { value: 'house', label: 'House', labelAr: 'منزل', icon: 'Home' },
  { value: 'land', label: 'Land', labelAr: 'أراضي', icon: 'Landmark' },
  { value: 'commercial', label: 'Commercial', labelAr: 'تجاري', icon: 'Store' },
  { value: 'office', label: 'Office', labelAr: 'مكتب', icon: 'Building2' },
] as const;

export const PROPERTY_TYPE_GRADIENTS: Record<string, string> = {
  apartment: 'from-teal-500 to-cyan-600',
  villa: 'from-emerald-500 to-green-600',
  house: 'from-orange-500 to-red-600',
  land: 'from-violet-500 to-purple-600',
  commercial: 'from-amber-500 to-orange-600',
  office: 'from-cyan-500 to-sky-600',
};

// ============================================================================
// Service Categories
// ============================================================================

export const SERVICE_CATEGORIES = [
  { value: 'Cleaning', label: 'Cleaning', labelAr: 'تنظيف', icon: 'Droplets', gradient: 'from-cyan-500 to-sky-600' },
  { value: 'Maintenance', label: 'Maintenance', labelAr: 'صيانة', icon: 'Settings2', gradient: 'from-orange-500 to-amber-600' },
  { value: 'Education', label: 'Education', labelAr: 'تعليم', icon: 'GraduationCap', gradient: 'from-violet-500 to-purple-600' },
  { value: 'Health', label: 'Health', labelAr: 'خدمات صحية', icon: 'HeartPulse', gradient: 'from-red-500 to-rose-600' },
  { value: 'Legal', label: 'Legal', labelAr: 'خدمات قانونية', icon: 'Scale', gradient: 'from-amber-500 to-yellow-600' },
  { value: 'IT & Tech', label: 'IT & Tech', labelAr: 'تقنية ومعلومات', icon: 'Monitor', gradient: 'from-teal-500 to-cyan-600' },
  { value: 'Home Improvement', label: 'Home Improvement', labelAr: 'تحسين المنزل', icon: 'Hammer', gradient: 'from-emerald-500 to-green-600' },
  { value: 'Event Planning', label: 'Event Planning', labelAr: 'تخطيط فعاليات', icon: 'PartyPopper', gradient: 'from-pink-500 to-fuchsia-600' },
  { value: 'Transport', label: 'Transport', labelAr: 'نقل', icon: 'Truck', gradient: 'from-lime-500 to-green-600' },
  { value: 'Beauty', label: 'Beauty', labelAr: 'خدمات تجميل', icon: 'Scissors', gradient: 'from-fuchsia-500 to-pink-600' },
] as const;

export const SERVICE_CATEGORY_GRADIENTS: Record<string, string> = Object.fromEntries(
  SERVICE_CATEGORIES.map(c => [c.value, c.gradient])
);

export const PRICE_UNIT_LABELS: Record<string, { en: string; ar: string }> = {
  'hour': { en: '/hr', ar: '/ساعة' },
  'visit': { en: '/visit', ar: '/زيارة' },
  'consultation': { en: '/consultation', ar: '/استشارة' },
  'service': { en: '/service', ar: '/خدمة' },
};

// ============================================================================
// Job Reference Data
// ============================================================================

export const JOB_TYPES = [
  { value: 'full-time', label: 'Full-time', labelAr: 'دوام كامل', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  { value: 'part-time', label: 'Part-time', labelAr: 'دوام جزئي', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  { value: 'remote', label: 'Remote', labelAr: 'عن بعد', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400' },
  { value: 'contract', label: 'Contract', labelAr: 'عقد', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  { value: 'freelance', label: 'Freelance', labelAr: 'حر', color: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400' },
  { value: 'hybrid', label: 'Hybrid', labelAr: 'هجين', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400' },
] as const;

export const JOB_CATEGORY_ICONS: Record<string, string> = {
  'IT': 'Monitor',
  'Marketing': 'TrendingUp',
  'Finance': 'DollarSign',
  'Engineering': 'Building2',
  'Healthcare': 'Stethoscope',
  'Education': 'GraduationCap',
  'Design': 'Palette',
  'Sales': 'Phone',
};

export const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level', labelAr: 'مبتدئ', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
  { value: 'mid', label: 'Mid Level', labelAr: 'متوسط', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  { value: 'senior', label: 'Senior', labelAr: 'خبير', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' },
  { value: 'executive', label: 'Executive', labelAr: 'تنفيذي', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
] as const;

// ============================================================================
// Deal Categories
// ============================================================================

export const DEAL_CATEGORIES = [
  { value: 'all', label: 'All', labelAr: 'الكل' },
  { value: 'electronics', label: 'Electronics', labelAr: 'إلكترونيات' },
  { value: 'fashion', label: 'Fashion', labelAr: 'أزياء' },
  { value: 'home', label: 'Home', labelAr: 'المنزل' },
  { value: 'beauty', label: 'Beauty', labelAr: 'الجمال' },
  { value: 'sports', label: 'Sports', labelAr: 'رياضة' },
] as const;

export const DEAL_CATEGORY_ICONS: Record<string, string> = {
  electronics: 'Monitor',
  fashion: 'Shirt',
  home: 'Home',
  beauty: 'Flower2',
  sports: 'Dumbbell',
};

export const DEAL_CATEGORY_GRADIENTS: Record<string, { light: string; dark: string; iconColor: string }> = {
  electronics: { light: 'from-blue-100 via-cyan-100 to-teal-100', dark: 'dark:from-blue-950 dark:via-cyan-950 dark:to-teal-950', iconColor: 'text-blue-400 dark:text-blue-600' },
  fashion: { light: 'from-pink-100 via-rose-100 to-fuchsia-100', dark: 'dark:from-pink-950 dark:via-rose-950 dark:to-fuchsia-950', iconColor: 'text-pink-400 dark:text-pink-600' },
  home: { light: 'from-amber-100 via-orange-100 to-yellow-100', dark: 'dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950', iconColor: 'text-amber-400 dark:text-amber-600' },
  beauty: { light: 'from-purple-100 via-fuchsia-100 to-pink-100', dark: 'dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950', iconColor: 'text-purple-400 dark:text-purple-600' },
  sports: { light: 'from-green-100 via-lime-100 to-emerald-100', dark: 'dark:from-green-950 dark:via-lime-950 dark:to-emerald-950', iconColor: 'text-green-400 dark:text-green-600' },
};

// ============================================================================
// Auction Categories
// ============================================================================

export const AUCTION_CATEGORIES = [
  { value: 'all', label: 'All', labelAr: 'الكل' },
  { value: 'electronics', label: 'Electronics', labelAr: 'إلكترونيات' },
  { value: 'fashion', label: 'Fashion', labelAr: 'أزياء' },
  { value: 'art', label: 'Art', labelAr: 'فن' },
  { value: 'collectibles', label: 'Collectibles', labelAr: 'مقتنيات' },
  { value: 'jewelry', label: 'Jewelry', labelAr: 'مجوهرات' },
] as const;

export const AUCTION_CATEGORY_ICONS: Record<string, string> = {
  electronics: 'Monitor',
  fashion: 'Shirt',
  art: 'Palette',
  collectibles: 'Trophy',
  jewelry: 'Gem',
};

export const AUCTION_CATEGORY_GRADIENTS: Record<string, { light: string; dark: string; iconColor: string }> = {
  electronics: { light: 'from-blue-100 via-cyan-100 to-teal-100', dark: 'dark:from-blue-950 dark:via-cyan-950 dark:to-teal-950', iconColor: 'text-blue-500 dark:text-blue-400' },
  fashion: { light: 'from-pink-100 via-rose-100 to-fuchsia-100', dark: 'dark:from-pink-950 dark:via-rose-950 dark:to-fuchsia-950', iconColor: 'text-pink-500 dark:text-pink-400' },
  art: { light: 'from-purple-100 via-violet-100 to-indigo-100', dark: 'dark:from-purple-950 dark:via-violet-950 dark:to-indigo-950', iconColor: 'text-purple-500 dark:text-purple-400' },
  collectibles: { light: 'from-amber-100 via-yellow-100 to-orange-100', dark: 'dark:from-amber-950 dark:via-yellow-950 dark:to-orange-950', iconColor: 'text-amber-500 dark:text-amber-400' },
  jewelry: { light: 'from-emerald-100 via-teal-100 to-cyan-100', dark: 'dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950', iconColor: 'text-emerald-500 dark:text-emerald-400' },
};

// ============================================================================
// Wholesale Categories
// ============================================================================

export const WHOLESALE_CATEGORIES = [
  { value: 'all', label: 'All', labelAr: 'الكل' },
  { value: 'electronics', label: 'Electronics', labelAr: 'إلكترونيات' },
  { value: 'fashion', label: 'Fashion', labelAr: 'أزياء' },
  { value: 'home', label: 'Home', labelAr: 'المنزل' },
  { value: 'beauty', label: 'Beauty', labelAr: 'الجمال' },
] as const;

export const WHOLESALE_CATEGORY_ICONS: Record<string, string> = {
  electronics: 'Monitor',
  fashion: 'Shirt',
  home: 'Home',
  beauty: 'Flower2',
};

export const WHOLESALE_CATEGORY_GRADIENTS: Record<string, { light: string; dark: string; iconColor: string }> = {
  electronics: { light: 'from-blue-100 via-cyan-100 to-teal-100', dark: 'dark:from-blue-950 dark:via-cyan-950 dark:to-teal-950', iconColor: 'text-blue-500 dark:text-blue-400' },
  fashion: { light: 'from-pink-100 via-rose-100 to-fuchsia-100', dark: 'dark:from-pink-950 dark:via-rose-950 dark:to-fuchsia-950', iconColor: 'text-pink-500 dark:text-pink-400' },
  home: { light: 'from-amber-100 via-orange-100 to-yellow-100', dark: 'dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950', iconColor: 'text-amber-500 dark:text-amber-400' },
  beauty: { light: 'from-purple-100 via-fuchsia-100 to-pink-100', dark: 'dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950', iconColor: 'text-purple-500 dark:text-purple-400' },
};

// ============================================================================
// Body Type Gradients (for car listings)
// ============================================================================

export const BODY_TYPE_GRADIENTS: Record<string, string> = {
  sedan: 'from-slate-500 to-gray-600',
  suv: 'from-emerald-500 to-green-600',
  hatchback: 'from-teal-500 to-cyan-600',
  pickup: 'from-amber-500 to-orange-600',
  coupe: 'from-rose-500 to-pink-600',
  van: 'from-sky-500 to-blue-600',
};

// ============================================================================
// Category Gradients & Icons
// ============================================================================

export const CATEGORY_GRADIENTS: Record<string, string> = {
  electronics: 'from-blue-500 to-cyan-500',
  fashion: 'from-pink-500 to-rose-500',
  'home-garden': 'from-amber-500 to-orange-500',
  beauty: 'from-purple-500 to-fuchsia-500',
  sports: 'from-green-500 to-emerald-500',
  toys: 'from-yellow-500 to-amber-500',
  automotive: 'from-red-500 to-rose-500',
  books: 'from-indigo-500 to-violet-500',
  food: 'from-emerald-500 to-teal-500',
  jewelry: 'from-rose-500 to-pink-500',
};

export const CATEGORY_ICONS: Record<string, string> = {
  electronics: 'Smartphone',
  fashion: 'Shirt',
  'home-garden': 'Home',
  beauty: 'Sparkles',
  sports: 'Dumbbell',
  toys: 'Gamepad2',
  automotive: 'Car',
  books: 'BookOpen',
  food: 'ShoppingBasket',
  jewelry: 'Watch',
};

// ============================================================================
// Helper: Get label for a value from a reference array
// ============================================================================

export function getRefLabel<T extends ReadonlyArray<{ value: string; label: string; labelAr: string }>>(
  items: T,
  value: string,
  isRTL: boolean,
): string {
  const item = items.find(i => i.value === value);
  if (item) return isRTL ? item.labelAr : item.label;
  return value;
}
