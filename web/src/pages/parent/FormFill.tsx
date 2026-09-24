/**
 * A family filling in one piece of paperwork.
 *
 * Starts pre-filled with whatever the center already knows, shows the office's
 * note at the top when a form has been sent back, and won't submit until every
 * required field, the typed name and the drawn signature are all there.
 */
import { useRef, useState } from "react";
import { AlertTriangle, Clock, Send, X } from "lucide-react";
import type { Child } from "../../data";
import { prefill, useForms, validate, type FormData, type FormTemplate, type Submission } from "../../forms";
import { FormFields } from "../../components/FormFields";
import { SignaturePad } from "../../signature";
import { useAuth } from "../../auth";

type Props = {
  template: FormTemplate;
  child: Child;
  /** The last submission — pre-fills a returned form or an update. */
  previous?: Submission;
  onClose: () => void;
  onDone: (message: string) => void;
};

export default function FormFill({ template, child, previous, onClose, onDone }: Props) {
  const { user } = useAuth();
  const { submit } = useForms();
  // A medication form is always a new medication, never an edit of the last one.
  const [data, setData] = useState<FormData>(() => (template.repeatable ? {} : prefill(template, child, previous)));
  const [signedName, setSignedName] = useState(user?.name ?? "");
  const [signature, setSignature] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const fieldErrors = validate(template, data);
  const signErrors: string[] = [];
  if (signedName.trim().length < 3) signErrors.push("Type your full name.");
  if (!signature) signErrors.push("Sign in the box.");
  const errorCount = Object.keys(fieldErrors).length + signErrors.length;

  const returned = previous?.status === "returned" && !template.repeatable;

  const send = () => {
    if (errorCount > 0) {
      setShowErrors(true);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    submit({ formId: template.id, child, data, signature: signature!, signedName });
    onDone(`${template.name} sent to the office`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ff-title"
        className="bg-surface rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-2xl max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 sm:px-6 py-4 border-b border-line flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono uppercase tracking-widest text-muted">For {child.name}</p>
            <h2 id="ff-title" className="text-lg sm:text-xl font-bold text-brand leading-tight">{template.name}</h2>
            <p className="text-xs text-muted mt-1 flex items-center gap-1.5">
              <Clock size={13} aria-hidden /> About {template.minutes} {template.minutes === 1 ? "minute" : "minutes"}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close without sending" className="w-11 h-11 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent flex-shrink-0">
            <X size={20} aria-hidden />
          </button>
        </header>

        <div className="overflow-y-auto px-5 sm:px-6 py-5">
          <div ref={topRef} />

          {returned && previous?.reviewNote && (
            <div className="bg-warning-soft border border-warning-line rounded-card p-4 mb-6">
              <p className="text-sm font-semibold text-warning-strong mb-1">The office sent this back</p>
              <p className="text-sm text-ink">{previous.reviewNote}</p>
              <p className="text-xs text-muted mt-2">— {previous.reviewedBy}. Your earlier answers are filled in below; change what they asked about and send it again.</p>
            </div>
          )}

          {showErrors && errorCount > 0 && (
            <div role="alert" className="bg-danger-soft border border-danger-line rounded-card p-4 mb-6 flex gap-3">
              <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-danger">
                  {errorCount === 1 ? "One thing still needs attention" : `${errorCount} things still need attention`}
                </p>
                <p className="text-sm text-danger-strong">They're marked in red below.</p>
              </div>
            </div>
          )}

          <FormFields template={template} data={data} onChange={setData} errors={showErrors ? fieldErrors : {}} />

          <fieldset className="mt-8 pt-6 border-t border-line space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-muted mb-1">Sign</legend>
            <p className="text-sm text-ink bg-surface-2 rounded-card p-3.5">{template.attestation}</p>
            <div>
              <label htmlFor="ff-name" className="text-sm font-semibold text-brand block mb-1.5">
                Your full name <span className="text-danger">*</span>
              </label>
              <input
                id="ff-name"
                value={signedName}
                onChange={(e) => setSignedName(e.target.value)}
                autoComplete="name"
                aria-invalid={showErrors && signedName.trim().length < 3}
                className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent aria-[invalid=true]:border-danger"
              />
            </div>
            <SignaturePad value={signature} onChange={setSignature} label="Signature" placeholder="Sign here with your finger or mouse" height={140} />
            {showErrors && !signature && <p className="text-xs text-danger font-medium -mt-2">Sign in the box to send this.</p>}
          </fieldset>
        </div>

        <footer className="px-5 sm:px-6 py-4 border-t border-line flex gap-3 bg-surface rounded-b-[calc(var(--t-radius)+0.25rem)]">
          <button onClick={onClose} className="flex-1 min-h-12 rounded-ctl border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Cancel
          </button>
          <button onClick={send} className="flex-[2] min-h-12 rounded-ctl bg-brand text-white font-semibold hover:bg-brand-hover flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
            <Send size={17} aria-hidden /> {returned ? "Send it again" : "Sign and send"}
          </button>
        </footer>
      </div>
    </div>
  );
}
