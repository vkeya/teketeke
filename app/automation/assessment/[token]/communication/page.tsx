"use client";

import { useCallback, useEffect, useState } from "react";

type Communication = {
  status?: "sent" | "delivery_failed" | "not_sent";
  subject: string;
  headline: string;
  message: string;
  channel: "email" | "in_app" | "public_link";
  callToAction: string;
  reportToken: string;
  timelineSummary?: string;
};

type CommunicationResponse = {
  assessment: {
    id: string;
    organization: { name: string };
    decisionMaker?: { name?: string; email?: string };
    status: string;
  };
  communication: Communication;
};

export default function AutomationCommunicationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState("");
  const [data, setData] =
    useState<CommunicationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadCommunication = useCallback(
    async (publicToken: string) => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/automation/communication?token=${encodeURIComponent(
            publicToken
          )}`,
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ??
              "Unable to prepare the communication."
          );
        }

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to prepare the communication."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void params.then(({ token: publicToken }) => {
      setToken(publicToken);
      void loadCommunication(publicToken);
    });
  }, [loadCommunication, params]);

  async function sendCommunication() {
    if (!token || sending || data?.communication.status === "sent") {
      return;
    }

    const confirmed = window.confirm(
      data?.communication.status === "delivery_failed"
        ? "Retry delivery of this automation assessment?"
        : "Send this automation assessment to the decision maker?"
    );

    if (!confirmed) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch(
        "/api/automation/communication/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "The communication could not be delivered."
        );
      }

      await loadCommunication(token);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The communication could not be delivered."
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#0A1422] p-8 text-sm text-slate-400">
          Preparing communication...
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

  const { communication } = data;
  const status = communication.status ?? "not_sent";
  const isSent = status === "sent";
  const isFailed = status === "delivery_failed";
  const recipientEmail = data.assessment.decisionMaker?.email;

  return (
    <main className="min-h-screen bg-[#050B14] px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
            Automation Intelligence · Communication
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {data.assessment.organization.name}
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            Review and manage the decision-maker communication.
          </p>
        </header>

        <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0A1422]">
          <div className="border-b border-white/10 px-7 py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
                  Recipient
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {data.assessment.decisionMaker?.name ??
                    "Decision maker"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {recipientEmail ?? "No email available"}
                </p>
              </div>

              <StatusBadge status={status} />
            </div>
          </div>

          <div className="p-7">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
              Subject
            </p>
            <p className="mt-2 text-lg font-semibold">
              {communication.subject}
            </p>

            <div className="mt-7 border-t border-white/10 pt-7">
              <p className="text-xl font-semibold">
                {communication.headline}
              </p>

              <p className="mt-5 text-sm leading-7 text-slate-300">
                {communication.message}
              </p>

              {communication.timelineSummary && (
                <div className="mt-6 rounded-xl border border-white/10 bg-[#050B14] p-5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
                    Timeline
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {communication.timelineSummary}
                  </p>
                </div>
              )}

              <div className="mt-7">
                <span className="inline-flex rounded-xl bg-[#19D3C5] px-5 py-3 text-sm font-semibold text-[#050B14]">
                  {communication.callToAction}
                </span>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#0A1422] p-7">
          {isSent ? (
            <div>
              <StatusBadge status="sent" />
              <p className="mt-3 text-sm text-slate-300">
                The automation assessment communication has been
                delivered. Sending is disabled to prevent duplicates.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                  {isFailed
                    ? "Delivery failed"
                    : "Ready to send"}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {isFailed
                    ? "The previous delivery failed. You can retry it."
                    : "Nothing will be sent until you explicitly confirm."}
                </p>
              </div>

              <button
                type="button"
                onClick={sendCommunication}
                disabled={
                  sending ||
                  !recipientEmail
                }
                className="rounded-xl bg-[#19D3C5] px-5 py-3 text-sm font-semibold text-[#050B14] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending
                  ? "Sending..."
                  : isFailed
                    ? "Retry delivery"
                    : "Send assessment"}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: "sent" | "delivery_failed" | "not_sent";
}) {
  const label =
    status === "sent"
      ? "Sent"
      : status === "delivery_failed"
        ? "Delivery failed"
        : "Not sent";

  return (
    <span className="inline-flex rounded-full border border-white/10 bg-[#050B14] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
      {label}
    </span>
  );
}