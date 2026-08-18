import { useMemo, useState } from "react";
import {
  automationActivityGroups,
  type DiscoveryOption,
} from "@/lib/automation/AutomationDiscoveryOptions";

type AutomationActivitySelectorProps = {
  selectedIds?: string[];
  customActivities?: string[];
  onChange: (
    selectedIds: string[],
    customActivities: string[]
  ) => void;
  disabled?: boolean;
};

export default function AutomationActivitySelector({
  selectedIds = [],
  customActivities = [],
  onChange,
  disabled = false,
}: AutomationActivitySelectorProps) {
  const [customActivity, setCustomActivity] = useState("");

  const selected = useMemo(
    () => new Set(selectedIds),
    [selectedIds]
  );

  function toggleActivity(activity: DiscoveryOption) {
    if (disabled) return;

    const next = new Set(selected);

    if (next.has(activity.id)) {
      next.delete(activity.id);
    } else {
      next.add(activity.id);
    }

    onChange([...next], customActivities);
  }

  function addCustomActivity() {
    const value = customActivity.trim();

    if (!value || disabled) return;

    if (
      customActivities.some(
        (item) => item.toLowerCase() === value.toLowerCase()
      )
    ) {
      setCustomActivity("");
      return;
    }

    onChange(selectedIds, [...customActivities, value]);
    setCustomActivity("");
  }

  function removeCustomActivity(value: string) {
    if (disabled) return;

    onChange(
      selectedIds,
      customActivities.filter((item) => item !== value)
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-white">
          What happens regularly in your workplace?
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Select everything that sounds familiar. You do not need to
          know what can be automated — we will identify that for you.
        </p>
      </div>

      <div className="space-y-7">
        {automationActivityGroups
          .filter((group) => group.id !== "custom")
          .map((group) => (
            <section key={group.id}>
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                {group.label}
              </h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {group.activities.map((activity) => {
                  const isSelected = selected.has(activity.id);

                  return (
                    <button
                      key={activity.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleActivity(activity)}
                      className={`rounded-xl border px-4 py-4 text-left text-sm transition ${
                        isSelected
                          ? "border-[#19D3C5]/50 bg-[#19D3C5]/10 text-white"
                          : "border-white/10 bg-[#050B14] text-slate-300 hover:border-[#19D3C5]/30"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <span className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                            isSelected
                              ? "border-[#19D3C5] bg-[#19D3C5] text-[#050B14]"
                              : "border-white/15 text-transparent"
                          }`}
                        >
                          ✓
                        </span>

                        <span>{activity.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
      </div>

      <section className="rounded-2xl border border-dashed border-white/10 bg-[#050B14] p-5">
        <p className="text-sm font-semibold text-white">
          Something else?
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Add an activity if you do not see it above.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={customActivity}
            onChange={(event) =>
              setCustomActivity(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomActivity();
              }
            }}
            disabled={disabled}
            placeholder="e.g. Preparing weekly field reports"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0A1422] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-[#19D3C5]/40 disabled:opacity-50"
          />

          <button
            type="button"
            onClick={addCustomActivity}
            disabled={disabled || !customActivity.trim()}
            className="rounded-xl border border-[#19D3C5]/30 px-5 py-3 text-xs font-bold text-[#6DE7DC] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add activity
          </button>
        </div>

        {customActivities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {customActivities.map((activity) => (
              <span
                key={activity}
                className="inline-flex items-center gap-2 rounded-full border border-[#19D3C5]/20 bg-[#19D3C5]/5 px-3 py-2 text-xs text-slate-300"
              >
                {activity}
                <button
                  type="button"
                  onClick={() => removeCustomActivity(activity)}
                  disabled={disabled}
                  aria-label={`Remove ${activity}`}
                  className="text-slate-500 hover:text-white disabled:opacity-40"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-slate-600">
        {selectedIds.length + customActivities.length} activities
        selected
      </p>
    </div>
  );
}