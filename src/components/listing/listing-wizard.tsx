"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Save,
  Send,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { clsx } from "clsx";
import { BODY_TYPES, DRIVETRAINS, FUEL_TYPES, MAKES, PROVINCES, TRANSMISSIONS } from "@/lib/constants";

type Image = { url: string; hash?: string };

export type WizardInitial = {
  id?: string;
  status?: string;
  vehicle: {
    make: string;
    model: string;
    variant: string;
    year: number | "";
    registrationYear: number | "";
    mileageKm: number | "";
    transmission: string;
    fuelType: string;
    engineCc: number | "";
    drivetrain: string;
    bodyType: string;
    exteriorColor: string;
    interiorColor: string;
    seats: number | "";
    vin: string;
    chassisNumber: string;
    plateNumber: string;
    importCountry: string;
    accidentClaim: string;
    maintenanceClaim: string;
  };
  priceUsd: number | "";
  negotiable: boolean;
  province: string;
  district: string;
  descriptionEn: string;
  descriptionKm: string;
  ownershipDocStatus: string;
  importDocStatus: string;
  inspectionAvailable: boolean;
  inspectionNote: string;
  images: Image[];
};

export const emptyWizard: WizardInitial = {
  vehicle: {
    make: "Toyota",
    model: "",
    variant: "",
    year: new Date().getFullYear() - 5,
    registrationYear: "",
    mileageKm: "",
    transmission: "AUTOMATIC",
    fuelType: "PETROL",
    engineCc: "",
    drivetrain: "FWD",
    bodyType: "SEDAN",
    exteriorColor: "",
    interiorColor: "",
    seats: 5,
    vin: "",
    chassisNumber: "",
    plateNumber: "",
    importCountry: "",
    accidentClaim: "UNKNOWN",
    maintenanceClaim: "UNKNOWN",
  },
  priceUsd: "",
  negotiable: true,
  province: "Phnom Penh",
  district: "",
  descriptionEn: "",
  descriptionKm: "",
  ownershipDocStatus: "NOT_PROVIDED",
  importDocStatus: "NOT_PROVIDED",
  inspectionAvailable: true,
  inspectionNote: "",
  images: [],
};

