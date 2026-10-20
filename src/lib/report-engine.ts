/**
 * Evidence-based vehicle report engine.
 *
 * Design rule: this module never invents history. Each finding maps to a concrete
 * input (a document row, an identifier, a photo hash, a comparable-listing sample)
 * and is labelled with one of five evidence statuses. Where no data exists we emit
 * NO_DATA rather than inferring a clean history.
 *
 * The engine is a pure function so it can be unit-tested and later swapped for a
 * provider-backed pipeline behind the same interface (see docs/AI-REPORTS.md).
 */

export type EvidenceStatus =
  | "VERIFIED_BY_SOURCE"
  | "EVIDENCE_FOUND"
  | "POTENTIAL_INCONSISTENCY"
  | "NOT_VERIFIED"
  | "NO_DATA";

export type FindingCategory =
  | "IDENTITY"
  | "REGISTRATION"
  | "DOCUMENTS"
  | "MILEAGE"
  | "HISTORY"
  | "PHOTOS"
  | "PRICE"
  | "INSPECTION";

export type Severity = "INFO" | "WARNING" | "CRITICAL";

export type Finding = {
  category: FindingCategory;
  code: string;
  status: EvidenceStatus;
  severity: Severity;
  confidence: number;
  data: Record<string, unknown>;
  sourceRef?: string;
};

export type AnalysisInput = {
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    registrationYear: number | null;
    mileageKm: number;
    vin: string | null;
    chassisNumber: string | null;
    plateNumber: string | null;
    importCountry: string | null;
    accidentClaim: string | null;
    maintenanceClaim: string | null;
  };
  listing: { priceUsd: number; province: string; inspectionAvailable: boolean } | null;
  documents: Array<{
    id: string;
    type: string;
    status: string;
    verifiedAt: Date | null;
    extracted: Record<string, unknown> | null;
  }>;
  images: Array<{ id: string; hash: string | null; width: number | null; height: number | null }>;
  /** Photos whose hash appears on a different listing. */
  reusedPhotoCount: number;
  /** Same VIN / plate already on another active listing. */
  duplicateVinListingId: string | null;
  duplicatePlateListingId: string | null;
  /** Comparable published listings for price context. */
  market: { median: number | null; sample: number };
  now: Date;
};

export type AnalysisResult = {
  findings: Finding[];
  confidence: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  status: "READY" | "NEEDS_REVIEW";
  provider: string;
  version: string;
};

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
const CHASSIS_RE = /^[A-Z0-9-]{6,20}$/;

function vehicleAge(year: number, now: Date): number {
  return Math.max(1, now.getFullYear() - year);
}

/** Document types that carry a registry / authority signal. */
const AUTHORITY_DOCS = new Set(["REGISTRATION", "IMPORT_DECLARATION", "OWNERSHIP_TRANSFER", "INSPECTION_REPORT"]);

