import { z } from "zod";
import { BODY_TYPES, DOCUMENT_TYPES, FUEL_TYPES, PROVINCES, TRANSMISSIONS, DRIVETRAINS } from "./constants";

const currentYear = new Date().getFullYear();

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(200);
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "Password is too long.")
  .regex(/[a-zA-Z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email: emailSchema,
  phone: z.string().trim().min(8, "Enter a valid phone number.").max(30).optional().or(z.literal("")),
  password: passwordSchema,
  accountType: z.enum(["BUYER", "SELLER", "DEALER"]).default("BUYER"),
  dealerName: z.string().trim().max(150).optional(),
  locale: z.enum(["en", "km"]).default("en"),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Please accept the marketplace rules." }) }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

export const otpRequestSchema = z.object({
  phone: z.string().trim().min(8).max(30),
  purpose: z.enum(["REGISTER", "RECOVERY"]),
});

/** Cambodian mobile numbers: +855 / 855 / 0 followed by 8–9 digits across common prefixes. */
export const khmerPhoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(?:\+855|855|0)(?:1|2|3|6|7|8|9)\d{6,8}$/.test(v), "Enter a Cambodian phone number, e.g. 012 345 678.");

export const vehicleSchema = z.object({
  make: z.string().trim().min(1, "Select the make.").max(60),
  model: z.string().trim().min(1, "Enter the model.").max(80),
  variant: z.string().trim().max(80).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1980, "Year is too old.").max(currentYear + 1),
  registrationYear: z.coerce.number().int().min(1980).max(currentYear + 1).optional().nullable(),
  mileageKm: z.coerce.number().int().min(0).max(1_500_000),
  transmission: z.enum(TRANSMISSIONS),
  fuelType: z.enum(FUEL_TYPES),
  engineCc: z.coerce.number().int().min(50).max(10_000).optional().nullable(),
  drivetrain: z.enum(DRIVETRAINS).optional().nullable(),
  bodyType: z.enum(BODY_TYPES),
  exteriorColor: z.string().trim().max(40).optional().or(z.literal("")),
  interiorColor: z.string().trim().max(40).optional().or(z.literal("")),
  seats: z.coerce.number().int().min(1).max(60).optional().nullable(),
  vin: z.string().trim().toUpperCase().max(17).optional().or(z.literal("")),
  chassisNumber: z.string().trim().toUpperCase().max(40).optional().or(z.literal("")),
  plateNumber: z.string().trim().toUpperCase().max(20).optional().or(z.literal("")),
  importCountry: z.string().trim().max(60).optional().or(z.literal("")),
  accidentClaim: z.enum(["NONE_REPORTED", "MINOR_REPAIR", "MAJOR_REPAIR", "UNKNOWN"]).optional(),
  maintenanceClaim: z.enum(["FULL_HISTORY", "PARTIAL", "NONE", "UNKNOWN"]).optional(),
});

export const listingSchema = z.object({
  vehicle: vehicleSchema,
  priceUsd: z.coerce.number().int().min(200, "Price looks too low.").max(2_000_000),
  negotiable: z.boolean().default(true),
  province: z.enum(PROVINCES),
  district: z.string().trim().max(80).optional().or(z.literal("")),
  descriptionEn: z.string().trim().min(40, "Write at least 40 characters so buyers can compare.").max(4000),
  descriptionKm: z.string().trim().max(4000).optional().or(z.literal("")),
  ownershipDocStatus: z.enum(["ORIGINAL_AVAILABLE", "COPY_ONLY", "NOT_PROVIDED"]).default("NOT_PROVIDED"),
  importDocStatus: z.enum(["AVAILABLE", "NOT_PROVIDED"]).default("NOT_PROVIDED"),
  inspectionAvailable: z.boolean().default(false),
  inspectionNote: z.string().trim().max(500).optional().or(z.literal("")),
  images: z.array(z.object({ url: z.string().min(1).max(500), hash: z.string().max(64).optional(), alt: z.string().max(160).optional() })).max(12).default([]),
  publish: z.boolean().default(false),
});

export const listingUpdateSchema = listingSchema.partial();

export const documentSchema = z.object({
  type: z.enum(DOCUMENT_TYPES),
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  fileSize: z.coerce.number().int().min(1).max(10 * 1024 * 1024),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const inquirySchema = z.object({
  message: z.string().trim().min(10, "Add a short message for the seller.").max(2000),
  appointmentAt: z.string().datetime().optional().nullable(),
  intent: z.enum(["QUESTION", "VIEWING", "INSPECTION"]).default("QUESTION"),
});

export const offerSchema = z.object({
  amountUsd: z.coerce.number().int().min(200).max(2_000_000),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const reportRequestSchema = z.object({
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required to process the vehicle data." }) }),
  listingId: z.string().optional(),
});

export const reportSchema = z.object({
  reason: z.enum(["INCORRECT_INFO", "HIDDEN_DAMAGE", "SUSPECTED_FRAUD", "DUPLICATE_LISTING", "SOLD_ELSEWHERE", "OTHER"]),
  details: z.string().trim().max(1500).optional().or(z.literal("")),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Write a message.").max(2000),
});

export const savedSearchSchema = z.object({
  name: z.string().trim().min(1).max(80),
  query: z.string().max(500),
});

export const moderationSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "SUSPEND", "REINSTATE", "DISMISS", "RESOLVE"]),
  reason: z.string().trim().max(500).optional(),
});
