import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { formatInTimeZone } from "date-fns-tz";

const ET_TZ = "America/New_York";

// Monday start of week in ET
function etWeekStartISO(d: Date) {
  // Get ET date parts reliably
  const etDateStr = formatInTimeZone(d, ET_TZ, "yyyy-MM-dd");
  const [y, m, day] = etDateStr.split("-").map(Number);
  const etMidnight = new Date(Date.UTC(y, m - 1, day, 0, 0, 0));

  // day of week in ET using the original date but formatted
  const dow = Number(formatInTimeZone(d, ET_TZ, "i")); // 1=Mon ... 7=Sun
  const diffToMon = dow - 1;

  const monday = new Date(etMidnight);
  monday.setUTCDate(monday.getUTCDate() - diffToMon);

  return formatInTimeZone(monday, ET_TZ, "yyyy-MM-dd");
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const weekStart = etWeekStartISO(new Date());

  const { data, error } = await supabase
    .from("daily_results")
    .select("user_id, payout, submission_date")
    .gte("submission_date", weekStart);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const totals = new Map<string, number>();
  for (const r of data ?? []) {
    totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + Number(r.payout));
  }

  const rows = Array.from(totals.entries())
    .map(([user_id, total_payout]) => ({ user_id, total_payout }))
    .sort((a, b) => b.total_payout - a.total_payout)
    .slice(0, 50);

    const userIds = rows.map((r) => r.user_id);

    const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("user_id, username")
    .in("user_id", userIds);

    if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 400 });
    }

    const nameMap = new Map<string, string>();
    for (const p of profiles ?? []) {
    nameMap.set(p.user_id, p.username);
    }

    const rowsWithNames = rows.map((r) => ({
    username: nameMap.get(r.user_id) ?? r.user_id.slice(0, 8),
    total_payout: r.total_payout,
    }));


  return NextResponse.json({ weekStart, rows: rowsWithNames });
}
