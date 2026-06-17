"use client";

import { KycDocumentImage } from "@/components/kyc-document-image";
import { ReviewActions } from "@/components/review-actions";

export type KycProfile = {
  legalFullName: string | null;
  dateOfBirthYmd: string | null;
  nationality: string | null;
  mobileNumber: string | null;
  serviceCity: string | null;
  serviceProvince: string | null;
  addressLine1: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  idType: string | null;
  idNumber: string | null;
  idExpiryYmd: string | null;
  providerType: string | null;
  businessName: string | null;
  businessRegistrationNumber: string | null;
  hasIdFront: boolean;
  hasIdBack: boolean;
  hasSelfie: boolean;
  submittedAt: string | null;
};

export type KycPendingItem = {
  _id?: string;
  id?: string;
  email: string;
  fullName?: string;
  kycStatus: string;
  kycAdminNote?: string;
  kycDocumentUrl?: string | null;
  profile: KycProfile | null;
};

const ID_LABELS: Record<string, string> = {
  philid: "PhilID / National ID",
  drivers_license: "Driver's license",
  passport: "Passport",
  umid: "UMID",
  other: "Other government ID",
};

const DOC_SLOTS = [
  { purpose: "id_front", label: "ID front", flag: "hasIdFront" as const },
  { purpose: "id_back", label: "ID back", flag: "hasIdBack" as const },
  { purpose: "selfie", label: "Selfie with ID", flag: "hasSelfie" as const },
];

export function itemUserId(item: KycPendingItem): string {
  return item._id ?? item.id ?? "";
}

type Props = {
  item: KycPendingItem;
  busy: boolean;
  onApprove: () => void | Promise<void>;
  onReject: (note: string) => void | Promise<void>;
};

export function KycReviewCard({ item, busy, onApprove, onReject }: Props) {
  const p = item.profile;
  const userId = itemUserId(item);
  const displayName = p?.legalFullName || item.fullName || item.email;
  const hasStructured = Boolean(p?.submittedAt);
  const hasLegacyDoc = Boolean(item.kycDocumentUrl);

  return (
    <li className="detail-panel list-item review-card kyc-review-card">
      <div className="review-card__header">
        <div>
          <strong>{displayName}</strong>
          <div className="text-muted" style={{ fontSize: 14 }}>
            {item.email}
            {p?.submittedAt
              ? ` · Submitted ${new Date(p.submittedAt).toLocaleString()}`
              : null}
          </div>
        </div>
        <span className="badge badge--pending">{item.kycStatus.replace(/_/g, " ")}</span>
      </div>

      {!hasStructured && !hasLegacyDoc ? (
        <div className="kyc-review-alert">
          <strong>Incomplete submission</strong>
          <p>
            This provider is marked pending but has no KYC documents on file. They must complete
            the verification wizard (Provider → KYC) with ID photos before you can approve.
          </p>
          <p className="text-muted">You can reject this entry so they can resubmit.</p>
        </div>
      ) : null}

      {hasLegacyDoc && !hasStructured ? (
        <div className="kyc-review-alert kyc-review-alert--legacy">
          <strong>Legacy submission</strong>
          <p>
            This used the old URL-only flow. Ask the provider to resubmit via the new KYC wizard, or
            review the legacy link below.
          </p>
          <p>
            <a href={item.kycDocumentUrl!} target="_blank" rel="noreferrer">
              Open legacy document →
            </a>
          </p>
        </div>
      ) : null}

      {p ? (
        <details className="kyc-review-details" open>
          <summary>View submission details &amp; documents</summary>

          <dl className="profile-dl">
            <div>
              <dt>Legal name</dt>
              <dd>{p.legalFullName ?? "—"}</dd>
            </div>
            <div>
              <dt>DOB</dt>
              <dd>{p.dateOfBirthYmd ?? "—"}</dd>
            </div>
            <div>
              <dt>Nationality</dt>
              <dd>{p.nationality ?? "—"}</dd>
            </div>
            <div>
              <dt>Mobile</dt>
              <dd>{p.mobileNumber ?? "—"}</dd>
            </div>
            <div>
              <dt>Service area</dt>
              <dd>
                {[p.serviceCity, p.serviceProvince].filter(Boolean).join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt>Provider type</dt>
              <dd className="profile-dl__capitalize">{p.providerType ?? "—"}</dd>
            </div>
            {p.providerType === "business" ? (
              <>
                <div>
                  <dt>Business</dt>
                  <dd>{p.businessName ?? "—"}</dd>
                </div>
                <div>
                  <dt>Reg. no.</dt>
                  <dd>{p.businessRegistrationNumber ?? "—"}</dd>
                </div>
              </>
            ) : null}
            <div>
              <dt>ID</dt>
              <dd>
                {p.idType ? ID_LABELS[p.idType] ?? p.idType : "—"} · {p.idNumber ?? "—"}
                {p.idExpiryYmd ? ` (exp. ${p.idExpiryYmd})` : ""}
              </dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>
                {[p.addressLine1, p.barangay, p.city, p.province, p.postalCode]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </div>
          </dl>

          {userId ? (
            <div className="kyc-doc-grid">
              {DOC_SLOTS.map((slot) => {
                const uploaded = p[slot.flag];
                return (
                  <div key={slot.purpose} className="kyc-doc-cell">
                    <div className="kyc-doc-cell__label">
                      {slot.label}
                      <span
                        className={
                          uploaded ? "badge badge--completed" : "badge badge--ended"
                        }
                      >
                        {uploaded ? "uploaded" : "missing"}
                      </span>
                    </div>
                    {uploaded ? (
                      <KycDocumentImage
                        path={`/admin/kyc/${userId}/files/${slot.purpose}`}
                        alt={slot.label}
                      />
                    ) : (
                      <p className="text-muted">Not provided</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-error">Missing provider id — cannot load documents.</p>
          )}
        </details>
      ) : null}

      <ReviewActions
        busy={busy}
        approveDisabled={!hasStructured}
        approveLabel="Approve"
        onApprove={() => void onApprove()}
        onReject={(note) => void onReject(note)}
      />
      {!hasStructured ? (
        <p className="text-muted" style={{ fontSize: 13, marginTop: 8 }}>
          Approve is only available after the provider submits the full KYC form with documents.
        </p>
      ) : null}
    </li>
  );
}
