/* ================= RCMS C.A.R.E. — Pre-Settlement Case Analysis (Attorney) ================
 * Purpose
 * - Shows a "Pre-Settlement Case Analysis" button (only when relevant).
 * - Opens a modal with concise value prop + 2 actions (consult or commission).
 * - PHI-aware: never renders full names; uses case id + client_label token.
 * - Colors: brand blue (#0f2a6a), teal (#128f8b), attorney CTA = orange (Tailwind orange-500).
 *
 * Usage
 *   import PreSettlementDossier from "./PreSettlementDossier";
 *   ...
 *   <PreSettlementDossier caseObj={c} />
 *
 * Requirements (already in project)
 *   - useAuth() from auth/AuthContext
 *   - audit() from lib/rcmsApi  (logs INVITE/EXPORT/etc.; we'll log DOSSIER_* here)
 * ========================================================================================= */

import React, { useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { audit, notifyDossierCommissioned } from "@/lib/rcmsApi";

type CaseLike = {
  id?: string;
  case_id?: string;
  client_label?: string;             // tokenized (e.g., "J.D.")
  tags?: string[];
  status?: string;
  mediationDate?: string;            // ISO or yyyy-mm-dd
  consent?: { signed?: boolean; scope?: { shareWithAttorney?: boolean } };
  // add anything else your case object carries; we keep it loose
};

function parseAsDateSafe(v?: string) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/** Business rule: show CTA if tags/status/mediation suggest negotiation window. */
function shouldShowCTA(c: CaseLike) {
  if (!c) return false;
  const tags = (c.tags || []).map((t) => String(t || "").toLowerCase());
  const relevantTags = new Set(["mediation", "pre-mediation", "settlement-negotiations", "pre-trial"]);
  const hasTag = tags.some((t) => relevantTags.has(t));

  const relevantStatuses = new Set(["pre-mediation", "settlement-negotiations", "pre-trial"]);
  const hasStatus = c.status ? relevantStatuses.has(String(c.status).toLowerCase()) : false;

  const mediation = parseAsDateSafe(c.mediationDate);
  const now = new Date();
  const fortyFiveDaysMs = 45 * 24 * 60 * 60 * 1000;
  const isMediationSoon = mediation ? mediation.getTime() - now.getTime() <= fortyFiveDaysMs : false;

  return hasTag || hasStatus || isMediationSoon;
}

/** Consent gate: we prefer consent signed & sharing allowed for this attorney-facing CTA */
function consentAllowsAttorney(c: CaseLike) {
  const signed = !!c?.consent?.signed;
  const share = c?.consent?.scope?.shareWithAttorney !== false; // default allow unless explicitly false
  return signed && share;
}

/** Build a neutral case ref without PHI. */
function caseRef(c: CaseLike) {
  const id = c.id || c.case_id || "—";
  const label = c.client_label ? `Client ${c.client_label}` : "Client";
  return `${label} • Case ${id}`;
}

export default function PreSettlementDossier({ caseObj }: { caseObj: CaseLike }) {
  const { user, roles } = useAuth();
  const [open, setOpen] = useState(false);

  // Optional: role guard (ATTORNEY only)
  const isAttorney = roles.includes("ATTORNEY");

  const showCTA = useMemo(() => {
    if (!isAttorney) return false;
    return shouldShowCTA(caseObj);
  }, [isAttorney, caseObj]);

  const disabledByConsent = !consentAllowsAttorney(caseObj);

  async function onOpenModal() {
    setOpen(true);
    await audit({
      actorRole: roles[0] || "ATTORNEY",
      actorId: user?.id || "unknown",
      action: "DOSSIER_MODAL_OPEN",
      caseId: caseObj?.id || caseObj?.case_id || "",
    });
  }

  return (
    <div className="flex items-center gap-2">
      {showCTA ? (
        <button
          type="button"
          onClick={onOpenModal}
          title={disabledByConsent ? "Client consent not on file — some details may be redacted." : "Open pre-settlement analysis options"}
          className={`px-4 py-2 rounded-lg font-semibold shadow-sm transition
            ${disabledByConsent
              ? "bg-orange-300 text-white cursor-not-allowed"
              : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
          disabled={disabledByConsent}
        >
          Pre-Settlement Case Analysis
        </button>
      ) : (
        <button
          type="button"
          className="px-4 py-2 rounded-lg font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
          disabled
          title="This case isn't in a negotiation window yet."
        >
          Pre-Settlement Case Analysis
        </button>
      )}

      {open && (
        <DossierModal
          caseObj={caseObj}
          onClose={() => setOpen(false)}
          onAudit={(meta) =>
            audit({
              actorRole: roles[0] || "ATTORNEY",
              actorId: user?.id || "unknown",
              action: "DOSSIER_ACTION",
              caseId: caseObj?.id || caseObj?.case_id || "",
              meta,
            })
          }
        />
      )}
    </div>
  );
}

/* ---------------------------------- Modal ---------------------------------- */

function DossierModal({
  caseObj,
  onClose,
  onAudit,
}: {
  caseObj: CaseLike;
  onClose: () => void;
  onAudit: (meta: Record<string, any>) => Promise<any>;
}) {
  const { user } = useAuth();
  const [choice, setChoice] = useState<"consult" | "commission" | "">("");

  function goto(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!choice) return;

    const caseId = caseObj?.id || caseObj?.case_id || "";
    const meta = { choice, caseId };

    if (choice === "consult") {
      await onAudit({ ...meta, route: "schedule-consultation" });
      goto("/schedule-consultation");
    } else if (choice === "commission") {
      await onAudit({ ...meta, route: "checkout" });
      
      // Trigger RN Supervisor task via webhook
      await notifyDossierCommissioned({
        caseId,
        attorneyId: user?.id,
        attorneyEmail: user?.email,
        clientLabel: caseObj?.client_label,
      });
      
      goto(`/checkout?case_id=${encodeURIComponent(caseId)}`);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-2xl leading-none text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ×
        </button>

        {/* Heading */}
        <h2 className="text-2xl font-extrabold text-[#0f2a6a]">Pre-Settlement Case Strength Dossier</h2>
        <p className="mt-1 text-sm text-gray-600">{caseRef(caseObj)}</p>

        {/* Value prop */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-800">
            Anchor your settlement position in <strong>guideline-backed clinical authority</strong>. This forensic-level
            analysis distills the medical narrative into a cohesive, defensible valuation foundation.
          </p>
        </div>

        {/* Features */}
        <div className="mt-5">
          <h3 className="text-lg font-semibold text-[#0f2a6a]">What's included</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-800">
            <li className="border-b border-gray-100 pb-2">
              📊 <strong>Anchor Document:</strong> a formal, bound report synthesizing the clinical story.
            </li>
            <li className="border-b border-gray-100 pb-2">
              🛡️ <strong>Vulnerability Audit & Rebuttals:</strong> ODG/MCG-referenced counter-arguments.
            </li>
            <li className="border-b border-gray-100 pb-2">
              💰 <strong>Future Damages Quantification:</strong> projected future care costs with guidelines.
            </li>
            <li>
              🎯 <strong>90-minute Strategy Session:</strong> collaborative "war room" with lead RN.
            </li>
          </ul>
        </div>

        {/* Pricing */}
        <div className="mt-5 rounded-xl bg-gradient-to-r from-[#0f2a6a] to-[#128f8b] p-5 text-center text-white">
          <h3 className="text-xl font-bold">Investment: $9,500</h3>
          <p className="mt-1 text-sm opacity-90">For cases where top-tier valuation evidence is critical.</p>
        </div>

        {/* Video placeholder */}
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-[#0f2a6a]">Explainer</h4>
          <div className="mt-2 rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
            📺 Your explainer video embed goes here
          </div>
        </div>

        {/* PDF download */}
        <div className="mt-4">
          <a
            href="/assets/dossier-explainer.pdf"
            download
            className="block w-full rounded-lg bg-[#128f8b] px-4 py-3 text-center font-semibold text-white hover:bg-[#0f2a6a]"
          >
            Download Detailed PDF Overview
          </a>
        </div>

        {/* Action form */}
        <form onSubmit={onSubmit} className="mt-5">
          <label className="text-sm font-semibold text-gray-700">I'm ready to:</label>
          <div className="mt-2 space-y-2">
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border-2 border-gray-100 p-3 hover:border-[#128f8b]">
              <input
                type="radio"
                className="mt-1"
                name="ps-choice"
                value="consult"
                checked={choice === "consult"}
                onChange={() => setChoice("consult")}
              />
              <span className="text-sm text-gray-800">Schedule a confidential consultation (15 minutes)</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border-2 border-gray-100 p-3 hover:border-[#128f8b]">
              <input
                type="radio"
                className="mt-1"
                name="ps-choice"
                value="commission"
                checked={choice === "commission"}
                onChange={() => setChoice("commission")}
              />
              <span className="text-sm text-gray-800">Commission the dossier now</span>
            </label>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={!choice}
              className={`flex-1 rounded-lg px-4 py-3 font-semibold text-white transition ${
                choice ? "bg-[#0f2a6a] hover:bg-[#128f8b]" : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Maybe later
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
