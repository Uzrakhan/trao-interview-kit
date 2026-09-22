"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type GenerateResponse = {
  id: string;
  status: string;
};

export default function NewKitPage() {
  const router = useRouter();

  const [jd, setJd] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [days, setDays] = useState(3);
  const [location, setLocation] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<GenerateResponse>(
        "/api/kits/generate",
        {
          method: "POST",
          body: JSON.stringify({
            jd,
            companyUrl,
            days,
            location,
          }),
        }
      );

      router.push(`/kits/${data.id}`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to start generation"
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Back to dashboard
        </button>

        <h1 className="text-3xl font-bold">
          Create Interview Kit
        </h1>

        <p className="mt-2 text-slate-400">
          Add a job description and company URL to generate a
          personalized preparation plan.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Job Description
            </label>

            <textarea
              value={jd}
              onChange={(event) => setJd(event.target.value)}
              required
              minLength={1}
              rows={10}
              placeholder="Paste the job description here..."
              className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-white"
            />

            <p className="mt-1 text-xs text-slate-500">
              {jd.length} characters
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Company URL
            </label>

            <input
              type="url"
              value={companyUrl}
              onChange={(event) => setCompanyUrl(event.target.value)}
              required
              placeholder="https://example.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-white"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Days Available
              </label>

              <input
                type="number"
                min={1}
                max={60}
                value={days}
                onChange={(event) =>
                  setDays(Number(event.target.value))
                }
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Location
              </label>

              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="e.g. Noida, India"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-white"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-3 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Starting interview kit..."
              : "Generate Interview Kit"}
          </button>
        </form>
      </div>
    </main>
  );
}