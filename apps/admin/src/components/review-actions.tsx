"use client";

import { useState } from "react";

type ReviewActionsProps = {
  busy?: boolean;
  approveLabel?: string;
  rejectLabel?: string;
  onApprove: () => void | Promise<void>;
  onReject: (note: string) => void | Promise<void>;
};

export function ReviewActions({
  busy = false,
  approveLabel = "Approve",
  rejectLabel = "Reject",
  onApprove,
  onReject,
}: ReviewActionsProps) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  async function submitReject() {
    await onReject(note.trim());
    setRejecting(false);
    setNote("");
  }

  if (rejecting) {
    return (
      <div className="review-actions review-actions--reject">
        <label className="field">
          <span>Rejection note (optional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for rejection"
            disabled={busy}
            maxLength={500}
          />
        </label>
        <div className="list-actions">
          <button type="button" onClick={() => void submitReject()} disabled={busy}>
            Confirm reject
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setRejecting(false);
              setNote("");
            }}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="list-actions">
      <button type="button" onClick={() => void onApprove()} disabled={busy}>
        {busy ? "Working…" : approveLabel}
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setRejecting(true)}
        disabled={busy}
      >
        {rejectLabel}
      </button>
    </div>
  );
}
