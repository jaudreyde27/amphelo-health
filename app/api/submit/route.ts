import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Use service role for public waitlist insertions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from("waitlist")
      .insert({ email: email.toLowerCase().trim() });

    if (error) {
      // Handle duplicate email
      if (error.code === "23505") {
        return NextResponse.json({ success: true, message: "Already signed up" });
      }
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save signup" },
        { status: 500 }
      );
    }

    console.log("New waitlist signup:", email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing signup:", error);
    return NextResponse.json(
      { error: "Failed to process signup" },
      { status: 500 }
    );
  }
}
