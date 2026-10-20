import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function GET() {
  try {
    await db.run(sql`select 1`);
    return NextResponse.json({ status: "ok", service: "angkorev", time: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: "degraded" }, { status: 503 });
  }
}
