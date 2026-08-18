"use client";

import { useCallback, useEffect, useState } from "react";

type ImplementationTask = {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  status: string;
  owner?: string;
  dueDate?: string;
};

type Implementation = {
  projectId: string;
  status: string;
  startDate?: string;
  targetDate?: string;
  tasks: ImplementationTask[];
};

type ResponseData = {
  assessment: {
    id: string;
    organization: { name: string };
    status: string;
  };
  implementation: Implementation;
};

const statusLabels: Record<string, string> = {
  not_started: "Not started",
  planning: "Planning",
  building: "Building",
  testing: "Testing",
  user_acceptance: "User acceptance",
  live: "Live",
  paused: "Paused",
  completed: "Completed",
};

export default function AutomationImplementationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState("");
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (publicToken: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/automation/implementation?token=${encodeURIComponent(
          publicToken
        )}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to load the implementation plan."
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the implementation plan."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void params.then(({ token: publicToken }) => {
      setToken(publicToken);
      void load(publicToken);
    });
  }, [load, params]);

  async function updateTask(taskId: string, status: string) {
    if (!token) return;

    setUpdating(taskId);
    setError("");

    try {
      const response = await fetch(
        "/api/automation/implementation/task",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            taskId,
            status,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to update the task."
        );
      }

      setData((current) =>
        current
          ? {
              ...current,
              implementation: result.implementation,
            }
          : current
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the task."
      );
    } finally {
      setUpdating("");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#0A1422] p-8 text-sm text-slate-400">
          Preparing the implementation workspace...
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-400/20 bg-red-400/5 p-8">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const implementation = data.implementation;
  const completed = implementation.tasks.filter(
    (task) => task.status === "completed"
  ).length;
  const allTasksComplete =
    implementation.tasks.length > 0 &&
    completed === implementation.tasks.length;

  const measurementHref = token
    ? `/automation/assessment/${encodeURIComponent(token)}/measurement`
    : "#";

  return (
    <main className="min-h-screen bg-[#050B14] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
            Automation Intelligence · Implementation
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {data.assessment.organization.name}
          </h1>

          <div className="mt-5 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full border border-white/10 px-3 py-2 text-slate-400">
              Status:{" "}
              {statusLabels[implementation.status] ??
                implementation.status}
            </span>

            <span className="rounded-full border border-white/10 px-3 py-2 text-slate-400">
              {completed}/{implementation.tasks.length} tasks complete
            </span>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#0A1422] p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">
              Project
            </p>
            <p className="mt-2 text-sm font-semibold">
              {implementation.projectId}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0A1422] p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">
              Start date
            </p>
            <p className="mt-2 text-sm font-semibold">
              {implementation.startDate ?? "Not scheduled"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0A1422] p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">
              Target date
            </p>
            <p className="mt-2 text-sm font-semibold">
              {implementation.targetDate ?? "Not scheduled"}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#0A1422] p-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6DE7DC]">
              Delivery tasks
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Update each task as the automation project moves forward.
            </p>
          </div>

          {error && (
            <p className="mt-5 text-xs text-red-300">{error}</p>
          )}

          <div className="mt-6 space-y-3">
            {implementation.tasks.map((task) => {
              const title =
                task.name ??
                task.title ??
                "Implementation task";

              return (
                <div
                  key={task.id}
                  className="rounded-xl border border-white/10 bg-[#050B14] p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {title}
                      </p>

                      {task.description && (
                        <p className="mt-2 text-xs leading-6 text-slate-500">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-600">
                        {task.owner && (
                          <span>Owner: {task.owner}</span>
                        )}
                        {task.dueDate && (
                          <span>Due: {task.dueDate}</span>
                        )}
                      </div>
                    </div>

                    <select
                      value={task.status}
                      disabled={updating === task.id}
                      onChange={(event) =>
                        void updateTask(
                          task.id,
                          event.target.value
                        )
                      }
                      className="rounded-xl border border-white/10 bg-[#0A1422] px-4 py-3 text-xs text-slate-300 outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">
                        In progress
                      </option>
                      <option value="completed">
                        Completed
                      </option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {allTasksComplete && (
          <section className="mt-6 rounded-2xl border border-[#19D3C5]/15 bg-[#0A1422] p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6DE7DC]">
              Implementation complete
            </p>

            <h2 className="mt-3 text-xl font-semibold">
              Ready to measure the result?
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Record the post-implementation baseline comparison so the
              platform can calculate realized automation value.
            </p>

            <a
              href={measurementHref}
              className="mt-5 inline-flex rounded-xl bg-[#19D3C5] px-6 py-3 text-xs font-bold text-[#050B14]"
            >
              Begin measurement
            </a>
          </section>
        )}
      </div>
    </main>
  );
}