/**
 * Draws any paperwork template, either for filling in or for reading back.
 *
 * The office reviews a submission in exactly the layout the family filled it
 * in, which keeps "what did they actually say" from ever being a question.
 */
import { Plus, Trash2 } from "lucide-react";
import type { EmergencyContact } from "../data";
import { isVisible, type AllergyRow, type Field, type FormData, type FormTemplate } from "../forms";

type Props = {
  template: FormTemplate;
  data: FormData;
  onChange?: (next: FormData) => void;
  errors?: Record<string, string>;
  readOnly?: boolean;
};

const inputCls =
  "w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent aria-[invalid=true]:border-danger";

const labelCls = "text-sm font-semibold text-brand block mb-1.5";

/** Formats as (954) 555-0142 while typing, without fighting the cursor much. */
function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function FormFields({ template, data, onChange, errors = {}, readOnly }: Props) {
  const set = (id: string, value: unknown) => onChange?.({ ...data, [id]: value });
  const fid = (f: Field) => `f-${template.id}-${f.id}`;

  return (
    <div className="space-y-7">
      {template.sections.map((section) => {
        const fields = section.fields.filter((f) => isVisible(f, data));
        if (fields.length === 0) return null;
        return (
          <fieldset key={section.title} className="space-y-4 min-w-0">
            <legend className="text-xs font-mono uppercase tracking-widest text-muted mb-1">{section.title}</legend>
            {section.intro && !readOnly && <p className="text-sm text-muted -mt-1">{section.intro}</p>}

            {fields.map((f) => {
              const id = fid(f);
              const err = errors[f.id];
              const describedBy = [err && `${id}-err`, f.help && `${id}-help`].filter(Boolean).join(" ") || undefined;
              const v = data[f.id];

              if (readOnly) return <ReadValue key={f.id} field={f} value={v} />;

              const errorLine = err ? (
                <p id={`${id}-err`} className="text-xs text-danger mt-1.5 font-medium">
                  {err}
                </p>
              ) : null;
              const helpLine = f.help ? (
                <p id={`${id}-help`} className="text-xs text-muted mt-1">
                  {f.help}
                </p>
              ) : null;

              switch (f.type) {
                case "checkbox":
                  return (
                    <div key={f.id}>
                      <label className={`flex items-start gap-3 cursor-pointer rounded-card border p-3.5 ${err ? "border-danger bg-danger-soft/40" : v === true ? "border-accent bg-accent-soft/50" : "border-line"}`}>
                        <input
                          id={id}
                          type="checkbox"
                          checked={v === true}
                          onChange={(e) => set(f.id, e.target.checked)}
                          aria-invalid={!!err}
                          aria-describedby={describedBy}
                          className="mt-0.5 w-5 h-5 flex-shrink-0 accent-[var(--t-accent)]"
                        />
                        <span className="text-sm text-ink">{f.label}</span>
                      </label>
                      {errorLine}
                    </div>
                  );

                case "radio":
                  return (
                    <fieldset key={f.id} aria-describedby={describedBy}>
                      <legend className={labelCls}>
                        {f.label} {f.required && <span className="text-danger">*</span>}
                      </legend>
                      <div className="space-y-2" role="radiogroup" aria-invalid={!!err}>
                        {f.options!.map((o) => {
                          const on = v === o;
                          return (
                            <label key={o} className={`flex items-center gap-3 border-2 rounded-card px-3.5 py-3 min-h-12 cursor-pointer transition-colors ${on ? "border-accent bg-accent-soft" : "border-line hover:border-accent/50"}`}>
                              <input type="radio" name={id} checked={on} onChange={() => set(f.id, o)} className="w-4 h-4 flex-shrink-0 accent-[var(--t-accent)]" />
                              <span className="text-sm text-ink">{o}</span>
                            </label>
                          );
                        })}
                      </div>
                      {helpLine}
                      {errorLine}
                    </fieldset>
                  );

                case "select":
                  return (
                    <div key={f.id}>
                      <label htmlFor={id} className={labelCls}>
                        {f.label} {f.required && <span className="text-danger">*</span>}
                      </label>
                      <select id={id} value={String(v ?? "")} onChange={(e) => set(f.id, e.target.value)} aria-invalid={!!err} aria-describedby={describedBy} className={inputCls}>
                        <option value="">Choose…</option>
                        {f.options!.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                      {helpLine}
                      {errorLine}
                    </div>
                  );

                case "textarea":
                  return (
                    <div key={f.id}>
                      <label htmlFor={id} className={labelCls}>
                        {f.label} {f.required && <span className="text-danger">*</span>}
                      </label>
                      <textarea
                        id={id}
                        rows={3}
                        value={String(v ?? "")}
                        onChange={(e) => set(f.id, e.target.value)}
                        placeholder={f.placeholder}
                        aria-invalid={!!err}
                        aria-describedby={describedBy}
                        className={`${inputCls} py-2.5 resize-none`}
                      />
                      {helpLine}
                      {errorLine}
                    </div>
                  );

                case "contacts":
                  return (
                    <div key={f.id}>
                      <ContactsEditor id={id} rows={(v as EmergencyContact[]) ?? []} onChange={(rows) => set(f.id, rows)} min={f.min ?? 1} invalid={!!err} />
                      {errorLine}
                    </div>
                  );

                case "allergies":
                  return (
                    <div key={f.id}>
                      <AllergiesEditor id={id} rows={(v as AllergyRow[]) ?? []} onChange={(rows) => set(f.id, rows)} invalid={!!err} />
                      {errorLine}
                    </div>
                  );

                default:
                  return (
                    <div key={f.id}>
                      <label htmlFor={id} className={labelCls}>
                        {f.label} {f.required && <span className="text-danger">*</span>}
                      </label>
                      <input
                        id={id}
                        type={f.type === "tel" ? "tel" : f.type === "email" ? "email" : f.type === "date" ? "date" : "text"}
                        inputMode={f.type === "tel" ? "tel" : undefined}
                        autoComplete={f.type === "tel" ? "tel" : f.type === "email" ? "email" : undefined}
                        value={String(v ?? "")}
                        onChange={(e) => set(f.id, f.type === "tel" ? formatPhone(e.target.value) : e.target.value)}
                        placeholder={f.placeholder}
                        aria-invalid={!!err}
                        aria-describedby={describedBy}
                        className={inputCls}
                      />
                      {helpLine}
                      {errorLine}
                    </div>
                  );
              }
            })}
          </fieldset>
        );
      })}
    </div>
  );
}

function ReadValue({ field, value }: { field: Field; value: unknown }) {
  let body: React.ReactNode;
  if (field.type === "checkbox") {
    body = value === true ? <span className="text-success font-medium">✓ Agreed</span> : <span className="text-danger">Not agreed</span>;
  } else if (field.type === "contacts") {
    const rows = (value as EmergencyContact[]) ?? [];
    body = (
      <ol className="space-y-1.5 list-decimal pl-5">
        {rows.filter((r) => r.name).map((r, i) => (
          <li key={i} className="text-sm">
            <span className="font-medium text-brand">{r.name}</span> <span className="text-muted">· {r.relationship} · {r.phone}</span>
          </li>
        ))}
      </ol>
    );
  } else if (field.type === "allergies") {
    const rows = (value as AllergyRow[]) ?? [];
    body = (
      <ul className="space-y-2">
        {rows.map((a, i) => (
          <li key={i} className="border-l-2 border-danger pl-3 text-sm">
            <p className="font-semibold text-brand">
              {a.name} <span className="text-xs font-mono uppercase text-danger">{a.severity}</span>
            </p>
            <p className="text-xs text-muted">Reaction: {a.reaction}</p>
            <p className="text-xs text-ink">{a.response}</p>
          </li>
        ))}
      </ul>
    );
  } else {
    const s = String(value ?? "").trim();
    body = s ? <span className="text-sm text-ink whitespace-pre-wrap">{s}</span> : <span className="text-sm text-faint">—</span>;
  }
  return (
    <div>
      <p className="text-xs text-muted mb-0.5">{field.label}</p>
      {body}
    </div>
  );
}

function ContactsEditor({ id, rows, onChange, min, invalid }: { id: string; rows: EmergencyContact[]; onChange: (r: EmergencyContact[]) => void; min: number; invalid: boolean }) {
  const list = rows.length >= min ? rows : [...rows, ...Array.from({ length: min - rows.length }, () => ({ name: "", relationship: "", phone: "" }))];
  const update = (i: number, patch: Partial<EmergencyContact>) => onChange(list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-3">
      {list.map((r, i) => (
        <div key={i} className={`border rounded-card p-3.5 ${invalid ? "border-danger" : "border-line"}`}>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-mono uppercase tracking-widest text-muted">
              {i === 0 ? "Call first" : `Contact ${i + 1}`}
            </p>
            {list.length > min && (
              <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label={`Remove contact ${i + 1}`} className="w-9 h-9 flex items-center justify-center rounded-ctl text-muted hover:text-danger hover:bg-danger-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <Trash2 size={16} aria-hidden />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label htmlFor={`${id}-${i}-name`} className="text-xs text-muted block mb-1">Name</label>
              <input id={`${id}-${i}-name`} value={r.name} onChange={(e) => update(i, { name: e.target.value })} className={inputCls} autoComplete="off" />
            </div>
            <div>
              <label htmlFor={`${id}-${i}-rel`} className="text-xs text-muted block mb-1">Relationship</label>
              <input id={`${id}-${i}-rel`} value={r.relationship} onChange={(e) => update(i, { relationship: e.target.value })} placeholder="Grandmother" className={inputCls} />
            </div>
            <div>
              <label htmlFor={`${id}-${i}-phone`} className="text-xs text-muted block mb-1">Phone</label>
              <input id={`${id}-${i}-phone`} type="tel" inputMode="tel" value={r.phone} onChange={(e) => update(i, { phone: formatPhone(e.target.value) })} className={inputCls} />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, { name: "", relationship: "", phone: "" }])} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent min-h-11 px-3 rounded-ctl hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        <Plus size={16} aria-hidden /> Add another contact
      </button>
    </div>
  );
}

const SEVERITIES: AllergyRow["severity"][] = ["mild", "moderate", "severe"];
const KINDS: { id: AllergyRow["kind"]; label: string }[] = [
  { id: "food", label: "Food" },
  { id: "medication", label: "Medication" },
  { id: "environmental", label: "Insects, pollen, latex…" },
  { id: "other", label: "Other" },
];

function AllergiesEditor({ id, rows, onChange, invalid }: { id: string; rows: AllergyRow[]; onChange: (r: AllergyRow[]) => void; invalid: boolean }) {
  const blank: AllergyRow = { name: "", kind: "food", severity: "moderate", reaction: "", response: "" };
  const list = rows.length ? rows : [blank];
  const update = (i: number, patch: Partial<AllergyRow>) => onChange(list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-3">
      {list.map((r, i) => (
        <div key={i} className={`border rounded-card p-3.5 space-y-3 ${invalid ? "border-danger" : r.severity === "severe" ? "border-danger-line bg-danger-soft/30" : "border-line"}`}>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <label htmlFor={`${id}-${i}-name`} className="text-xs text-muted block mb-1">Allergic to</label>
              <input id={`${id}-${i}-name`} value={r.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="e.g. Peanuts" className={inputCls} />
            </div>
            {list.length > 1 && (
              <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label={`Remove allergy ${i + 1}`} className="mt-5 w-11 h-11 flex items-center justify-center rounded-ctl text-muted hover:text-danger hover:bg-danger-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent flex-shrink-0">
                <Trash2 size={16} aria-hidden />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${id}-${i}-kind`} className="text-xs text-muted block mb-1">Type</label>
              <select id={`${id}-${i}-kind`} value={r.kind} onChange={(e) => update(i, { kind: e.target.value as AllergyRow["kind"] })} className={inputCls}>
                {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs text-muted mb-1" id={`${id}-${i}-sev`}>How serious</p>
              <div className="flex gap-1.5" role="radiogroup" aria-labelledby={`${id}-${i}-sev`}>
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={r.severity === s}
                    onClick={() => update(i, { severity: s })}
                    className={`flex-1 min-h-11 rounded-ctl text-sm font-medium capitalize border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      r.severity === s ? (s === "severe" ? "border-danger bg-danger text-white" : "border-accent bg-accent-soft text-accent") : "border-line text-muted hover:border-accent/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label htmlFor={`${id}-${i}-reaction`} className="text-xs text-muted block mb-1">What a reaction looks like</label>
            <input id={`${id}-${i}-reaction`} value={r.reaction} onChange={(e) => update(i, { reaction: e.target.value })} placeholder="Hives, swelling, trouble breathing…" className={inputCls} />
          </div>
          <div>
            <label htmlFor={`${id}-${i}-response`} className="text-xs text-muted block mb-1">What staff should do</label>
            <textarea id={`${id}-${i}-response`} rows={2} value={r.response} onChange={(e) => update(i, { response: e.target.value })} placeholder="e.g. EpiPen in her backpack, call 911, then me." className={`${inputCls} py-2.5 resize-none`} />
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, blank])} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent min-h-11 px-3 rounded-ctl hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        <Plus size={16} aria-hidden /> Add another allergy
      </button>
    </div>
  );
}
