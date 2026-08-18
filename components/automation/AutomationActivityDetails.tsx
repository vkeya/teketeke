import {
  effortOptions,
  frequencyOptions,
  painPointOptions,
  systemOptions,
} from "@/lib/automation/AutomationDiscoveryOptions";
import type { DiscoveryActivityDetail } from "@/lib/automation/AutomationAssessment";

type Activity = {
  id: string;
  label: string;
};

type AutomationActivityDetailsProps = {
  activities: Activity[];
  details: DiscoveryActivityDetail[];
  onChange: (details: DiscoveryActivityDetail[]) => void;
  disabled?: boolean;
};

function getDetail(
  details: DiscoveryActivityDetail[],
  activityId: string
): DiscoveryActivityDetail {
  return (
    details.find((item) => item.activityId === activityId) ?? {
      activityId,
    }
  );
}

export default function AutomationActivityDetails({
  activities,
  details,
  onChange,
  disabled = false,
}: AutomationActivityDetailsProps) {
  function updateDetail(
    activityId: string,
    patch: Partial<DiscoveryActivityDetail>
  ) {
    const current = getDetail(details, activityId);

    const next = details.filter(
      (item) => item.activityId !== activityId
    );

    next.push({
      ...current,
      ...patch,
      activityId,
    });

    onChange(next);
  }

  function toggleValue(
    activityId: string,
    field: "systemIds" | "painPointIds",
    value: string
  ) {
    const current = getDetail(details, activityId);
    const values = current[field] ?? [];

    const nextValues = values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];

    updateDetail(activityId, {
      [field]: nextValues,
    });
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-[#050B14] p-6 text-sm text-slate-500">
        Select at least one activity to tell us a little more about
        the work.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-white">
          A little more about the work
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          We only ask these questions about the activities you
          selected.
        </p>
      </div>

      {activities.map((activity) => {
        const detail = getDetail(details, activity.id);

        return (
          <section
            key={activity.id}
            className="rounded-2xl border border-white/10 bg-[#0A1422] p-6"
          >
            <h3 className="text-lg font-semibold text-white">
              {activity.label}
            </h3>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label>
                <span className="text-xs text-slate-400">
                  How often does this happen?
                </span>
                <select
                  value={detail.frequencyId ?? ""}
                  onChange={(event) =>
                    updateDetail(activity.id, {
                      frequencyId:
                        event.target.value || undefined,
                    })
                  }
                  disabled={disabled}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm text-white outline-none focus:border-[#19D3C5]/40 disabled:opacity-50"
                >
                  <option value="">Select frequency</option>
                  {frequencyOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-xs text-slate-400">
                  How much time does it usually take?
                </span>
                <select
                  value={detail.effortId ?? ""}
                  onChange={(event) =>
                    updateDetail(activity.id, {
                      effortId:
                        event.target.value || undefined,
                    })
                  }
                  disabled={disabled}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm text-white outline-none focus:border-[#19D3C5]/40 disabled:opacity-50"
                >
                  <option value="">Select time</option>
                  {effortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <fieldset className="mt-6">
              <legend className="text-xs text-slate-400">
                How is it handled today?
              </legend>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {systemOptions.map((option) => {
                  const checked =
                    detail.systemIds?.includes(option.id) ??
                    false;

                  return (
                    <label
                      key={option.id}
                      className={`cursor-pointer rounded-xl border px-4 py-3 text-sm ${
                        checked
                          ? "border-[#19D3C5]/40 bg-[#19D3C5]/5 text-white"
                          : "border-white/10 bg-[#050B14] text-slate-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleValue(
                            activity.id,
                            "systemIds",
                            option.id
                          )
                        }
                        disabled={disabled}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="mt-6">
              <legend className="text-xs text-slate-400">
                What makes this activity difficult?
              </legend>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {painPointOptions.map((option) => {
                  const checked =
                    detail.painPointIds?.includes(option.id) ??
                    false;

                  return (
                    <label
                      key={option.id}
                      className={`cursor-pointer rounded-xl border px-4 py-3 text-sm ${
                        checked
                          ? "border-[#19D3C5]/40 bg-[#19D3C5]/5 text-white"
                          : "border-white/10 bg-[#050B14] text-slate-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleValue(
                            activity.id,
                            "painPointIds",
                            option.id
                          )
                        }
                        disabled={disabled}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {detail.systemIds?.includes("other") && (
              <label className="mt-5 block">
                <span className="text-xs text-slate-400">
                  What system or tool do you use?
                </span>
                <input
                  value={detail.customSystem ?? ""}
                  onChange={(event) =>
                    updateDetail(activity.id, {
                      customSystem: event.target.value,
                    })
                  }
                  disabled={disabled}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-[#19D3C5]/40 disabled:opacity-50"
                  placeholder="e.g. Sage, QuickBooks, internal system"
                />
              </label>
            )}

            {detail.painPointIds?.includes("other") && (
              <label className="mt-5 block">
                <span className="text-xs text-slate-400">
                  Tell us about the problem.
                </span>
                <input
                  value={detail.customPainPoint ?? ""}
                  onChange={(event) =>
                    updateDetail(activity.id, {
                      customPainPoint: event.target.value,
                    })
                  }
                  disabled={disabled}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-[#19D3C5]/40 disabled:opacity-50"
                  placeholder="Describe what makes this difficult"
                />
              </label>
            )}
          </section>
        );
      })}
    </div>
  );
}