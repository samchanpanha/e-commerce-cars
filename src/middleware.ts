import { NextResponse, type NextRequest } from "next/server";

/**
 * Security headers + a cheap early gate. Real authorization is enforced in every
 * server component, server action and route handler — never here alone.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (!req.cookies.get("aev_session") && /\/(dashboard|admin|tenant|seller|customer)/.test(req.nextUrl.pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
