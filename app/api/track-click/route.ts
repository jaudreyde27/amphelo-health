import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { buttonId } = await request.json();
    const supabase = await createClient();

    // Generate a simple visitor ID from user agent + timestamp for basic tracking
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";

    await supabase.from("button_clicks").insert({
      button_id: buttonId,
      user_agent: userAgent,
      referrer: referrer,
    });

    return NextResponse.json({ success: true });
  } catch {
    // Fail silently - don't block user navigation
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
