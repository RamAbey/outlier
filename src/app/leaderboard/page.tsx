"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Row = {
  username: string;
  total_payout: number;
};

function getEtWeekStartISO(): string {
  // Simple client-side week start (good enough for display).
  const now = new Date();
  const day = now.getDay(); // 0 Sun .. 6 Sat
  const diffToMon = (day + 6) % 7; // days since Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMon);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch("/api/leaderboard-week");
      const out = await res.json();
      if (out.error) {
        alert(out.error);
        setLoading(false);
        return;
      }

      setRows(out.rows);
      setWeekStart(out.weekStart);
      setLoading(false);
    })();
  }, [weekStart]);

  return (
    <main className="min-h-screen px-4 py-6 flex justify-center">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Weekly Leaderboard</h1>
          <Link className="text-sm underline text-gray-600" href="/">
            Back
          </Link>
        </div>

        <p className="text-sm text-gray-600">Week start: {weekStart}</p>

        {loading ? (
          <p>Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-gray-600">No results yet this week.</p>
        ) : (
          <div className="space-y-2">
            {rows.slice(0, 50).map((r, idx) => (
              <div
                key={r.username}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold w-6">{idx + 1}</span>
                  <span className="text-sm text-gray-700 truncate max-w-[180px]">
                    {r.username}
                  </span>
                </div>
                <span className="font-mono">
                  {r.total_payout.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
