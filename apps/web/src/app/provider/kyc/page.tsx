"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { KycDocumentImage } from "@/components/kyc-document-image";
import { apiFormData, apiJson } from "@/lib/api";
import { compressImageForUpload, formatFileSize } from "@/lib/compress-image";
import { getToken } from "@/lib/auth-storage";
import { useRequireRole } from "@/lib/use-require-role";

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
};

type KycMine = {
  kycStatus: string;
  kycAdminNote: string | null;
  profile: KycProfile | null;
};

const ID_TYPES = [
  { value: "philid", label: "PhilID / National ID" },
  { value: "drivers_license", label: "Driver's license" },
  { value: "passport", label: "Passport" },
  { value: "umid", label: "UMID" },
  { value: "other", label: "Other government ID" },
];

export default function ProviderKycPage() {
  const { ready } = useRequireRole("provider");
  const [step, setStep] = useState(1);
  const [mine, setMine] = useState<KycMine | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const [legalFullName, setLegalFullName] = useState("");
  const [dateOfBirthYmd, setDateOfBirthYmd] = useState("");
  const [nationality, setNationality] = useState("Filipino");
  const [mobileNumber, setMobileNumber] = useState("");
  const [serviceCity, setServiceCity] = useState("");
  const [serviceProvince, setServiceProvince] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [providerType, setProviderType] = useState<"individual" | "business">("individual");
  const [businessName, setBusinessName] = useState("");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState("");
  const [idType, setIdType] = useState("philid");
  const [idNumber, setIdNumber] = useState("");
  const [idExpiryYmd, setIdExpiryYmd] = useState("");
  const [declarationsAccepted, setDeclarationsAccepted] = useState(false);

  const [hasIdFront, setHasIdFront] = useState(false);
  const [hasIdBack, setHasIdBack] = useState(false);
  const [hasSelfie, setHasSelfie] = useState(false);

  const loadMine = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<KycMine>("/provider/kyc/mine", { token });
    setMine(data);
    const p = data.profile;
    if (p) {
      if (p.legalFullName) setLegalFullName(p.legalFullName);
      if (p.dateOfBirthYmd) setDateOfBirthYmd(p.dateOfBirthYmd);
      if (p.nationality) setNationality(p.nationality);
      if (p.mobileNumber) setMobileNumber(p.mobileNumber);
      if (p.serviceCity) setServiceCity(p.serviceCity);
      if (p.serviceProvince) setServiceProvince(p.serviceProvince);
      if (p.addressLine1) setAddressLine1(p.addressLine1);
      if (p.barangay) setBarangay(p.barangay);
      if (p.city) setCity(p.city);
      if (p.province) setProvince(p.province);
      if (p.postalCode) setPostalCode(p.postalCode);
      if (p.providerType === "business" || p.providerType === "individual") {
        setProviderType(p.providerType);
      }
      if (p.businessName) setBusinessName(p.businessName);
      if (p.businessRegistrationNumber) setBusinessRegistrationNumber(p.businessRegistrationNumber);
      if (p.idType) setIdType(p.idType);
      if (p.idNumber) setIdNumber(p.idNumber);
      if (p.idExpiryYmd) setIdExpiryYmd(p.idExpiryYmd);
      setHasIdFront(p.hasIdFront);
      setHasIdBack(p.hasIdBack);
      setHasSelfie(p.hasSelfie);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    void loadMine().catch((e) => setMsg(e instanceof Error ? e.message : "Failed to load"));
  }, [ready, loadMine]);

  const status = mine?.kycStatus ?? "none";
  const readOnly = status === "pending" || status === "approved";
  const idBackRequired = idType !== "passport";
  const token = getToken();

  async function uploadDoc(purpose: string, file: File) {
    const t = getToken();
    if (!t) return;
    setUploading(purpose);
    setMsg("Compressing image…");
    try {
      const compressed = await compressImageForUpload(file);
      const sizeNote =
        compressed.size < file.size
          ? ` (${formatFileSize(file.size)} → ${formatFileSize(compressed.size)})`
          : "";
      setMsg(`Uploading${sizeNote}…`);
      const fd = new FormData();
      fd.append("file", compressed);
      await apiFormData(`/provider/kyc/upload/${purpose}`, fd, { token: t });
      if (purpose === "id_front") setHasIdFront(true);
      if (purpose === "id_back") setHasIdBack(true);
      if (purpose === "selfie") setHasSelfie(true);
      setMsg(`${purpose.replace(/_/g, " ")} uploaded${sizeNote}.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function submit() {
    const t = getToken();
    if (!t) return;
    setBusy(true);
    setMsg(null);
    try {
      await apiJson("/provider/kyc/submit", {
        method: "POST",
        token: t,
        body: JSON.stringify({
          legalFullName,
          dateOfBirthYmd,
          nationality,
          mobileNumber,
          serviceCity,
          serviceProvince,
          addressLine1,
          barangay: barangay || undefined,
          city,
          province,
          postalCode: postalCode || undefined,
          idType,
          idNumber,
          idExpiryYmd: idExpiryYmd || undefined,
          providerType,
          businessName: providerType === "business" ? businessName : undefined,
          businessRegistrationNumber:
            providerType === "business" ? businessRegistrationNumber : undefined,
          declarationsAccepted,
        }),
      });
      await loadMine();
      setMsg("Submitted for admin review.");
      setStep(1);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="main-narrow">
      <p className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link> / Identity verification
      </p>
      <h1>Provider KYC</h1>
      <p className="page-lead">
        Complete verification to publish services, accept bookings, and cash out. Documents are
        stored securely and only used for KYC review.
      </p>

      <p>
        Status: <strong className="profile-dl__capitalize">{status.replace(/_/g, " ")}</strong>
      </p>
      {mine?.kycAdminNote && status === "rejected" ? (
        <p className="text-error">Admin note: {mine.kycAdminNote}</p>
      ) : null}

      {status === "approved" ? (
        <p>Your identity is verified. No further action needed.</p>
      ) : status === "pending" ? (
        <p>Your submission is under review. You will be notified when an admin decides.</p>
      ) : (
        <>
          <div className="kyc-steps" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                className={step === n ? "btn-primary" : "btn-secondary"}
                onClick={() => setStep(n)}
              >
                Step {n}
              </button>
            ))}
          </div>

          {step === 1 ? (
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
            >
              <h2>Personal & service area</h2>
              <label className="field">
                <span>Legal full name</span>
                <input
                  value={legalFullName}
                  onChange={(e) => setLegalFullName(e.target.value)}
                  required
                  disabled={readOnly}
                />
              </label>
              <label className="field">
                <span>Date of birth</span>
                <input
                  type="date"
                  value={dateOfBirthYmd}
                  onChange={(e) => setDateOfBirthYmd(e.target.value)}
                  required
                  disabled={readOnly}
                />
              </label>
              <label className="field">
                <span>Nationality</span>
                <input
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  required
                  disabled={readOnly}
                />
              </label>
              <label className="field">
                <span>Mobile number</span>
                <input
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                  disabled={readOnly}
                />
              </label>
              <label className="field">
                <span>Provider type</span>
                <select
                  value={providerType}
                  onChange={(e) => setProviderType(e.target.value as "individual" | "business")}
                  disabled={readOnly}
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </label>
              {providerType === "business" ? (
                <>
                  <label className="field">
                    <span>Business name</span>
                    <input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                      disabled={readOnly}
                    />
                  </label>
                  <label className="field">
                    <span>Business registration number</span>
                    <input
                      value={businessRegistrationNumber}
                      onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
                      required
                      disabled={readOnly}
                    />
                  </label>
                </>
              ) : null}
              <label className="field">
                <span>Service city</span>
                <input
                  value={serviceCity}
                  onChange={(e) => setServiceCity(e.target.value)}
                  required
                  disabled={readOnly}
                />
              </label>
              <label className="field">
                <span>Service province</span>
                <input
                  value={serviceProvince}
                  onChange={(e) => setServiceProvince(e.target.value)}
                  required
                  disabled={readOnly}
                />
              </label>
              <h3>Registered address (admin review only)</h3>
              <label className="field">
                <span>Address line</span>
                <input
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  required
                  disabled={readOnly}
                />
              </label>
              <label className="field">
                <span>Barangay (optional)</span>
                <input
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  disabled={readOnly}
                />
              </label>
              <label className="field">
                <span>City / municipality</span>
                <input value={city} onChange={(e) => setCity(e.target.value)} required disabled={readOnly} />
              </label>
              <label className="field">
                <span>Province</span>
                <input
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  required
                  disabled={readOnly}
                />
              </label>
              <label className="field">
                <span>Postal code (optional)</span>
                <input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  disabled={readOnly}
                />
              </label>
              <button type="submit">Continue to documents</button>
            </form>
          ) : null}

          {step === 2 ? (
            <div className="form">
              <h2>Identity documents</h2>
              <label className="field">
                <span>ID type</span>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  disabled={readOnly}
                >
                  {ID_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>ID number</span>
                <input
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  required
                  disabled={readOnly}
                />
              </label>
              <label className="field">
                <span>ID expiry (optional)</span>
                <input
                  type="date"
                  value={idExpiryYmd}
                  onChange={(e) => setIdExpiryYmd(e.target.value)}
                  disabled={readOnly}
                />
              </label>

              {(
                [
                  { purpose: "id_front", label: "ID front", done: hasIdFront },
                  ...(idBackRequired
                    ? [{ purpose: "id_back", label: "ID back", done: hasIdBack }]
                    : []),
                  { purpose: "selfie", label: "Selfie holding ID", done: hasSelfie },
                ] as const
              ).map((doc) => (
                <div key={doc.purpose} className="detail-panel" style={{ marginBottom: 12 }}>
                  <strong>{doc.label}</strong>
                  {doc.done && token ? (
                    <KycDocumentImage
                      path={`/provider/kyc/files/${doc.purpose}`}
                      token={token}
                      alt={doc.label}
                    />
                  ) : (
                    <p className="text-muted">Not uploaded yet</p>
                  )}
                  {!readOnly ? (
                    <label className="field">
                      <span>
                        Upload {doc.label.toLowerCase()} (JPEG, PNG, WebP — resized to ~1 MB before
                        upload)
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploading === doc.purpose}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadDoc(doc.purpose, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  ) : null}
                  {uploading === doc.purpose ? <p>Processing…</p> : null}
                </div>
              ))}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="button" onClick={() => setStep(3)}>
                  Review & submit
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="form">
              <h2>Review & submit</h2>
              <ul className="profile-dl">
                <li>
                  <dt>Name</dt>
                  <dd>{legalFullName}</dd>
                </li>
                <li>
                  <dt>Mobile</dt>
                  <dd>{mobileNumber}</dd>
                </li>
                <li>
                  <dt>Service area</dt>
                  <dd>
                    {serviceCity}, {serviceProvince}
                  </dd>
                </li>
                <li>
                  <dt>ID</dt>
                  <dd>
                    {ID_TYPES.find((t) => t.value === idType)?.label ?? idType} — {idNumber}
                  </dd>
                </li>
                <li>
                  <dt>Documents</dt>
                  <dd>
                    {hasIdFront ? "ID front ✓" : "ID front missing"} ·{" "}
                    {idBackRequired ? (hasIdBack ? "ID back ✓" : "ID back missing") : "ID back N/A"} ·{" "}
                    {hasSelfie ? "Selfie ✓" : "Selfie missing"}
                  </dd>
                </li>
              </ul>
              <label className="field" style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={declarationsAccepted}
                  onChange={(e) => setDeclarationsAccepted(e.target.checked)}
                  disabled={readOnly}
                />
                <span>
                  I confirm the information and documents are true and accurate, and I agree to the
                  platform terms for provider verification.
                </span>
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
                  Back
                </button>
                <button type="button" disabled={busy || readOnly} onClick={() => void submit()}>
                  {busy ? "Submitting…" : "Submit for review"}
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {msg ? <p>{msg}</p> : null}
    </main>
  );
}
