"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
      else setLoading(false);
    });
  }, [router]);

  if (loading) {
    return <p className="p-4">Loading...</p>;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <h1 className="text-3xl font-bold">
          outlier
        </h1>

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
