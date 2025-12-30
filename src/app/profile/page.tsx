"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data: prof, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (error) {
        setStatus(error.message);
      } else if (prof?.username) {
        setUsername(prof.username);
      }

      setLoading(false);
    })();
  }, [router]);

  async function save() {
    setStatus(null);
    const u = username.trim();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(u)) {
      setStatus("Username must be 3–20 chars: letters, numbers, underscore.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      router.push("/login");
      return;
    }

    // Upsert profile
    const { error } = await supabase.from("profiles").upsert(
      { user_id: user.id, username: u, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

    if (error) setStatus(error.message);
    else {
      setStatus("Saved!");
      router.push("/");
    }
  }

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Your Profile</h1>

        <input
          className="w-full border rounded-lg p-3"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {status && <p className="text-sm text-gray-700">{status}</p>}

        <button
          onClick={save}
          className="w-full bg-black text-white py-3 rounded-lg"
        >
          Save
        </button>
      </div>
    </main>
  );
}
