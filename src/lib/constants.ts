export const APP_NAME = "AngkorEV";

/**
 * Indicative display rate only. Cambodian listings are USD-denominated and buyers
 * settle in either currency; this is never used for a transaction amount.
 * Replace with a licensed FX feed before enabling checkout.
 */
export const KHR_PER_USD = Number(process.env.KHR_PER_USD ?? 4100);

export const PROVINCES = [
  "Phnom Penh",
  "Siem Reap",
  "Battambang",
  "Sihanoukville",
  "Kampot",
  "Kandal",
  "Kampong Cham",
  "Kampong Speu",
  "Kampong Chhnang",
  "Kampong Thom",
  "Prey Veng",
  "Takeo",
  "Svay Rieng",
  "Banteay Meanchey",
  "Pursat",
  "Koh Kong",
  "Ratanakiri",
  "Mondulkiri",
  "Kratie",
  "Stung Treng",
  "Preah Vihear",
  "Oddar Meanchey",
  "Pailin",
  "Kep",
  "Preah Sihanouk",
] as const;

export const MAKES: { name: string; km: string }[] = [
  { name: "Toyota", km: "តូយ៉ូតា" },
  { name: "Lexus", km: "ឡិចសឺស" },
  { name: "Honda", km: "ហុងដា" },
  { name: "Ford", km: "ហ្វដ" },
  { name: "Mazda", km: "ម៉ាសដា" },
  { name: "Hyundai", km: "ហ្យុនដេ" },
  { name: "Kia", km: "គីយ៉ា" },
  { name: "Mercedes-Benz", km: "ម៉ឺសេដេស-បេនហ្ស" },
  { name: "BMW", km: "ប៊ីអឹមឌុបប្លូ" },
  { name: "BYD", km: "ប៊ីយ៉ាឌី" },
  { name: "Nissan", km: "នីស្សាន" },
  { name: "Mitsubishi", km: "មីស៊ូប៊ីស៊ី" },
  { name: "Isuzu", km: "អ៊ីស៊ូស៊ូ" },
  { name: "MG", km: "អឹមជី" },
  { name: "Land Rover", km: "ឡែនរ៉ូវឺរ" },
];

export const BODY_TYPES = ["SUV", "SEDAN", "PICKUP", "HATCHBACK", "MINIVAN", "COUPE"] as const;
export const TRANSMISSIONS = ["AUTOMATIC", "MANUAL"] as const;
export const FUEL_TYPES = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG"] as const;
export const DRIVETRAINS = ["FWD", "RWD", "AWD", "4WD"] as const;

export const DOCUMENT_TYPES = [
  "REGISTRATION",
  "IMPORT_DECLARATION",
  "OWNERSHIP_TRANSFER",
  "SERVICE_RECORD",
  "INSPECTION_REPORT",
  "OTHER",
] as const;

export const DOCUMENT_TYPE_LABELS: Record<string, { en: string; km: string }> = {
  REGISTRATION: { en: "Vehicle registration card", km: "កាតចុះបញ្ជីយានយន្ត" },
  IMPORT_DECLARATION: { en: "Import / customs declaration", km: "ឯកសារនាំចូល / គយ" },
  OWNERSHIP_TRANSFER: { en: "Ownership transfer record", km: "ឯកសារផ្ទេរកម្មសិទ្ធិ" },
  SERVICE_RECORD: { en: "Service / maintenance record", km: "កំណត់ត្រាថែទាំ" },
  INSPECTION_REPORT: { en: "Inspection report", km: "របាយការណ៍ត្រួតពិនិត្យ" },
  OTHER: { en: "Other document", km: "ឯកសារផ្សេងទៀត" },
};

export const LISTING_STATUSES = [
  "DRAFT",
  "PENDING",
  "PUBLISHED",
  "REJECTED",
  "SOLD",
  "ARCHIVED",
] as const;

export const SEARCH_SORTS = ["relevance", "newest", "price_asc", "price_desc", "mileage_asc", "year_desc"] as const;

export const MAX_COMPARE = 3;
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const SAFETY_NOTICE =
  "Never send a deposit before you have seen the car and its original registration documents. AngkorEV does not hold buyer funds and never asks for payment by chat.";
