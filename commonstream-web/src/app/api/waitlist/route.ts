// app/api/waitlist/route.ts
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "edge"; // neon works great on Edge

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const ua = req.headers.get("user-agent") ?? null;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    await sql`
      CREATE TABLE IF NOT EXISTS waitlist (
        id BIGSERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        source TEXT,
        ua TEXT,
        ip TEXT
      )
    `;

    await sql`
      INSERT INTO waitlist (email, source, ua, ip)
      VALUES (${email}, ${source ?? null}, ${ua}, ${ip})
      ON CONFLICT (email) DO UPDATE SET
        source = EXCLUDED.source,
        ua = EXCLUDED.ua,
        ip = EXCLUDED.ip
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
