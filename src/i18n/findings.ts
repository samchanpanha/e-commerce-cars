import type { EvidenceStatus, FindingCategory } from "@/lib/report-engine";

type Copy = { title: string; description: string };

export const STATUS_COPY: Record<EvidenceStatus, { en: Copy; km: Copy; tone: string }> = {
  VERIFIED_BY_SOURCE: {
    tone: "green",
    en: {
      title: "Verified by source",
      description: "Confirmed against a document reviewed by a person, or against platform records that were checked.",
    },
    km: {
      title: "ផ្ទៀងផ្ទាត់ដោយប្រភព",
      description: "បានបញ្ជាក់ដោយឯកសារដែលមនុស្សបានត្រួតពិនិត្យ ឬដោយទិន្នន័យវេទិកាដែលបានផ្ទៀងផ្ទាត់។",
    },
  },
  EVIDENCE_FOUND: {
    tone: "blue",
    en: {
      title: "Evidence found",
      description: "We found supporting evidence, but it is not the same as a registry or insurer confirmation.",
    },
    km: {
      title: "ភស្តុតាងត្រូវបានរកឃើញ",
      description: "យើងរកឃើញភស្តុតាងគាំទ្រ ប៉ុន្តែវាមិនស្មើនឹងការបញ្ជាក់ពីមូលដ្ឋានទិន្នន័យចុះបញ្ជី ឬក្រុមហ៊ុនធានារ៉ាប់រងនោះទេ។",
    },
  },
  POTENTIAL_INCONSISTENCY: {
    tone: "amber",
    en: {
      title: "Potential inconsistency",
      description: "Some information contradicts other information. Ask the seller to explain before you pay anything.",
    },
    km: {
      title: "ភាពមិនស៊ីគ្នាដែលអាចកើតមាន",
      description: "ព័ត៌មានខ្លះមិនស្របគ្នានឹងព័ត៌មានផ្សេង។ សូមសួរអ្នកលក់ពន្យល់ មុនពេលបង់ប្រាក់ណាមួយ។",
    },
  },
  NOT_VERIFIED: {
    tone: "slate",
    en: {
      title: "Not verified",
      description: "This is a claim or submission we have not been able to confirm.",
    },
    km: {
      title: "មិនទាន់ផ្ទៀងផ្ទាត់",
      description: "នេះជាការអះអាង ឬឯកសារដែលយើងមិនទាន់អាចបញ្ជាក់បាន។",
    },
  },
  NO_DATA: {
    tone: "grey",
    en: {
      title: "No data available",
      description: "We have no information for this check. That is not a clean result — it is an unknown one.",
    },
    km: {
      title: "គ្មានទិន្នន័យ",
      description: "យើងមិនមានព័ត៌មានសម្រាប់ការត្រួតពិនិត្យនេះទេ។ នេះមិនមែនជាលទ្ធផលស្អាតទេ គឺជាការមិនដឹង។",
    },
  },
};

export const CATEGORY_COPY: Record<FindingCategory, { en: string; km: string }> = {
  IDENTITY: { en: "Vehicle identity", km: "អត្តសញ្ញាណយានយន្ត" },
  REGISTRATION: { en: "Registration", km: "ការចុះបញ្ជី" },
  DOCUMENTS: { en: "Documents", km: "ឯកសារ" },
  MILEAGE: { en: "Mileage", km: "ចម្ងាយដំណើរការ" },
  HISTORY: { en: "History", km: "ប្រវត្តិ" },
  PHOTOS: { en: "Photographs", km: "រូបថត" },
  PRICE: { en: "Price context", km: "បរិបទតម្លៃ" },
  INSPECTION: { en: "Inspection", km: "ការត្រួតពិនិត្យ" },
};

type FindingCopy = { en: Copy; km: Copy };

