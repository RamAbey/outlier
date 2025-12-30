import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { formatInTimeZone } from "date-fns-tz";

const ET_TZ = "America/New_York";

function etDateString(d: Date) {
  return formatInTimeZone(d, ET_TZ, "yyyy-MM-dd");
}


export async function POST(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_COMPUTE_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
  );


  const submissionDate = etDateString(new Date());

  // Prevent recomputation
  const { data: alreadyRan, error: runErr } = await supabase
    .from("daily_runs")
    .select("submission_date")
    .eq("submission_date", submissionDate)
    .maybeSingle();

  if (runErr) {
    return NextResponse.json({ error: runErr.message }, { status: 400 });
  }
  if (alreadyRan) {
    return NextResponse.json(
      { error: `Already computed for ${submissionDate}` },
      { status: 400 }
    );
  }

  // Fetch submissions for the day
  const { data: subs, error: subsErr } = await supabase
    .from("submissions")
    .select("user_id, number")
    .eq("submission_date", submissionDate);

  if (subsErr) {
    return NextResponse.json({ error: subsErr.message }, { status: 400 });
  }
  if (!subs || subs.length === 0) {
    // Still mark as run to avoid repeated attempts if you want; we'll skip marking.
    return NextResponse.json({ error: "No submissions for today" }, { status: 400 });
  }

  // Count picks per number
  const counts = new Map<number, number>();
  for (const s of subs) {
    counts.set(s.number, (counts.get(s.number) ?? 0) + 1);
  }

  // Build daily_results rows
  const rows = subs.map((s) => {
    const c = counts.get(s.number)!;
    return {
      user_id: s.user_id,
      submission_date: submissionDate,
      chosen_number: s.number,
      count_for_number: c,
      payout: s.number / c,
    };
  });

  // Insert results + mark run
  const { error: insErr } = await supabase.from("daily_results").insert(rows);
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 400 });
  }

  const { error: markErr } = await supabase.from("daily_runs").insert({
    submission_date: submissionDate,
  });
  if (markErr) {
    return NextResponse.json({ error: markErr.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    submissionDate,
    computedUsers: rows.length,
  });
}
