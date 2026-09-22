"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Kit = {
  _id: string;
  status: "generating" | "completed" | "failed";
  stage: string;
  input: {
    jd: string;
    companyUrl: string;
    days: number;
    location: string;
  };
  error?: string;
  createdAt: string;
};

type KitsResponse = {
  kits: Kit[];
};

export default function DashboardPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadKits() {
      try {
        const data = await apiFetch<KitsResponse>("/api/kits");
        setKits(data.kits);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load kits"
        );
      } finally {
        setLoading(false);
      }
    }

    loadKits();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <p className="text-sm text-slate-400">Trao Interview Kit</p>

          <div className="mt-2 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                Your Interview Kits
              </h1>

              <p className="mt-2 text-slate-400">
                Create and practice personalized interview preparation kits.
              </p>
            </div>

            <Link
              href="/dashboard/new"
              className="rounded-lg bg-white px-4 py-2 font-medium text-slate-950"
            >
              + New Kit
            </Link>
          </div>
        </header>

        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            Loading your kits...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-900 bg-red-950/40 p-6 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && kits.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center">
            <h2 className="text-xl font-semibold">
              No interview kits yet
            </h2>

            <p className="mt-2 text-slate-400">
              Create your first kit from a job description.
            </p>

            <Link
              href="/dashboard/new"
              className="mt-6 inline-block rounded-lg bg-white px-4 py-2 font-medium text-slate-950"
            >
              Create your first kit
            </Link>
          </div>
        )}

        {!loading && kits.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {kits.map((kit) => (
              <Link
                key={kit._id}
                href={`/kits/${kit._id}`}
                className="block rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-600"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {kit.input.jd.slice(0, 70)}
                      {kit.input.jd.length > 70 ? "..." : ""}
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                      {kit.input.companyUrl}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      kit.status === "completed"
                        ? "bg-green-950 text-green-300"
                        : kit.status === "failed"
                          ? "bg-red-950 text-red-300"
                          : "bg-yellow-950 text-yellow-300"
                    }`}
                  >
                    {kit.status}
                  </span>
                </div>

                <div className="mt-5 text-sm text-slate-400">
                  <p>{kit.stage}</p>

                  <p className="mt-1">
                    {kit.input.days} day preparation plan
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}