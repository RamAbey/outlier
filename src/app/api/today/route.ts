import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { formatInTimeZone } from "date-fns-tz";

const ET_TZ = "America/New_York";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser(token);

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = formatInTimeZone(new Date(), ET_TZ, "yyyy-MM-dd");

  const { data: sub, error: subErr } = await supabase
    .from("submissions")
    .select("number, submission_date")
    .eq("submission_date", today)
    .maybeSingle();

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 400 });
  }

  const { data: res, error: resErr } = await supabase
    .from("daily_results")
    .select("payout, chosen_number, count_for_number, submission_date")
    .eq("submission_date", today)
    .maybeSingle();

  if (resErr) {
    return NextResponse.json({ error: resErr.message }, { status: 400 });
  }

  return NextResponse.json({
    today,
    submitted: !!sub,
    submittedNumber: sub?.number ?? null,
    computed: !!res,
    payout: res?.payout ?? null,
    countForNumber: res?.count_for_number ?? null,
  });
}
