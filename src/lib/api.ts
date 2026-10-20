import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodTypeAny, type output } from "zod";
import { getAuthContext, type AuthContext } from "./auth";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, init);
}

export function jsonError(err: unknown, requestId = crypto.randomUUID()): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, details: err.details, requestId } },
      { status: err.status },
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "The submitted data is invalid.",
          details: err.flatten().fieldErrors,
          requestId,
        },
      },
      { status: 422 },
    );
  }
  console.error("[api] unhandled", err);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again.", requestId } },
    { status: 500 },
  );
}

export async function requireUser(): Promise<AuthContext & { user: NonNullable<AuthContext["user"]> }> {
  const ctx = await getAuthContext();
  if (!ctx.user) throw new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue.");
  return ctx as AuthContext & { user: NonNullable<AuthContext["user"]> };
}

export async function parseBody<S extends ZodTypeAny>(req: NextRequest, schema: S): Promise<output<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
  return schema.parse(raw);
}

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ------------------------------------------------------------------ rate limit
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  existing.count += 1;
  if (existing.count > limit) {
    const retry = Math.ceil((existing.resetAt - now) / 1000);
    throw new ApiError(429, "RATE_LIMITED", `Too many attempts. Try again in ${retry}s.`, { retryAfter: retry });
  }
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }
}

// ------------------------------------------------------------------ pagination
export type Page = { page: number; pageSize: number; total: number; totalPages: number };

export function parsePagination(search: URLSearchParams, defaultSize = 12): { limit: number; offset: number; page: number; pageSize: number } {
  const page = Math.max(1, Number(search.get("page") ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(search.get("pageSize") ?? defaultSize) || defaultSize));
  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
}

export function pageMeta(total: number, page: number, pageSize: number): Page {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