export function ListingWizard({
  initial,
  tenantId,
  mode,
}: {
  initial?: WizardInitial;
  tenantId?: string | null;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardInitial>(initial ?? emptyWizard);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const v = form.vehicle;
  const setVehicle = <K extends keyof WizardInitial["vehicle"]>(key: K, value: WizardInitial["vehicle"][K]) =>
    setForm((f) => ({ ...f, vehicle: { ...f.vehicle, [key]: value } }));
  const set = <K extends keyof WizardInitial>(key: K, value: WizardInitial[K]) => setForm((f) => ({ ...f, [key]: value }));

  const completeness = useMemo(() => {
    const checks = [
      Boolean(v.model),
      Boolean(v.year),
      Boolean(v.mileageKm),
      Boolean(form.descriptionEn.length >= 40),
      form.images.length > 0,
      Boolean(form.priceUsd),
      Boolean(v.vin || v.chassisNumber),
      Boolean(v.plateNumber),
      Boolean(form.province),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [v, form]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: Image[] = [];
      for (const file of Array.from(files).slice(0, 12 - form.images.length)) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message ?? "Upload failed");
        uploaded.push({ url: json.data.url, hash: json.data.hash });
      }
      setForm((f) => ({ ...f, images: [...f.images, ...uploaded].slice(0, 12) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(publish: boolean) {
    setError(null);

    if (publish && form.images.length === 0) return setError("Add at least one photo before submitting.");
    if (publish && form.descriptionEn.trim().length < 40) return setError("Write a description of at least 40 characters.");
    if (!v.model.trim()) return setError("Enter the model.");

    setSaving(true);
    try {
      const payload = {
        vehicle: {
          make: v.make,
          model: v.model,
          variant: v.variant,
          year: Number(v.year),
          registrationYear: v.registrationYear === "" ? null : Number(v.registrationYear),
          mileageKm: Number(v.mileageKm || 0),
          transmission: v.transmission,
          fuelType: v.fuelType,
          engineCc: v.engineCc === "" ? null : Number(v.engineCc),
          drivetrain: v.drivetrain || null,
          bodyType: v.bodyType,
          exteriorColor: v.exteriorColor,
          interiorColor: v.interiorColor,
          seats: v.seats === "" ? null : Number(v.seats),
          vin: v.vin,
          chassisNumber: v.chassisNumber,
          plateNumber: v.plateNumber,
          importCountry: v.importCountry,
          accidentClaim: v.accidentClaim,
          maintenanceClaim: v.maintenanceClaim,
        },
        priceUsd: Number(form.priceUsd || 0),
        negotiable: form.negotiable,
        province: form.province,
        district: form.district,
        descriptionEn: form.descriptionEn,
        descriptionKm: form.descriptionKm,
        ownershipDocStatus: form.ownershipDocStatus,
        importDocStatus: form.importDocStatus,
        inspectionAvailable: form.inspectionAvailable,
        inspectionNote: form.inspectionNote,
        images: form.images,
        publish,
      };

      const res = await fetch(
        mode === "create"
          ? `/api/listings${tenantId ? `?tenantId=${tenantId}` : ""}`
          : `/api/listings/${form.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not save the listing.");

      if (mode === "create") {
        const id = json.data.id as string;
        if (publish) {
          router.push(`/seller?submitted=1`);
        } else {
          router.push(`/seller/listings/${id}/edit?saved=1`);
        }
      } else {
        setSuccess(publish ? "Listing submitted for review." : "Changes saved.");
        router.refresh();
        setTimeout(() => router.push("/seller"), 900);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the listing.");
    } finally {
      setSaving(false);
    }
  }

  const steps = ["Car details", "Photos & description", "Price, location & documents", "Review"];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{mode === "create" ? "Create a listing" : "Edit listing"}</h1>
          <p className="mt-0.5 text-xs text-ink-500">Step {step} of 4 · {steps[step - 1]}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-ink-500">{completeness}% complete</p>
          <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-ink-200">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${completeness}%` }} />
          </div>
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-4 gap-1.5">
        {steps.map((label, index) => {
          const n = index + 1;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(n)}
                className={clsx(
                  "w-full rounded-lg border px-2 py-2 text-left text-[10px] font-semibold transition sm:text-[11px]",
                  n === step ? "border-brand-600 bg-brand-50 text-brand-800" : n < step ? "border-ok-100 bg-ok-100/50 text-ok-700" : "border-ink-200 bg-white text-ink-400",
                )}
                aria-current={n === step ? "step" : undefined}
              >
                <span className="flex items-center gap-1">
                  {n < step ? <Check className="h-3 w-3" /> : <span className="grid h-4 w-4 place-items-center rounded-full bg-current/10 text-[9px]">{n}</span>}
                  <span className="truncate">{label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="card mt-4 p-5 sm:p-6">
        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-ink-950">Tell us about the car</h2>
              <p className="text-xs text-ink-500">Accurate details get more serious buyers. You can edit everything later.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Make" required>
                <select className="select" value={v.make} onChange={(e) => setVehicle("make", e.target.value)}>
                  {MAKES.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
                </select>
              </Field>
              <Field label="Model" required>
                <input className="input" value={v.model} onChange={(e) => setVehicle("model", e.target.value)} placeholder="e.g. Camry" required />
              </Field>
              <Field label="Variant / trim">
                <input className="input" value={v.variant} onChange={(e) => setVehicle("variant", e.target.value)} placeholder="e.g. 2.5Q" />
              </Field>
              <Field label="Manufacturing year" required>
                <input type="number" inputMode="numeric" min={1980} max={new Date().getFullYear() + 1} className="input" value={v.year} onChange={(e) => setVehicle("year", e.target.value === "" ? "" : Number(e.target.value))} required />
              </Field>
              <Field label="Registration year" hint="Shown as unverified unless a document is reviewed.">
                <input type="number" inputMode="numeric" min={1980} max={new Date().getFullYear() + 1} className="input" value={v.registrationYear} onChange={(e) => setVehicle("registrationYear", e.target.value === "" ? "" : Number(e.target.value))} />
              </Field>
              <Field label="Mileage (km)" required>
                <input type="number" inputMode="numeric" min={0} step={1000} className="input" value={v.mileageKm} onChange={(e) => setVehicle("mileageKm", e.target.value === "" ? "" : Number(e.target.value))} required />
              </Field>
              <Field label="Transmission">
                <select className="select" value={v.transmission} onChange={(e) => setVehicle("transmission", e.target.value)}>
                  {TRANSMISSIONS.map((x) => <option key={x} value={x}>{x === "AUTOMATIC" ? "Automatic" : "Manual"}</option>)}
                </select>
              </Field>
              <Field label="Fuel">
                <select className="select" value={v.fuelType} onChange={(e) => setVehicle("fuelType", e.target.value)}>
                  {FUEL_TYPES.map((x) => <option key={x} value={x}>{x.charAt(0) + x.slice(1).toLowerCase()}</option>)}
                </select>
              </Field>
              <Field label="Body type">
                <select className="select" value={v.bodyType} onChange={(e) => setVehicle("bodyType", e.target.value)}>
                  {BODY_TYPES.map((x) => <option key={x} value={x}>{x.charAt(0) + x.slice(1).toLowerCase()}</option>)}
                </select>
              </Field>
              <Field label="Engine size (cc)">
                <input type="number" inputMode="numeric" min={50} max={10000} className="input" value={v.engineCc} onChange={(e) => setVehicle("engineCc", e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 2000" />
              </Field>
              <Field label="Drivetrain">
                <select className="select" value={v.drivetrain} onChange={(e) => setVehicle("drivetrain", e.target.value)}>
                  <option value="">Not specified</option>
                  {DRIVETRAINS.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Seats">
                <input type="number" inputMode="numeric" min={1} max={60} className="input" value={v.seats} onChange={(e) => setVehicle("seats", e.target.value === "" ? "" : Number(e.target.value))} />
              </Field>
              <Field label="Exterior colour">
                <input className="input" value={v.exteriorColor} onChange={(e) => setVehicle("exteriorColor", e.target.value)} placeholder="e.g. White" />
              </Field>
              <Field label="Interior colour">
                <input className="input" value={v.interiorColor} onChange={(e) => setVehicle("interiorColor", e.target.value)} placeholder="e.g. Beige" />
              </Field>
              <Field label="Imported from">
                <input className="input" value={v.importCountry} onChange={(e) => setVehicle("importCountry", e.target.value)} placeholder="e.g. Japan, USA" />
              </Field>
            </div>

            <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-4">
              <h3 className="text-sm font-bold text-ink-950">Identifiers</h3>
              <p className="mt-0.5 text-[11px] text-ink-500">
                Used only for verification. Buyers never see your full VIN and plate on the public page.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <Field label="VIN (17 characters)">
                  <input className="input font-mono uppercase" maxLength={17} value={v.vin} onChange={(e) => setVehicle("vin", e.target.value.toUpperCase())} placeholder="e.g. JTNBE46K073…" />
                </Field>
                <Field label="Chassis number">
                  <input className="input font-mono uppercase" value={v.chassisNumber} onChange={(e) => setVehicle("chassisNumber", e.target.value.toUpperCase())} />
                </Field>
                <Field label="Plate number">
                  <input className="input font-mono uppercase" value={v.plateNumber} onChange={(e) => setVehicle("plateNumber", e.target.value.toUpperCase())} placeholder="e.g. 2A-1234" />
                </Field>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Accident history (your statement)">
                <select className="select" value={v.accidentClaim} onChange={(e) => setVehicle("accidentClaim", e.target.value)}>
                  <option value="NONE_REPORTED">I am not aware of any accident</option>
                  <option value="MINOR_REPAIR">Minor repair or paintwork</option>
                  <option value="MAJOR_REPAIR">Major repair after a collision</option>
                  <option value="UNKNOWN">I do not know</option>
                </select>
              </Field>
              <Field label="Maintenance records">
                <select className="select" value={v.maintenanceClaim} onChange={(e) => setVehicle("maintenanceClaim", e.target.value)}>
                  <option value="FULL_HISTORY">Full service history</option>
                  <option value="PARTIAL">Some records</option>
                  <option value="NONE">No records</option>
                  <option value="UNKNOWN">Do not know</option>
                </select>
              </Field>
            </div>
            <p className="rounded-lg bg-gold-100/50 px-3 py-2 text-[11px] leading-relaxed text-warn-700">
              Your statement is shown as an unverified claim. It is never presented as a verified fact.
            </p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-ink-950">Add photos</h2>
              <p className="text-xs text-ink-500">Use daylight photos of the real car: front, both sides, rear, interior, odometer and the chassis plate.</p>
            </div>

            <div
              className="rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/60 p-6 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); uploadFiles(e.dataTransfer.files); }}
            >
              <UploadCloud className="mx-auto h-8 w-8 text-ink-400" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-ink-800">Drop images here or choose files</p>
              <p className="mt-0.5 text-[11px] text-ink-500">JPG, PNG or WebP, up to 6 MB each, 12 photos maximum.</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => uploadFiles(e.target.files)}
                id="photo-input"
              />
              <label htmlFor="photo-input" className={clsx("btn btn-secondary mt-3 cursor-pointer", uploading && "pointer-events-none opacity-60")}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {uploading ? "Uploading…" : "Choose photos"}
              </label>
            </div>

            {form.images.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {form.images.map((img, index) => (
                  <div key={img.url} className="group relative overflow-hidden rounded-xl border border-ink-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={`Photo ${index + 1}`} className="aspect-square w-full object-cover" />
                    {index === 0 ? (
                      <span className="absolute left-1.5 top-1.5 chip chip-brand !py-0.5 text-[10px]">
                        <Star className="h-2.5 w-2.5" /> Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, images: [f.images[index], ...f.images.filter((_, i) => i !== index)] }))}
                        className="absolute left-1.5 top-1.5 rounded-md bg-white/90 px-1.5 py-1 text-[10px] font-semibold text-ink-700 opacity-0 transition group-hover:opacity-100"
                      >
                        Make cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }))}
                      className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-md bg-white/90 text-danger-700 opacity-0 transition group-hover:opacity-100"
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-500">No photos yet. Listings with photos get far more inquiries.</p>
            )}

            <div className="grid gap-4">
              <Field label="Description (English)" required hint={`${form.descriptionEn.length}/4000 · at least 40 characters`}>
                <textarea
                  className="textarea min-h-32"
                  value={form.descriptionEn}
                  onChange={(e) => set("descriptionEn", e.target.value)}
                  placeholder="Condition, service history, tyres, why you are selling. Do not put phone numbers or Telegram handles here."
                  maxLength={4000}
                />
              </Field>
              <Field label="Description (Khmer)" hint="Optional. Khmer buyers often search in Khmer.">
                <textarea
                  className="textarea"
                  value={form.descriptionKm}
                  onChange={(e) => set("descriptionKm", e.target.value)}
                  lang="km"
                  maxLength={4000}
                />
              </Field>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-ink-950">Price, location and documents</h2>
              <p className="text-xs text-ink-500">Prices are in USD. Buyers also see an indicative riel conversion.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Asking price (USD)" required hint={`≈ ៛${(Number(form.priceUsd || 0) * 4100).toLocaleString("en-US")} at ៛4,100/$1`}>
                <input type="number" inputMode="numeric" min={200} step={100} className="input" value={form.priceUsd} onChange={(e) => set("priceUsd", e.target.value === "" ? "" : Number(e.target.value))} required />
              </Field>
              <Field label="Province" required>
                <select className="select" value={form.province} onChange={(e) => set("province", e.target.value)}>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="District / khan">
                <input className="input" value={form.district} onChange={(e) => set("district", e.target.value)} placeholder="e.g. Chamkarmon" />
              </Field>
              <div className="flex items-end pb-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
                  <input type="checkbox" checked={form.negotiable} onChange={(e) => set("negotiable", e.target.checked)} className="h-4 w-4 accent-brand-700" />
                  Price is negotiable
                </label>
              </div>
              <Field label="Registration document">
                <select className="select" value={form.ownershipDocStatus} onChange={(e) => set("ownershipDocStatus", e.target.value)}>
                  <option value="ORIGINAL_AVAILABLE">Original available at viewing</option>
                  <option value="COPY_ONLY">Copy only</option>
                  <option value="NOT_PROVIDED">Not available</option>
                </select>
              </Field>
              <Field label="Import document">
                <select className="select" value={form.importDocStatus} onChange={(e) => set("importDocStatus", e.target.value)}>
                  <option value="AVAILABLE">Available</option>
                  <option value="NOT_PROVIDED">Not available</option>
                </select>
              </Field>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-ink-200 p-3">
              <input type="checkbox" checked={form.inspectionAvailable} onChange={(e) => set("inspectionAvailable", e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-700" />
              <span>
                <span className="block text-sm font-medium text-ink-900">I can arrange a viewing and inspection</span>
                <span className="text-[11px] text-ink-500">Buyers are far more likely to contact a seller who allows an inspection.</span>
              </span>
            </label>

            {form.inspectionAvailable ? (
              <Field label="Where can buyers inspect the car?">
                <input className="input" value={form.inspectionNote} onChange={(e) => set("inspectionNote", e.target.value)} placeholder="e.g. Toul Kork, near the market — weekday evenings" />
              </Field>
            ) : null}

            <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-brand-900">
                <CheckCircle2 className="h-4 w-4" /> Documents make the report stronger
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-600">
                {mode === "edit"
                  ? "Upload the registration card and import papers below. They are private, reviewed by our team, and only the review result appears on your public listing."
                  : "After you save this listing you can upload the registration card and import papers. They are private and only the review result appears publicly."}
              </p>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-ink-950">Review your listing</h2>
              <p className="text-xs text-ink-500">Check the details. After you submit, our team reviews the listing before it goes public.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              {form.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.images[0].url} alt="Cover" className="aspect-[4/3] w-full rounded-xl object-cover" />
              ) : (
                <div className="grid aspect-[4/3] place-items-center rounded-xl bg-ink-100 text-xs text-ink-400">No photo</div>
              )}
              <div>
                <p className="text-lg font-bold text-ink-950">
                  {v.year} {v.make} {v.model} {v.variant}
                </p>
                <p className="text-sm text-ink-600">
                  ${Number(form.priceUsd || 0).toLocaleString("en-US")} · {Number(v.mileageKm || 0).toLocaleString("en-US")} km · {form.province}
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  {v.bodyType} · {v.transmission} · {v.fuelType} · {form.images.length} photos
                </p>
              </div>
            </div>

            <dl className="grid gap-3 rounded-xl bg-ink-50 p-3 sm:grid-cols-2">
              <ReviewRow label="VIN" value={v.vin || "Not provided"} />
              <ReviewRow label="Chassis" value={v.chassisNumber || "Not provided"} />
              <ReviewRow label="Plate" value={v.plateNumber || "Not provided"} />
              <ReviewRow label="Registration doc" value={form.ownershipDocStatus.replaceAll("_", " ").toLowerCase()} />
              <ReviewRow label="Import doc" value={form.importDocStatus.replaceAll("_", " ").toLowerCase()} />
              <ReviewRow label="Inspection" value={form.inspectionAvailable ? "Available" : "Not arranged"} />
            </dl>

            <div className="rounded-xl border border-ink-200 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Description</p>
              <p className="mt-1 whitespace-pre-line text-sm text-ink-700">{form.descriptionEn || "—"}</p>
            </div>

            <p className="text-[11px] leading-relaxed text-ink-500">
              Your listing will be checked for duplicate VINs, reused photos, contact details in the description and implausible prices.
              Moderation does not verify that the car runs.
            </p>
          </div>
        ) : null}

        {error ? <p className="mt-4 rounded-lg bg-danger-100 px-3 py-2 text-xs font-medium text-danger-700" role="alert">{error}</p> : null}
        {success ? <p className="mt-4 rounded-lg bg-ok-100 px-3 py-2 text-xs font-medium text-ok-700" role="status">{success}</p> : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-4">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => save(false)} disabled={saving}>
              <Save className="h-4 w-4" /> Save draft
            </button>
            {step < 4 ? (
              <button type="button" className="btn btn-primary" onClick={() => setStep((s) => Math.min(4, s + 1))}>
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => save(true)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {saving ? "Saving…" : "Submit for review"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">
        {label}
        {required ? <span className="ml-1 text-danger-600" aria-hidden>*</span> : null}
      </label>
      {children}
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-ink-200/60 pb-1.5">
      <dt className="text-[11px] uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="truncate text-xs font-medium text-ink-800">{value}</dd>
    </div>
  );
}
