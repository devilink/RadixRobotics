import { WEEKDAYS } from "@/lib/erp/format";

export function WeekdayPicker({ name, label, defaultDays, error }: {
  name: string;
  label: string;
  defaultDays: number[];
  error?: string;
}) {
  const id = `${name}-label`;
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-zinc-200" id={id}>{label}</p>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-1.5">
        {WEEKDAYS.map((d) => (
          <label key={d.n} className="inline-flex cursor-pointer items-center rounded-lg border border-zinc-700 px-2.5 py-1.5 text-sm has-[:checked]:border-brand-500/50 has-[:checked]:bg-brand-500/15 has-[:checked]:text-brand-400 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 has-[:focus-visible]:ring-offset-2">
            <input type="checkbox" name={name} value={d.n} defaultChecked={defaultDays.includes(d.n)} className="accent-brand-500 sr-only" />
            {d.short}
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-rose-400">{error}</p>}
    </div>
  );
}