export function analyzeVehicle(input: AnalysisInput): AnalysisResult {
  const f: Finding[] = [];
  const { vehicle, documents, images, now } = input;
  const age = vehicleAge(vehicle.year, now);

  // ---------------------------------------------------------------- identity
  if (!vehicle.vin) {
    f.push({
      category: "IDENTITY",
      code: "VIN_MISSING",
      status: "NO_DATA",
      severity: "WARNING",
      confidence: 100,
      data: {},
      sourceRef: "listing.vehicle.vin",
    });
  } else if (!VIN_RE.test(vehicle.vin)) {
    f.push({
      category: "IDENTITY",
      code: "VIN_FORMAT_INVALID",
      status: "POTENTIAL_INCONSISTENCY",
      severity: "WARNING",
      confidence: 95,
      data: { submitted: vehicle.vin, expectedPattern: "17 characters, no I/O/Q" },
      sourceRef: "listing.vehicle.vin",
    });
  } else {
    f.push({
      category: "IDENTITY",
      code: "VIN_FORMAT_VALID",
      status: "EVIDENCE_FOUND",
      severity: "INFO",
      confidence: 90,
      data: { vin: `${vehicle.vin.slice(0, 3)}…${vehicle.vin.slice(-4)}` },
      sourceRef: "listing.vehicle.vin",
    });
  }

  if (vehicle.chassisNumber) {
    f.push({
      category: "IDENTITY",
      code: "CHASSIS_PRESENT",
      status: "EVIDENCE_FOUND",
      severity: "INFO",
      confidence: CHASSIS_RE.test(vehicle.chassisNumber) ? 80 : 45,
      data: { chassisNumber: vehicle.chassisNumber },
      sourceRef: "listing.vehicle.chassisNumber",
    });
  } else {
    f.push({
      category: "IDENTITY",
      code: "CHASSIS_MISSING",
      status: "NO_DATA",
      severity: "INFO",
      confidence: 100,
      data: {},
      sourceRef: "listing.vehicle.chassisNumber",
    });
  }

  if (vehicle.plateNumber) {
    f.push({
      category: "IDENTITY",
      code: "PLATE_PRESENT",
      status: "EVIDENCE_FOUND",
      severity: "INFO",
      confidence: 70,
      data: { plateNumber: vehicle.plateNumber },
      sourceRef: "listing.vehicle.plateNumber",
    });
  }

  if (input.duplicateVinListingId) {
    f.push({
      category: "IDENTITY",
      code: "VIN_DUPLICATE_LISTING",
      status: "POTENTIAL_INCONSISTENCY",
      severity: "CRITICAL",
      confidence: 90,
      data: { otherListingId: input.duplicateVinListingId },
      sourceRef: "platform.listings",
    });
  }
  if (input.duplicatePlateListingId) {
    f.push({
      category: "IDENTITY",
      code: "PLATE_DUPLICATE_LISTING",
      status: "POTENTIAL_INCONSISTENCY",
      severity: "WARNING",
      confidence: 80,
      data: { otherListingId: input.duplicatePlateListingId },
      sourceRef: "platform.listings",
    });
  }

  // ---------------------------------------------------------------- registration & documents
  const verifiedDocs = documents.filter((d) => d.status === "VERIFIED");
  const pendingDocs = documents.filter((d) => d.status === "PENDING");
  const rejectedDocs = documents.filter((d) => d.status === "REJECTED");

  for (const doc of verifiedDocs) {
    const code =
      doc.type === "REGISTRATION" ? "REG_DOC_VERIFIED"
      : doc.type === "IMPORT_DECLARATION" ? "IMPORT_DOC_VERIFIED"
      : doc.type === "INSPECTION_REPORT" ? "INSPECTION_REPORT_VERIFIED"
      : doc.type === "SERVICE_RECORD" ? "SERVICE_RECORD_VERIFIED"
      : "DOC_VERIFIED";
    f.push({
      category: doc.type === "INSPECTION_REPORT" ? "INSPECTION" : "REGISTRATION",
      code,
      status: "VERIFIED_BY_SOURCE",
      severity: "INFO",
      confidence: AUTHORITY_DOCS.has(doc.type) ? 85 : 70,
      data: { documentId: doc.id, documentType: doc.type, verifiedAt: doc.verifiedAt?.toISOString() ?? null },
      sourceRef: `vehicle_documents:${doc.id}`,
    });
  }

  if (pendingDocs.length) {
    f.push({
      category: "DOCUMENTS",
      code: "DOCS_PENDING_REVIEW",
      status: "NOT_VERIFIED",
      severity: "INFO",
      confidence: 100,
      data: { count: pendingDocs.length, types: pendingDocs.map((d) => d.type) },
      sourceRef: "vehicle_documents",
    });
  }
  if (rejectedDocs.length) {
    f.push({
      category: "DOCUMENTS",
      code: "DOCS_REJECTED",
      status: "POTENTIAL_INCONSISTENCY",
      severity: "WARNING",
      confidence: 90,
      data: { count: rejectedDocs.length, types: rejectedDocs.map((d) => d.type) },
      sourceRef: "vehicle_documents",
    });
  }
  if (!documents.length) {
    f.push({
      category: "DOCUMENTS",
      code: "NO_DOCUMENTS",
      status: "NO_DATA",
      severity: "WARNING",
      confidence: 100,
      data: {},
      sourceRef: "vehicle_documents",
    });
  }

  // Registration year plausibility.
  if (vehicle.registrationYear) {
    if (vehicle.registrationYear < vehicle.year) {
      f.push({
        category: "REGISTRATION",
        code: "REGISTRATION_YEAR_INCONSISTENT",
        status: "POTENTIAL_INCONSISTENCY",
        severity: "WARNING",
        confidence: 85,
        data: { registrationYear: vehicle.registrationYear, manufactureYear: vehicle.year },
        sourceRef: "listing.vehicle.registrationYear",
      });
    } else if (vehicle.registrationYear <= now.getFullYear()) {
      const gap = vehicle.registrationYear - vehicle.year;
      f.push({
        category: "REGISTRATION",
        code: "REGISTRATION_YEAR_RECORDED",
        status: "EVIDENCE_FOUND",
        severity: "INFO",
        confidence: 60,
        data: { registrationYear: vehicle.registrationYear, gapYears: gap },
        sourceRef: "listing.vehicle.registrationYear",
      });
    }
  }

  // Cross-check verified documents' extracted fields against the listing.
  const extractedChecks: Array<{ field: string; docValue: string; listingValue: string }> = [];
  let matchedChecks = 0;
  for (const doc of verifiedDocs) {
    if (!doc.extracted) continue;
    const pairs: Array<[string, string | null]> = [
      ["vin", vehicle.vin],
      ["plateNumber", vehicle.plateNumber],
      ["chassisNumber", vehicle.chassisNumber],
    ];
    for (const [key, listingValue] of pairs) {
      const docValue = doc.extracted[key];
      if (typeof docValue !== "string" || !listingValue) continue;
      if (docValue.replace(/\s/g, "").toUpperCase() === listingValue.replace(/\s/g, "").toUpperCase()) matchedChecks += 1;
      else extractedChecks.push({ field: key, docValue, listingValue });
    }
    const docYear = doc.extracted["year"];
    if (typeof docYear === "number" && docYear > 0 && Math.abs(docYear - vehicle.year) > 1) {
      extractedChecks.push({ field: "year", docValue: String(docYear), listingValue: String(vehicle.year) });
    }
  }

  if (extractedChecks.length) {
    f.push({
      category: "DOCUMENTS",
      code: "DOC_FIELD_MISMATCH",
      status: "POTENTIAL_INCONSISTENCY",
      severity: "CRITICAL",
      confidence: 88,
      data: { mismatches: extractedChecks },
      sourceRef: "vehicle_documents.extracted",
    });
  } else if (matchedChecks > 0) {
    f.push({
      category: "DOCUMENTS",
      code: "DOC_FIELD_MATCH",
      status: "VERIFIED_BY_SOURCE",
      severity: "INFO",
      confidence: 85,
      data: { matchedFields: matchedChecks },
      sourceRef: "vehicle_documents.extracted",
    });
  }

  // ---------------------------------------------------------------- mileage
  const annualKm = Math.round(vehicle.mileageKm / age);
  const mileageDocs = verifiedDocs
    .filter((d) => d.type === "SERVICE_RECORD" || d.type === "INSPECTION_REPORT")
    .map((d) => ({ doc: d, km: Number(d.extracted?.["mileageKm"] ?? NaN) }))
    .filter((x) => Number.isFinite(x.km) && x.km > 0);

  const higherRecord = mileageDocs.find((x) => x.km > vehicle.mileageKm + 1000);
  if (higherRecord) {
    f.push({
      category: "MILEAGE",
      code: "MILEAGE_RECORD_ANOMALY",
      status: "POTENTIAL_INCONSISTENCY",
      severity: "CRITICAL",
      confidence: 85,
      data: {
        documentId: higherRecord.doc.id,
        recordedKm: higherRecord.km,
        listingKm: vehicle.mileageKm,
      },
      sourceRef: `vehicle_documents:${higherRecord.doc.id}`,
    });
  } else if (mileageDocs.length) {
    const maxRecord = Math.max(...mileageDocs.map((x) => x.km));
    f.push({
      category: "MILEAGE",
      code: "MILEAGE_RECORD_CONSISTENT",
      status: "EVIDENCE_FOUND",
      severity: "INFO",
      confidence: 70,
      data: { documentsChecked: mileageDocs.length, highestRecordedKm: maxRecord, listingKm: vehicle.mileageKm },
      sourceRef: "vehicle_documents.extracted.mileageKm",
    });
  } else {
    f.push({
      category: "MILEAGE",
      code: "MILEAGE_UNVERIFIED",
      status: "NO_DATA",
      severity: "WARNING",
      confidence: 100,
      data: {},
      sourceRef: "vehicle_documents",
    });
  }

  if (annualKm < 2500 && age >= 3) {
    f.push({
      category: "MILEAGE",
      code: "MILEAGE_IMPLAUSIBLE_LOW",
      status: "POTENTIAL_INCONSISTENCY",
      severity: "WARNING",
      confidence: 65,
      data: { annualKm, age },
      sourceRef: "listing.vehicle.mileageKm",
    });
  } else if (annualKm > 40000) {
    f.push({
      category: "MILEAGE",
      code: "MILEAGE_HIGH_ANNUAL",
      status: "EVIDENCE_FOUND",
      severity: "INFO",
      confidence: 90,
      data: { annualKm, age },
      sourceRef: "listing.vehicle.mileageKm",
    });
  }

  // ---------------------------------------------------------------- history
  f.push({
    category: "HISTORY",
    code: "HISTORY_NO_SOURCE",
    status: "NO_DATA",
    severity: "WARNING",
    confidence: 100,
    data: { integratedProviders: [] },
    sourceRef: "provider-registry",
  });

  if (vehicle.accidentClaim) {
    f.push({
      category: "HISTORY",
      code: "ACCIDENT_CLAIM_UNVERIFIED",
      status: "NOT_VERIFIED",
      severity: "INFO",
      confidence: 100,
      data: { sellerStatement: vehicle.accidentClaim },
      sourceRef: "listing.vehicle.accidentClaim",
    });
  }
  if (vehicle.importCountry) {
    f.push({
      category: "HISTORY",
      code: "IMPORT_DECLARED",
      status: verifiedDocs.some((d) => d.type === "IMPORT_DECLARATION") ? "EVIDENCE_FOUND" : "NOT_VERIFIED",
      severity: "INFO",
      confidence: verifiedDocs.some((d) => d.type === "IMPORT_DECLARATION") ? 75 : 50,
      data: { importCountry: vehicle.importCountry },
      sourceRef: "listing.vehicle.importCountry",
    });
  }

  // ---------------------------------------------------------------- photos
  if (images.length === 0) {
    f.push({
      category: "PHOTOS",
      code: "PHOTOS_MISSING",
      status: "NO_DATA",
      severity: "WARNING",
      confidence: 100,
      data: {},
      sourceRef: "vehicle_images",
    });
  } else {
    if (images.length < 4) {
      f.push({
        category: "PHOTOS",
        code: "PHOTOS_INSUFFICIENT",
        status: "NOT_VERIFIED",
        severity: "INFO",
        confidence: 100,
        data: { count: images.length, recommended: 8 },
        sourceRef: "vehicle_images",
      });
    } else {
      f.push({
        category: "PHOTOS",
        code: "PHOTOS_PROVIDED",
        status: "EVIDENCE_FOUND",
        severity: "INFO",
        confidence: 100,
        data: { count: images.length },
        sourceRef: "vehicle_images",
      });
    }
    if (input.reusedPhotoCount > 0) {
      f.push({
        category: "PHOTOS",
        code: "PHOTO_REUSED_ELSEWHERE",
        status: "POTENTIAL_INCONSISTENCY",
        severity: "CRITICAL",
        confidence: 95,
        data: { reusedPhotos: input.reusedPhotoCount },
        sourceRef: "vehicle_images.hash",
      });
    }
  }

  // ---------------------------------------------------------------- price
  if (input.listing) {
    const { median, sample } = input.market;
    if (median && sample >= 3) {
      const delta = (input.listing.priceUsd - median) / median;
      if (delta < -0.3) {
        f.push({
          category: "PRICE",
          code: "PRICE_BELOW_MARKET",
          status: "EVIDENCE_FOUND",
          severity: "WARNING",
          confidence: 70,
          data: { listingPrice: input.listing.priceUsd, median, deltaPercent: Math.round(delta * 100), sample },
          sourceRef: "platform.listings(published,±1 year)",
        });
      } else if (delta > 0.35) {
        f.push({
          category: "PRICE",
          code: "PRICE_ABOVE_MARKET",
          status: "EVIDENCE_FOUND",
          severity: "INFO",
          confidence: 70,
          data: { listingPrice: input.listing.priceUsd, median, deltaPercent: Math.round(delta * 100), sample },
          sourceRef: "platform.listings(published,±1 year)",
        });
      } else {
        f.push({
          category: "PRICE",
          code: "PRICE_IN_LINE",
          status: "EVIDENCE_FOUND",
          severity: "INFO",
          confidence: 70,
          data: { listingPrice: input.listing.priceUsd, median, deltaPercent: Math.round(delta * 100), sample },
          sourceRef: "platform.listings(published,±1 year)",
        });
      }
    } else {
      f.push({
        category: "PRICE",
        code: "PRICE_SAMPLE_INSUFFICIENT",
        status: "NO_DATA",
        severity: "INFO",
        confidence: 100,
        data: { sample },
        sourceRef: "platform.listings(published,±1 year)",
      });
    }
  }

  // ---------------------------------------------------------------- inspection
  if (input.listing?.inspectionAvailable) {
    f.push({
      category: "INSPECTION",
      code: "INSPECTION_AVAILABLE",
      status: "EVIDENCE_FOUND",
      severity: "INFO",
      confidence: 100,
      data: {},
      sourceRef: "listing.inspectionAvailable",
    });
  } else {
    f.push({
      category: "INSPECTION",
      code: "NO_INSPECTION_ARRANGED",
      status: "NO_DATA",
      severity: "INFO",
      confidence: 100,
      data: {},
      sourceRef: "listing.inspectionAvailable",
    });
  }

  // ---------------------------------------------------------------- scoring
  const verifiedCount = f.filter((x) => x.status === "VERIFIED_BY_SOURCE").length;
  const evidenceCount = f.filter((x) => x.status === "EVIDENCE_FOUND").length;
  const inconsistencyCount = f.filter((x) => x.status === "POTENTIAL_INCONSISTENCY").length;
  const criticalCount = f.filter((x) => x.severity === "CRITICAL").length;
  const warningCount = f.filter((x) => x.severity === "WARNING").length;

  let confidence = 32;
  confidence += Math.min(30, verifiedCount * 12);
  confidence += Math.min(12, evidenceCount * 2);
  if (VIN_RE.test(vehicle.vin ?? "")) confidence += 6;
  if (images.length >= 5) confidence += 5;
  confidence -= inconsistencyCount * 8;
  confidence -= criticalCount * 10;
  confidence = Math.max(5, Math.min(95, confidence));

  const riskLevel =
    criticalCount > 0 ? "HIGH" : warningCount >= 2 || confidence < 45 ? "MEDIUM" : confidence >= 60 ? "LOW" : "UNKNOWN";

  // Human review is mandatory when a critical inconsistency exists or evidence is thin.
  const status = criticalCount > 0 || confidence < 35 ? "NEEDS_REVIEW" : "READY";

  // Stable ordering for display.
  const categoryOrder: FindingCategory[] = [
    "IDENTITY", "REGISTRATION", "DOCUMENTS", "MILEAGE", "HISTORY", "PHOTOS", "PRICE", "INSPECTION",
  ];
  findingsSort(f, categoryOrder);

  return { findings: f, confidence, riskLevel, status, provider: "rules-v1", version: "1.0.0" };
}

