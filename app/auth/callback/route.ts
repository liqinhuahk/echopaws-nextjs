import { createServerSupabaseClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/account";

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(new URL("/login?error=Please%20configure%20Supabase%20environment%20variables.", request.url));
  }

  if (code) {
    const supabase = createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
