"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [todayInfo, setTodayInfo] = useState<null | {
    today: string;
    submitted: boolean;
    submittedNumber: number | null;
    computed: boolean;
    payout: number | null;
    countForNumber: number | null;
  }>(null);


  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) router.push("/login");
      else {
        setLoading(false);
        const ok = await ensureProfile();
        if (!ok) return;
        await refreshToday();
      }
    });
  }, [router]);

  async function ensureProfile() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return false;

    const { data: prof } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!prof?.username) {
      router.push("/profile");
      return false;
    }
    return true;
  }

  async function refreshToday() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.push("/login");
      return;
    }

    const res = await fetch("/api/today", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const out = await res.json();
    if (out.error) {
      alert(out.error);
      return;
    }
    setTodayInfo(out);
  }


  if (loading) {
    return <p className="p-4">Loading...</p>;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-3xl font-bold">
          outlier.
        </h1>

        <input
          type="number"
          min={1}
          max={100}
          placeholder="Enter a number (1–100)"
          className="w-full border rounded-lg p-3 text-center"
          id="number-input"
        />

        <button
          className="w-full bg-black text-white py-3 rounded-lg disabled:opacity-50"
          disabled={todayInfo?.submitted ?? false}
          onClick={async () => {
            const input = document.getElementById("number-input") as HTMLInputElement;
            const number = Number(input.value);

            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;

            if (!token) {
              alert("Not logged in");
              router.push("/login");
              return;
            }

            const res = await fetch("/api/submit", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ number }),
            });

            const out = await res.json();
            if (out.error) alert(out.error);
            else {
              alert("Submitted!");
              await refreshToday();
            }
          }}
        >
          {todayInfo?.submitted ? "Submitted today" : "Submit"}
        </button>

        {todayInfo && (
          <div className="text-sm text-gray-700 space-y-1">
            <p>ET date: <span className="font-mono">{todayInfo.today}</span></p>
            <p>
              Submission:{" "}
              {todayInfo.submitted
                ? `✅ ${todayInfo.submittedNumber}`
                : "❌ not submitted"}
            </p>
            <p>
              Results:{" "}
              {todayInfo.computed
                ? `✅ payout ${Number(todayInfo.payout).toFixed(2)} (count ${todayInfo.countForNumber})`
                : "⏳ not computed yet"}
            </p>
          </div>
        )}

        <a className="text-sm underline text-gray-600" href="/leaderboard">
          Weekly Leaderboard
        </a>
        <a className="text-sm underline text-gray-600" href="/profile">
          Profile
        </a>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
          className="text-sm text-gray-500 underline"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
