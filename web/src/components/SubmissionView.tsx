/**
 * One submitted form, read back exactly as it was filled in — answers,
 * typed name, drawn signature and the review trail.
 */
import { TEMPLATE, type Submission } from "../forms";
import { FormFields } from "./FormFields";

const when = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "";

export function SubmissionView({ submission }: { submission: Submission }) {
  const t = TEMPLATE[submission.formId];
  return (
    <div className="space-y-6">
      <FormFields template={t} data={submission.data} readOnly />

      <div className="pt-5 border-t border-line space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-muted">Signed</p>
        <p className="text-sm text-ink bg-surface-2 rounded-card p-3">{t.attestation}</p>
        {submission.signature ? (
          <img src={submission.signature} alt={`Signature of ${submission.signedName}`} className="w-full max-w-sm border border-line rounded-card bg-surface-2" />
        ) : (
          <p className="text-xs text-muted">Signed on paper before online forms — the original is in the office file.</p>
        )}
        <p className="text-sm">
          <span className="font-semibold text-brand">{submission.signedName}</span>
          <span className="text-muted"> · {when(submission.submittedAt)}</span>
        </p>
      </div>

      {submission.status !== "submitted" && (
        <div className={`rounded-card p-3.5 text-sm ${submission.status === "approved" ? "bg-success-soft" : "bg-warning-soft"}`}>
          <p className={`font-semibold ${submission.status === "approved" ? "text-success" : "text-warning-strong"}`}>
            {submission.status === "approved" ? "Approved" : "Sent back for changes"}
            {submission.reviewedBy && <span className="font-normal text-ink"> by {submission.reviewedBy} · {when(submission.reviewedAt)}</span>}
          </p>
          {submission.reviewNote && <p className="text-ink mt-1">{submission.reviewNote}</p>}
        </div>
      )}
    </div>
  );
}
