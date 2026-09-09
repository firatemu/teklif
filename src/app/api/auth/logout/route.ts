import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function GET() {
  await destroySession();
  return NextResponse.json({ success: true });
}

export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true });
}
