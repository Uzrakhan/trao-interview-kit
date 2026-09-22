"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function Home() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const endpoint =
        mode === "login"
          ? "/api/auth/login"
          : "/api/auth/register";

      await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (mode === "login") {
        router.push("/dashboard");
      } else {
        setMessage("Registration successful! You can now log in.");
        setMode("login");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            Trao Interview Kit
          </h1>

          <p className="mt-2 text-slate-400">
            Personalized interview preparation powered by research and AI.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-6 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg px-4 py-2 ${
                mode === "login"
                  ? "bg-white text-slate-950"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg px-4 py-2 ${
                mode === "register"
                  ? "bg-white text-slate-950"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white px-4 py-2 font-medium text-slate-950 disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Login"
                  : "Create account"}
            </button>
          </form>

          {message && (
            <p className="mt-4 rounded-lg bg-slate-800 p-3 text-sm text-slate-300">
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}