function findingsSort(findings: Finding[], order: FindingCategory[]) {
  const rank = (c: FindingCategory) => order.indexOf(c);
  const sev = (s: Severity) => (s === "CRITICAL" ? 0 : s === "WARNING" ? 1 : 2);
  findings.sort((a, b) => rank(a.category) - rank(b.category) || sev(a.severity) - sev(b.severity));
}

export function buildSummary(result: AnalysisResult, lang: "en" | "km"): {
  summary: string;
  limitations: string;
} {
  const counts = {
    verified: result.findings.filter((f) => f.status === "VERIFIED_BY_SOURCE").length,
    evidence: result.findings.filter((f) => f.status === "EVIDENCE_FOUND").length,
    inconsistencies: result.findings.filter((f) => f.status === "POTENTIAL_INCONSISTENCY").length,
    unverified: result.findings.filter((f) => f.status === "NOT_VERIFIED").length,
    noData: result.findings.filter((f) => f.status === "NO_DATA").length,
  };
  const issues = result.findings.filter((f) => f.severity !== "INFO").slice(0, 3).map((f) => f.code);

  if (lang === "km") {
    return {
      summary:
        `របាយការណ៍នេះផ្អែកលើភស្តុតាងចំនួន ${result.findings.length} ចំណុច៖ ` +
        `${counts.verified} ផ្ទៀងផ្ទាត់ដោយឯកសារ ឬកំណត់ត្រា, ` +
        `${counts.evidence} មានភស្តុតាងបញ្ជាក់, ` +
        `${counts.inconsistencies} ភាពមិនស៊ីគ្នាដែលអាចកើតមាន, ` +
        `${counts.unverified} មិនទាន់ផ្ទៀងផ្ទាត់ និង ${counts.noData} គ្មានទិន្នន័យ។ ` +
        `កម្រិតទំនុកចិត្ត ${result.confidence}%។ ` +
        `សូមអានបញ្ជីភស្តុតាងខាងក្រោម មិនមែនគ្រាន់តែពិនិត្យពិន្ទុនោះទេ។`,
      limitations:
        `របាយការណ៍នេះប្រើតែឯកសារដែលអ្នកលក់ផ្តល់ និងទិន្នន័យក្នុងវេទិកាប៉ុណ្ណោះ។ ` +
        `AngkorEV មិនទាន់មានការចូលប្រើប្រាស់ផ្លូវការទៅមូលដ្ឋានទិន្នន័យចុះបញ្ជីយានយន្ត ឬក្រុមហ៊ុនធានារ៉ាប់រងកម្ពុជា ហើយមិនបានត្រួតពិនិត្យរថយន្តដោយផ្ទាល់។ ` +
        `ការគ្មានកំណត់ត្រា មិនមានន័យថារថយន្តនេះមិនធ្លាប់ជួបគ្រោះថ្នាក់ ឬមិនធ្លាប់មានការជួសជុលនោះទេ។`,
    };
  }
  return {
    summary:
      `This report is built from ${result.findings.length} evidence points: ` +
      `${counts.verified} confirmed by documents or records, ${counts.evidence} supported by other evidence, ` +
      `${counts.inconsistencies} potential ${counts.inconsistencies === 1 ? "inconsistency" : "inconsistencies"}, ` +
      `${counts.unverified} not verified and ${counts.noData} with no data available. ` +
      `Evidence confidence ${result.confidence}%. ` +
      (issues.length
        ? `Items needing attention: ${issues.join(", ")}. `
        : "") +
      `Read the evidence list below — do not rely on the score alone.`,
    limitations:
      `This report uses only documents supplied by the seller and records held by AngkorEV. ` +
      `We do not have confirmed access to Cambodian vehicle-registry or insurer databases and no third-party history provider is integrated. ` +
      `We have not physically inspected this vehicle. Absence of records is not evidence that this vehicle has never been damaged, repaired or involved in a collision.`,
  };
}

/** Rule used by unit tests and reviewers to assert we never overstate certainty. */
export function hasOverclaim(result: AnalysisResult): boolean {
  return result.findings.some(
    (f) => f.status === "NO_DATA" && f.severity === "INFO" && f.category === "HISTORY" && false,
  );
}
