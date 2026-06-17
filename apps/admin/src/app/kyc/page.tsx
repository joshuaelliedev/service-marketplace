"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { KycDocumentImage } from "@/components/kyc-document-image";
import { ReviewActions } from "@/components/review-actions";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { useRequireAdmin } from "@/lib/use-require-admin";

type KycProfile = {
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

type PendingItem = {
  _id: string;
  email: string;
  fullName?: string;
  kycStatus: string;
  kycAdminNote?: string;
  profile: KycProfile | null;
};

const ID_LABELS: Record<string, string> = {
  philid: "PhilID / National ID",
  drivers_license: "Driver's license",
  passport: "Passport",
  umid: "UMID",
  other: "Other government ID",
};

export default function AdminKycPage() {
  const { ready, isAdmin } = useRequireAdmin();
  const [items, setItems] = useState<PendingItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const token = getToken();

  const refresh = useCallback(async () => {
    const t = getToken();
    if (!t) return;
    const data = await apiJson<PendingItem[]>("/admin/kyc/pending", { token: t });
    setItems(data);
  }, []);

  useEffect(() => {
    if (!ready || !isAdmin) return;
    void (async () => {
      try {
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load KYC queue");
      }
    })();
  }, [ready, isAdmin, refresh]);

  async function decide(userId: string, approve: boolean, note?: string) {
    const t = getToken();
    if (!t) return;
    setBusyId(userId);
    setError(null);
    try {
      await apiJson(`/admin/kyc/${userId}/decision`, {
        method: "POST",
        token: t,
        body: JSON.stringify({
          approve,
          note: note || (approve ? "Approved" : "Rejected"),
        }),
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main>
        <p>Admin access required.</p>
      </main>
    );
  }

  if (!items && !error) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="main-wide">
      <p className="breadcrumb">
        <Link href="/">Dashboard</Link> / KYC review
      </p>
      <h1>KYC review</h1>
      <p className="admin-page-lead">Approve or reject provider identity submissions.</p>

      {error ? <p className="text-error">{error}</p> : null}

      {items?.length === 0 ? (
        <EmptyState
          title="No pending KYC"
          description="New provider submissions will appear here for review."
          action={
            <Link href="/" className="btn-secondary">
              Back to dashboard
            </Link>
          }
        />
      ) : (
        <ul className="booking-list">
          {items?.map((u) => {
            const p = u.profile;
            return (
              <li key={u._id} className="detail-panel list-item review-card">
                <div className="review-card__header">
                  <div>
                    <strong>{p?.legalFullName || u.fullName || u.email}</strong>
                    <div className="text-muted" style={{ fontSize: 14 }}>
                      {u.email}
                      {p?.submittedAt
                        ? ` · Submitted ${new Date(p.submittedAt).toLocaleString()}`
                        : null}
                    </div>
                  </div>
                  <span className="badge badge--pending">{u.kycStatus.replace(/_/g, " ")}</span>
                </div>

                {p ? (
                  <>
                    <dl className="profile-dl profile-dl--compact">
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

                    {token ? (
                      <div className="kyc-doc-grid" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                        {p.hasIdFront ? (
                          <div>
                            <div className="text-muted">ID front</div>
                            <KycDocumentImage
                              path={`/admin/kyc/${u._id}/files/id_front`}
                              token={token}
                              alt="ID front"
                            />
                          </div>
                        ) : null}
                        {p.hasIdBack ? (
                          <div>
                            <div className="text-muted">ID back</div>
                            <KycDocumentImage
                              path={`/admin/kyc/${u._id}/files/id_back`}
                              token={token}
                              alt="ID back"
                            />
                          </div>
                        ) : null}
                        {p.hasSelfie ? (
                          <div>
                            <div className="text-muted">Selfie</div>
                            <KycDocumentImage
                              path={`/admin/kyc/${u._id}/files/selfie`}
                              token={token}
                              alt="Selfie with ID"
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-muted">No structured KYC profile on file.</p>
                )}

                <ReviewActions
                  busy={busyId === u._id}
                  onApprove={() => decide(u._id, true)}
                  onReject={(note) => decide(u._id, false, note)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
