"use client";

import { FormEvent, useState } from "react";
import {
  countryOptions,
  industryOptions,
  roleOptions,
} from "@/lib/automation/AutomationDiscoveryOptions";

export default function CreateAutomationAssessmentPage() {
  const [organizationName, setOrganizationName] = useState("");
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [decisionMakerName, setDecisionMakerName] = useState("");
  const [decisionMakerRole, setDecisionMakerRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [decisionMakerEmail, setDecisionMakerEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");

  const selectedIndustry =
    industry === "other" ? customIndustry.trim() : industry;

  const selectedLocation =
    location === "other" ? customLocation.trim() : location;

  const selectedRole =
    decisionMakerRole === "other"
      ? customRole.trim()
      : decisionMakerRole;

  async function createAssessment(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !organizationName.trim() ||
      !decisionMakerName.trim() ||
      !selectedRole ||
      !decisionMakerEmail.trim()
    ) {
      setError(
        "Organization name, decision-maker name, role, and email are required."
      );
      return;
    }

    if (industry === "other" && !customIndustry.trim()) {
      setError("Please enter the industry.");
      return;
    }

    if (location === "other" && !customLocation.trim()) {
      setError("Please enter the location.");
      return;
    }

    if (decisionMakerRole === "other" && !customRole.trim()) {
      setError("Please enter the decision-maker role.");
      return;
    }

    setCreating(true);
    setError("");
    setLink("");

    try {
      const response = await fetch("/api/automation/assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organization: {
            name: organizationName.trim(),
            industry: selectedIndustry || undefined,
            location: selectedLocation || undefined,
          },
          decisionMaker: {
            name: decisionMakerName.trim(),
            role: selectedRole,
            email: decisionMakerEmail.trim(),
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to create the assessment."
        );
      }

      setLink(
        `${window.location.origin}/automation/assessment/${encodeURIComponent(
          result.publicToken
        )}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the assessment."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050B14] px-5 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
            Automation Intelligence
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Create an Automation Assessment
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Tell us a little about the organization and the person
            completing the assessment. We will guide the rest of the
            discovery.
          </p>
        </header>

        <form
          onSubmit={createAssessment}
          className="mt-8 rounded-2xl border border-white/10 bg-[#0A1422] p-7"
        >
          <section>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
              Organization
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-xs text-slate-400">
                  Organization name *
                </span>
                <input
                  value={organizationName}
                  onChange={(event) =>
                    setOrganizationName(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm outline-none focus:border-[#19D3C5]/40"
                  placeholder="Acme Ltd"
                />
              </label>

              <label>
                <span className="text-xs text-slate-400">
                  Industry
                </span>
                <select
                  value={industry}
                  onChange={(event) => {
                    setIndustry(event.target.value);
                    setCustomIndustry("");
                  }}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm outline-none focus:border-[#19D3C5]/40"
                >
                  <option value="">Select industry</option>
                  {industryOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {industry === "other" && (
                  <input
                    value={customIndustry}
                    onChange={(event) =>
                      setCustomIndustry(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm outline-none focus:border-[#19D3C5]/40"
                    placeholder="Enter your industry"
                  />
                )}
              </label>

              <label>
                <span className="text-xs text-slate-400">
                  Location
                </span>
                <select
                  value={location}
                  onChange={(event) => {
                    setLocation(event.target.value);
                    setCustomLocation("");
                  }}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm outline-none focus:border-[#19D3C5]/40"
                >
                  <option value="">Select country</option>
                  {countryOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {location === "other" && (
                  <input
                    value={customLocation}
                    onChange={(event) =>
                      setCustomLocation(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm outline-none focus:border-[#19D3C5]/40"
                    placeholder="Enter your country or location"
                  />
                )}
              </label>
            </div>
          </section>

          <section className="mt-8 border-t border-white/10 pt-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
              Decision maker
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-xs text-slate-400">
                  Full name *
                </span>
                <input
                  value={decisionMakerName}
                  onChange={(event) =>
                    setDecisionMakerName(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm outline-none focus:border-[#19D3C5]/40"
                  placeholder="Jane Doe"
                />
              </label>

              <label>
                <span className="text-xs text-slate-400">
                  Role *
                </span>
                <select
                  value={decisionMakerRole}
                  onChange={(event) => {
                    setDecisionMakerRole(event.target.value);
                    setCustomRole("");
                  }}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm outline-none focus:border-[#19D3C5]/40"
                >
                  <option value="">Select role</option>
                  {roleOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {decisionMakerRole === "other" && (
                  <input
                    value={customRole}
                    onChange={(event) =>
                      setCustomRole(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm outline-none focus:border-[#19D3C5]/40"
                    placeholder="Enter your role"
                  />
                )}
              </label>

              <label className="sm:col-span-2">
                <span className="text-xs text-slate-400">
                  Email *
                </span>
                <input
                  type="email"
                  value={decisionMakerEmail}
                  onChange={(event) =>
                    setDecisionMakerEmail(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm outline-none focus:border-[#19D3C5]/40"
                  placeholder="jane@example.com"
                />
              </label>
            </div>
          </section>

          {error && (
            <p className="mt-5 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-xs text-red-200">
              {error}
            </p>
          )}

          <div className="mt-7 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-[#19D3C5] px-6 py-3 text-xs font-bold text-[#050B14] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creating ? "Creating..." : "Create assessment link"}
            </button>
          </div>
        </form>

        {link && (
          <section className="mt-6 rounded-2xl border border-[#19D3C5]/15 bg-[#0A1422] p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6DE7DC]">
              Assessment link created
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Share this link with the decision maker. The link opens
              their workplace discovery assessment.
            </p>

            <div className="mt-5 break-all rounded-xl border border-white/10 bg-[#050B14] px-4 py-4 text-xs text-slate-300">
              {link}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  void navigator.clipboard.writeText(link)
                }
                className="rounded-xl border border-white/10 px-5 py-3 text-xs font-bold text-slate-300"
              >
                Copy link
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}