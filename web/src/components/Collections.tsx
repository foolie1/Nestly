/**
 * Money collected, by week or by month.
 *
 * One series, so no legend — the heading names it. The current period is the
 * emphasized column and carries its value on the cap; the tallest other column
 * is labeled too, and everything else is in the tooltip and the table view.
 */
import { useMemo, useState } from "react";
import { Table2, BarChart3 } from "lucide-react";
import { collections, type Bucket, type Payment } from "../billing";

type Props = { payments: Payment[]; facilityId?: string; heading?: string };

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const short = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}k` : `$${n}`);
const md = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Clean axis ticks: 0 and three steps of 1/2/2.5/5 × 10ⁿ. */
function ticks(max: number) {
  if (max <= 0) return { top: 1000, step: 250 };
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)!;
  return { top: step * Math.ceil(max / step), step };
}

export function Collections({ payments, facilityId, heading = "Money collected" }: Props) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [asTable, setAsTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const weeks = useMemo(() => collections(payments, { period: "week", count: 8, facilityId }), [payments, facilityId]);
  const months = useMemo(() => collections(payments, { period: "month", count: 6, facilityId }), [payments, facilityId]);
  const series = period === "week" ? weeks : months;

  const thisWeek = weeks[weeks.length - 1];
  const lastWeek = weeks[weeks.length - 2];
  const thisMonth = months[months.length - 1];
  const lastMonth = months[months.length - 2];

  const label = (b: Bucket) =>
    period === "week" ? (b.current ? "This week" : md(b.start)) : b.start.toLocaleDateString("en-US", { month: "short" });
  const longLabel = (b: Bucket) =>
    period === "week"
      ? `${b.current ? "This week" : "Week of"} ${md(b.start)}–${md(new Date(b.end.getTime() - 86_400_000))}`
      : b.start.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const max = Math.max(...series.map((b) => b.total));
  const { top, step } = ticks(max);
  const tickValues = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const maxIdx = series.findIndex((b) => b.total === max && !b.current);

  return (
    <section aria-labelledby="coll-h" className="bg-surface border border-line rounded-card p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h2 id="coll-h" className="font-semibold text-brand">{heading}</h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-line p-1 rounded-ctl" role="group" aria-label="Group by">
            {(["week", "month"] as const).map((p) => (
              <button key={p} onClick={() => { setPeriod(p); setHover(null); }} aria-pressed={period === p} className={`px-3 min-h-9 rounded-ctl text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${period === p ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-brand"}`}>
                {p === "week" ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>
          <button onClick={() => setAsTable((t) => !t)} aria-pressed={asTable} aria-label={asTable ? "Show as chart" : "Show as table"} title={asTable ? "Show as chart" : "Show as table"} className="w-10 h-10 flex items-center justify-center rounded-ctl border border-line text-muted hover:text-brand hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            {asTable ? <BarChart3 size={17} aria-hidden /> : <Table2 size={17} aria-hidden />}
          </button>
        </div>
      </div>

      {/* The numbers people actually came for */}
      <dl className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "This week so far", value: thisWeek.total, sub: `${thisWeek.count} payment${thisWeek.count === 1 ? "" : "s"}` },
          { label: "Last week", value: lastWeek.total, sub: `${lastWeek.count} payment${lastWeek.count === 1 ? "" : "s"}` },
          { label: "This month so far", value: thisMonth.total, sub: lastMonth.total ? `${money(lastMonth.total)} all of last month` : "" },
        ].map((s) => (
          <div key={s.label} className="min-w-0">
            <dt className="text-xs font-mono uppercase tracking-widest text-muted truncate">{s.label}</dt>
            <dd className="text-2xl sm:text-3xl font-bold text-brand mt-1 tabular-nums">{money(s.value)}</dd>
            <dd className="text-xs text-muted mt-0.5 truncate">{s.sub}</dd>
          </div>
        ))}
      </dl>

      {asTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{heading}, {period === "week" ? "by week" : "by month"}</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="text-left py-2 pr-3 text-xs font-mono uppercase tracking-widest text-muted font-medium">{period === "week" ? "Week" : "Month"}</th>
                <th scope="col" className="text-right py-2 px-3 text-xs font-mono uppercase tracking-widest text-muted font-medium">Payments</th>
                <th scope="col" className="text-right py-2 pl-3 text-xs font-mono uppercase tracking-widest text-muted font-medium">Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...series].reverse().map((b) => (
                <tr key={b.start.toISOString()}>
                  <th scope="row" className={`text-left py-2 pr-3 font-normal ${b.current ? "text-brand font-medium" : "text-ink"}`}>{longLabel(b)}</th>
                  <td className="text-right py-2 px-3 tabular-nums text-muted">{b.count}</td>
                  <td className="text-right py-2 pl-3 tabular-nums font-medium text-brand">{money(b.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* Y axis */}
          <div className="relative w-10 flex-shrink-0 h-44" aria-hidden>
            {tickValues.map((t) => (
              <span key={t} className="absolute right-0 text-[11px] font-mono text-muted tabular-nums translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>
                {short(t)}
              </span>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <div className="relative h-44">
              {/* Hairline gridlines */}
              {tickValues.map((t) => (
                <div key={t} className="absolute inset-x-0 border-t border-line" style={{ bottom: `${(t / top) * 100}%` }} aria-hidden />
              ))}
              <ol className="absolute inset-0 flex items-end" aria-label={`${heading} by ${period}`}>
                {series.map((b, i) => {
                  const h = top ? (b.total / top) * 100 : 0;
                  const showValue = b.current || i === maxIdx;
                  return (
                    <li key={b.start.toISOString()} className="relative flex-1 h-full flex items-end justify-center">
                      <button
                        type="button"
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(i)}
                        onBlur={() => setHover(null)}
                        aria-label={`${longLabel(b)}: ${money(b.total)} from ${b.count} payment${b.count === 1 ? "" : "s"}`}
                        className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent rounded"
                      />
                      {showValue && b.total > 0 && (
                        <span className="absolute text-[11px] font-mono font-semibold text-brand tabular-nums pointer-events-none" style={{ bottom: `calc(${h}% + 4px)` }}>
                          {short(b.total)}
                        </span>
                      )}
                      <span
                        aria-hidden
                        className={`relative w-6 max-w-[70%] rounded-t-[4px] pointer-events-none transition-colors ${b.current ? "bg-accent" : hover === i ? "bg-accent/70" : "bg-accent/40"}`}
                        style={{ height: `${h}%`, minHeight: b.total > 0 ? 2 : 0 }}
                      />
                      {hover === i && (
                        <div role="tooltip" className="absolute z-10 pointer-events-none left-1/2 -translate-x-1/2 whitespace-nowrap bg-brand text-white text-xs rounded-ctl px-2.5 py-1.5 shadow-lg" style={{ bottom: `calc(${h}% + 22px)` }}>
                          <p className="font-medium">{longLabel(b)}</p>
                          <p className="tabular-nums">{money(b.total)} · {b.count} payment{b.count === 1 ? "" : "s"}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
            <ol className="flex mt-1.5" aria-hidden>
              {series.map((b) => (
                <li key={b.start.toISOString()} className={`flex-1 text-center text-[11px] font-mono truncate ${b.current ? "text-brand font-semibold" : "text-muted"}`}>
                  {label(b)}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {period === "week" && (
        <p className="text-xs text-muted mt-4">
          Tuition is due on the 1st, so most money arrives in the week the 1st falls in — quiet weeks in between are normal, not a problem.
        </p>
      )}
    </section>
  );
}
