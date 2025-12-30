import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { formatInTimeZone } from "date-fns-tz";

const ET_TZ = "America/New_York";

export async function POST(req: Request) {
  const { number } = await req.json();

  if (typeof number !== "number" || number < 1 || number > 100) {
    return NextResponse.json({ error: "Invalid number" }, { status: 400 });
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create an authenticated Supabase client for this request using the user's JWT
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  // Verify token / get user
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser(token);

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submissionDate = formatInTimeZone(new Date(), ET_TZ, "yyyy-MM-dd");

  const { error } = await supabase.from("submissions").insert({
    user_id: user.id,
    number,
    submission_date: submissionDate,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
