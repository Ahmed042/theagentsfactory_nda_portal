import { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/auth";

export async function POST() {
  const cookieName = getSessionCookieName();

  const response = NextResponse.json({ success: true });
  response.cookies.delete(cookieName);

  return response;
}