export const FINDING_COPY: Record<string, FindingCopy> = {
  VIN_MISSING: {
    en: { title: "No VIN submitted", description: "The seller did not provide a VIN, so identity cannot be checked against any document." },
    km: { title: "មិនមាន VIN", description: "អ្នកលក់មិនបានផ្តល់ VIN ដូច្នេះមិនអាចផ្ទៀងផ្ទាត់អត្តសញ្ញាណជាមួយឯកសារណាមួយបានទេ។" },
  },
  VIN_FORMAT_INVALID: {
    en: { title: "VIN format looks wrong", description: "A VIN has 17 characters and never uses the letters I, O or Q. The submitted value does not match that pattern." },
    km: { title: "ទម្រង់ VIN ហាក់ខុស", description: "VIN មាន 17 តួអក្សរ ហើយមិនប្រើអក្សរ I, O ឬ Q ទេ។ តម្លៃដែលបានដាក់មិនត្រូវនឹងទម្រង់នោះទេ។" },
  },
  VIN_FORMAT_VALID: {
    en: { title: "VIN format is valid", description: "The VIN matches the standard 17-character pattern. This is a format check only — we could not query a registry." },
    km: { title: "ទម្រង់ VIN ត្រឹមត្រូវ", description: "VIN ត្រូវនឹងទម្រង់ 17 តួអក្សរ។ នេះគ្រាន់តែជាការត្រួតពិនិត្យទម្រង់ យើងមិនអាចសាកសួរមូលដ្ឋានទិន្នន័យចុះបញ្ជីបានទេ។" },
  },
  CHASSIS_PRESENT: {
    en: { title: "Chassis number provided", description: "A chassis number was supplied. It has not been checked against a registry." },
    km: { title: "មានលេខស៊ុម", description: "បានផ្តល់លេខស៊ុម។ វាមិនទាន់ត្រូវបានផ្ទៀងផ្ទាត់ជាមួយមូលដ្ឋានទិន្នន័យចុះបញ្ជីទេ។" },
  },
  CHASSIS_MISSING: {
    en: { title: "No chassis number", description: "Without a chassis number, identity checks are limited to the VIN and documents." },
    km: { title: "គ្មានលេខស៊ុម", description: "ដោយគ្មានលេខស៊ុម ការផ្ទៀងផ្ទាត់អត្តសញ្ញាណកំណត់ត្រឹម VIN និងឯកសារប៉ុណ្ណោះ។" },
  },
  PLATE_PRESENT: {
    en: { title: "Plate number provided", description: "A plate number was supplied. Plates can be transferred between vehicles in Cambodia, so a plate alone does not prove identity." },
    km: { title: "មានស្លាកលេខ", description: "បានផ្តល់ស្លាកលេខ។ ស្លាកលេខអាចផ្ទេររវាងយានយន្តបាននៅកម្ពុជា ដូច្នេះស្លាកលេខតែមួយមិនអាចបញ្ជាក់អត្តសញ្ញាណបានទេ។" },
  },
  VIN_DUPLICATE_LISTING: {
    en: { title: "Same VIN on another active listing", description: "This VIN already appears on a different active listing. Two sellers cannot both own the same car — treat this as a serious warning." },
    km: { title: "VIN ដូចគ្នានៅការផ្សាយផ្សេង", description: "VIN នេះបានបង្ហាញរួចហើយនៅការផ្សាយផ្សេងដែលកំពុងសកម្ម។ អ្នកលក់ពីរនាក់មិនអាចកាន់កាប់រថយន្តតែមួយបានទេ — សូមចាត់ទុកជាការព្រមានធ្ងន់ធ្ងរ។" },
  },
  PLATE_DUPLICATE_LISTING: {
    en: { title: "Same plate on another active listing", description: "This plate number appears on a different active listing. Confirm the plate against the original registration card." },
    km: { title: "ស្លាកលេខដូចគ្នានៅការផ្សាយផ្សេង", description: "ស្លាកលេខនេះបង្ហាញនៅការផ្សាយផ្សេងដែលកំពុងសកម្ម។ សូមផ្ទៀងផ្ទាត់ស្លាកលេខជាមួយកាតចុះបញ្ជីដើម។" },
  },
  REG_DOC_VERIFIED: {
    en: { title: "Registration card reviewed", description: "A reviewer checked the submitted registration card. The document itself was not verified by a government office." },
    km: { title: "បានត្រួតពិនិត្យកាតចុះបញ្ជី", description: "អ្នកត្រួតពិនិត្យបានពិនិត្យកាតចុះបញ្ជីដែលបានដាក់។ ឯកសារខ្លួនឯងមិនត្រូវបានផ្ទៀងផ្ទាត់ដោយការិយាល័យរដ្ឋាភិបាលទេ។" },
  },
  IMPORT_DOC_VERIFIED: {
    en: { title: "Import declaration reviewed", description: "An import or customs declaration was submitted and reviewed by a person." },
    km: { title: "បានត្រួតពិនិត្យឯកសារនាំចូល", description: "ឯកសារនាំចូល ឬគយត្រូវបានដាក់ និងត្រួតពិនិត្យដោយមនុស្ស។" },
  },
  OWNERSHIP_DOC_VERIFIED: {
    en: { title: "Ownership transfer reviewed", description: "An ownership transfer record was submitted and reviewed." },
    km: { title: "បានត្រួតពិនិត្យឯកសារផ្ទេរកម្មសិទ្ធិ", description: "ឯកសារផ្ទេរកម្មសិទ្ធិត្រូវបានដាក់ និងត្រួតពិនិត្យ។" },
  },
  SERVICE_RECORD_VERIFIED: {
    en: { title: "Service record reviewed", description: "A maintenance record was submitted and reviewed. Records only cover the workshop that issued them." },
    km: { title: "បានត្រួតពិនិត្យកំណត់ត្រាថែទាំ", description: "កំណត់ត្រាថែទាំត្រូវបានដាក់ និងត្រួតពិនិត្យ។ កំណត់ត្រាគ្របដណ្តប់តែអាគារដែលបានចេញវាប៉ុណ្ណោះ។" },
  },
  INSPECTION_REPORT_VERIFIED: {
    en: { title: "Inspection report reviewed", description: "An inspection report was submitted and reviewed. Its findings are the inspector's, not AngkorEV's." },
    km: { title: "បានត្រួតពិនិត្យរបាយការណ៍ត្រួតពិនិត្យ", description: "របាយការណ៍ត្រួតពិនិត្យត្រូវបានដាក់ និងត្រួតពិនិត្យ។ លទ្ធផលជារបស់អ្នកត្រួតពិនិត្យ មិនមែនរបស់ AngkorEV ទេ។" },
  },
  DOC_VERIFIED: {
    en: { title: "Document reviewed", description: "A submitted document was reviewed by a person." },
    km: { title: "បានត្រួតពិនិត្យឯកសារ", description: "ឯកសារដែលបានដាក់ត្រូវបានត្រួតពិនិត្យដោយមនុស្ស។" },
  },
  DOCS_PENDING_REVIEW: {
    en: { title: "Documents awaiting review", description: "Some uploaded documents have not been reviewed yet, so they are excluded from the confidence score." },
    km: { title: "ឯកសាររង់ចាំការត្រួតពិនិត្យ", description: "ឯកសារខ្លះមិនទាន់ត្រូវបានត្រួតពិនិត្យទេ ដូច្នេះវាមិនរាប់បញ្ចូលក្នុងពិន្ទុទំនុកចិត្ត។" },
  },
  DOCS_REJECTED: {
    en: { title: "A document was rejected", description: "At least one submitted document did not pass review. Ask the seller for a clear copy before proceeding." },
    km: { title: "ឯកសារមួយត្រូវបានបដិសេធ", description: "ឯកសារយ៉ាងហោចណាស់មួយមិនឆ្លងកាត់ការត្រួតពិនិត្យ។ សូមសួរអ្នកលក់សម្រាប់ច្បាប់ចម្លងច្បាស់លាស់។" },
  },
  NO_DOCUMENTS: {
    en: { title: "No documents submitted", description: "No registration, import or service documents were provided. Nothing about ownership or history could be confirmed." },
    km: { title: "គ្មានឯកសារដាក់", description: "គ្មានឯកសារចុះបញ្ជី នាំចូល ឬថែទាំត្រូវបានផ្តល់ទេ។ គ្មានអ្វីអំពីកម្មសិទ្ធិ ឬប្រវត្តិអាចបញ្ជាក់បានទេ។" },
  },
  REGISTRATION_YEAR_INCONSISTENT: {
    en: { title: "Registration year is before the model year", description: "The recorded registration year is earlier than the manufacturing year, which should not normally happen." },
    km: { title: "ឆ្នាំចុះបញ្ជីមុនឆ្នាំផលិត", description: "ឆ្នាំចុះបញ្ជីដែលបានកត់ត្រាមុនឆ្នាំផលិត ដែលជាធម្មតាមិនគួរកើតឡើង។" },
  },
  REGISTRATION_YEAR_RECORDED: {
    en: { title: "Registration year recorded", description: "A registration year was supplied. A gap after the model year is normal for imported vehicles." },
    km: { title: "មានឆ្នាំចុះបញ្ជី", description: "បានផ្តល់ឆ្នាំចុះបញ្ជី។ គម្លាតបន្ទាប់ពីឆ្នាំផលិតគឺធម្មតាសម្រាប់យានយន្តនាំចូល។" },
  },
  DOC_FIELD_MISMATCH: {
    en: { title: "Document details do not match the listing", description: "A field on a reviewed document differs from the listing — for example the VIN, plate, chassis number or year. Ask the seller to explain in writing before any payment." },
    km: { title: "ព័ត៌មានឯកសារមិនត្រូវនឹងការផ្សាយ", description: "ទិន្នន័យនៅលើឯកសារដែលបានត្រួតពិនិត្យខុសពីការផ្សាយ — ឧទាហរណ៍ VIN, ស្លាកលេខ, លេខស៊ុម ឬឆ្នាំ។ សូមសួរអ្នកលក់ពន្យល់ជាលាយលក្ខណ៍អក្សរ មុនបង់ប្រាក់។" },
  },
  DOC_FIELD_MATCH: {
    en: { title: "Document details match the listing", description: "Identifiers on the reviewed document match the listing values." },
    km: { title: "ព័ត៌មានឯកសារត្រូវនឹងការផ្សាយ", description: "អត្តសញ្ញាណនៅលើឯកសារដែលបានត្រួតពិនិត្យត្រូវនឹងតម្លៃក្នុងការផ្សាយ។" },
  },
  MILEAGE_RECORD_ANOMALY: {
    en: { title: "Recorded mileage is higher than the listing", description: "A reviewed document records a higher mileage than the listing shows. Odometer rollback is one possible explanation; an inaccurate record is another." },
    km: { title: "ចម្ងាយក្នុងកំណត់ត្រាខ្ពស់ជាងការផ្សាយ", description: "ឯកសារដែលបានត្រួតពិនិត្យកត់ត្រាចម្ងាយខ្ពស់ជាងការផ្សាយ។ ការកែចម្ងាយអាចជាមូលហេតុមួយ កំណត់ត្រាមិនត្រឹមត្រូវក៏អាចជាមូលហេតុមួយ។" },
  },
  MILEAGE_RECORD_CONSISTENT: {
    en: { title: "Recorded mileage is consistent", description: "Mileage on the reviewed documents does not exceed the listing mileage." },
    km: { title: "ចម្ងាយក្នុងកំណត់ត្រាស៊ីគ្នា", description: "ចម្ងាយនៅលើឯកសារដែលបានត្រួតពិនិត្យមិនលើសពីចម្ងាយក្នុងការផ្សាយ។" },
  },
  MILEAGE_UNVERIFIED: {
    en: { title: "Mileage cannot be verified", description: "No service or inspection record with a mileage reading was available, so the odometer reading is unconfirmed." },
    km: { title: "មិនអាចផ្ទៀងផ្ទាត់ចម្ងាយ", description: "គ្មានកំណត់ត្រាថែទាំ ឬត្រួតពិនិត្យដែលមានចម្ងាយទេ ដូច្នេះការអានចម្ងាយមិនត្រូវបានបញ្ជាក់។" },
  },
  MILEAGE_IMPLAUSIBLE_LOW: {
    en: { title: "Mileage is very low for the vehicle age", description: "Average yearly mileage is far below typical use. This can be genuine for a rarely driven car, but ask for service records." },
    km: { title: "ចម្ងាយទាបខ្លាំងសម្រាប់អាយុរថយន្ត", description: "ចម្ងាយប្រចាំឆ្នាំទាបជាងការប្រើប្រាស់ធម្មតាខ្លាំង។ អាចជាការពិតសម្រាប់រថយន្តប្រើតិច ប៉ុន្តែសូមសុំកំណត់ត្រាថែទាំ។" },
  },
  MILEAGE_HIGH_ANNUAL: {
    en: { title: "High yearly mileage", description: "The car has covered a lot of distance per year, which usually means more wear on consumable parts." },
    km: { title: "ចម្ងាយប្រចាំឆ្នាំខ្ពស់", description: "រថយន្តបានធ្វើដំណើរច្រើនក្នុងមួយឆ្នាំ ដែលជាធម្មតាមានន័យថាគ្រឿងប្រើប្រាស់អស់លឿនជាង។" },
  },
  HISTORY_NO_SOURCE: {
    en: { title: "No independent history database is connected", description: "AngkorEV is not yet connected to a Cambodian registry or a licensed international history provider. Nothing here should be read as a clean accident record." },
    km: { title: "មិនមានមូលដ្ឋានទិន្នន័យប្រវត្តិឯករាជ្យ", description: "AngkorEV មិនទាន់ភ្ជាប់ទៅមូលដ្ឋានទិន្នន័យចុះបញ្ជីកម្ពុជា ឬអ្នកផ្តល់សេវាប្រវត្តិអន្តរជាតិដែលមានអាជ្ញាបណ្ណទេ។ គ្មានអ្វីនៅទីនេះគួរអានថាជាកំណត់ត្រាគ្រោះថ្នាក់ស្អាតនោះទេ។" },
  },
  ACCIDENT_CLAIM_UNVERIFIED: {
    en: { title: "Accident statement is the seller's own", description: "The seller's description of accident history is recorded for transparency but has not been verified against any record." },
    km: { title: "សេចក្តីថ្លែងអំពីគ្រោះថ្នាក់ជារបស់អ្នកលក់", description: "ការពិពណ៌នារបស់អ្នកលក់អំពីប្រវត្តិគ្រោះថ្នាក់ត្រូវបានកត់ត្រាសម្រាប់តម្លាភាព ប៉ុន្តែមិនទាន់ផ្ទៀងផ្ទាត់នឹងកំណត់ត្រាណាមួយទេ។" },
  },
  IMPORT_DECLARED: {
    en: { title: "Import origin declared", description: "The seller declared an import country. This is only confirmed if an import document has been reviewed." },
    km: { title: "បានប្រកាសប្រទេសនាំចូល", description: "អ្នកលក់បានប្រកាសប្រទេសនាំចូល។ វាត្រូវបានបញ្ជាក់តែនៅពេលឯកសារនាំចូលត្រូវបានត្រួតពិនិត្យ។" },
  },
  PHOTOS_MISSING: {
    en: { title: "No photos", description: "Without photos, condition cannot be assessed at all. Do not send a deposit for a listing with no photos." },
    km: { title: "គ្មានរូបថត", description: "បើគ្មានរូបថត មិនអាចវាយតម្លៃស្ថានភាពបានទេ។ មិនគួរផ្ញើប្រាក់កក់សម្រាប់ការផ្សាយដែលគ្មានរូបថត។" },
  },
  PHOTOS_INSUFFICIENT: {
    en: { title: "Too few photos", description: "Fewer than four photos were supplied. Ask for the interior, both sides, the engine bay, the odometer and the chassis plate." },
    km: { title: "រូបថតតិចពេក", description: "បានផ្តល់រូបថតតិចជាងបួនសន្លឹក។ សូមសុំរូបខាងក្នុង សងខាង បង្កាន់ដៃម៉ាស៊ីន ឧបករណ៍វាស់ចម្ងាយ និងស្លាកស៊ុម។" },
  },
  PHOTOS_PROVIDED: {
    en: { title: "Photo set supplied", description: "Several photos were supplied. Photos are seller-provided and may not show existing damage." },
    km: { title: "មានរូបថត", description: "បានផ្តល់រូបថតជាច្រើនសន្លឹក។ រូបថតជារបស់អ្នកលក់ ហើយអាចមិនបង្ហាញការខូចខាតដែលមានស្រាប់។" },
  },
  PHOTO_REUSED_ELSEWHERE: {
    en: { title: "Photos also used on another listing", description: "The same image files appear on a different listing. Stock or reused photos are a common sign of a fake listing." },
    km: { title: "រូបថតក៏ប្រើក្នុងការផ្សាយផ្សេង", description: "ឯកសាររូបថតដូចគ្នាបង្ហាញនៅការផ្សាយផ្សេង។ រូបថតស្តុក ឬប្រើឡើងវិញជាសញ្ញាទូទៅនៃការផ្សាយក្លែងក្លាយ។" },
  },
  PRICE_BELOW_MARKET: {
    en: { title: "Price is well below comparable listings", description: "Compared with similar cars published on AngkorEV, this price is much lower. This can be a genuine bargain or a bait listing — verify the car in person." },
    km: { title: "តម្លៃទាបជាងការផ្សាយស្រដៀង", description: "បើធៀបនឹងរថយន្តស្រដៀងដែលផ្សាយលើ AngkorEV តម្លៃនេះទាបជាងច្រើន។ អាចជាឱកាសពិត ឬការផ្សាយទាក់ទាញ — សូមផ្ទៀងផ្ទាត់ដោយផ្ទាល់។" },
  },
  PRICE_ABOVE_MARKET: {
    en: { title: "Price is above comparable listings", description: "Compared with similar published cars, this price is higher. Check condition, mileage and documents to see whether it is justified." },
    km: { title: "តម្លៃខ្ពស់ជាងការផ្សាយស្រដៀង", description: "បើធៀបនឹងរថយន្តស្រដៀងដែលផ្សាយ តម្លៃនេះខ្ពស់ជាង។ សូមពិនិត្យស្ថានភាព ចម្ងាយ និងឯកសារ។" },
  },
  PRICE_IN_LINE: {
    en: { title: "Price is in line with comparable listings", description: "The asking price sits near the median of similar published cars. This is a market observation, not a valuation." },
    km: { title: "តម្លៃស្របនឹងការផ្សាយស្រដៀង", description: "តម្លៃស្នើសុំនៅជិតមធ្យមនៃរថយន្តស្រដៀង។ នេះជាការសង្កេតទីផ្សារ មិនមែនការវាយតម្លៃទេ។" },
  },
  PRICE_SAMPLE_INSUFFICIENT: {
    en: { title: "Not enough comparable listings", description: "There are too few similar cars on AngkorEV to compare this price fairly." },
    km: { title: "ការផ្សាយស្រដៀងមិនគ្រប់គ្រាន់", description: "មានរថយន្តស្រដៀងតិចពេកលើ AngkorEV ដើម្បីប្រៀបធៀបតម្លៃនេះដោយយុត្តិធម៌។" },
  },
  INSPECTION_AVAILABLE: {
    en: { title: "Seller accepts an inspection", description: "The seller has indicated that a pre-purchase inspection can be arranged." },
    km: { title: "អ្នកលក់យល់ព្រមត្រួតពិនិត្យ", description: "អ្នកលក់បានបញ្ជាក់ថាអាចរៀបចំការត្រួតពិនិត្យមុនទិញបាន។" },
  },
  NO_INSPECTION_ARRANGED: {
    en: { title: "No inspection arranged", description: "No inspection has been booked. A physical inspection by a qualified mechanic is the strongest evidence you can get." },
    km: { title: "មិនមានការត្រួតពិនិត្យ", description: "មិនមានការត្រួតពិនិត្យត្រូវបានកក់ទេ។ ការត្រួតពិនិត្យដោយជាងជំនាញគឺជាភស្តុតាងដ៏រឹងមាំបំផុត។" },
  },
};

export function findingCopy(code: string, lang: "en" | "km"): Copy {
  const entry = FINDING_COPY[code];
  if (!entry) {
    return lang === "km"
      ? { title: "ចំណុចត្រួតពិនិត្យ", description: "មិនមានការពិពណ៌នាសម្រាប់ចំណុចនេះទេ។" }
      : { title: "Check item", description: "No description available for this check." };
  }
  return entry[lang];
}
