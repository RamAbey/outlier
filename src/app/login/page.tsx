"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else router.push("/");
  }

  async function handleSignup() {
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) setError(error.message);
    else router.push("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">
          Login
        </h1>

        <input
          className="w-full border rounded-lg p-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border rounded-lg p-3"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <button
          onClick={handleLogin}
          className="w-full bg-black text-white py-3 rounded-lg"
        >
          Login
        </button>

        <button
          onClick={handleSignup}
          className="w-full border py-3 rounded-lg"
        >
          Sign Up
        </button>
      </div>
    </main>
  );
}
