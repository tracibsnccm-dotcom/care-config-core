// src/components/injuries/InjurySelector.tsx

import React, { useState, useMemo } from "react";
import { InjuryInstance, InjuryTemplateId } from "../../lib/models";
import { INJURY_TEMPLATES, InjuryTemplate, ICD10Option } from "../../lib/injuryTemplates";

interface InjurySelectorProps {
  injuries: InjuryInstance[];
  onChange: (injuries: InjuryInstance[]) => void;
}

/**
 * InjurySelector
 *
 * - Lets RN CM add Primary + Additional injuries to a case.
 * - Uses curated templates & ICD-10 suggestions.
 * - Feeds directly into Medical Necessity Driver & exports.
 *
 * This is intentionally simple and in-memory for now.
 */
const InjurySelector: React.FC<InjurySelectorProps> = ({
  injuries,
  onChange,
}) => {
  const [search, setSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<InjuryTemplateId | "">("");
  const [title, setTitle] = useState("");
  const [bodyRegion, setBodyRegion] = useState("");
  const [laterality, setLaterality] = useState<
    "Right" | "Left" | "Bilateral" | "Unspecified" | ""
  >("");
  const [selectedIcdCodes, setSelectedIcdCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const templates = INJURY_TEMPLATES;

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((tpl) => {
      if (tpl.name.toLowerCase().includes(q)) return true;
      return tpl.relatedConditions.some((c) =>
        c.toLowerCase().includes(q)
      );
    });
  }, [search, templates]);

  const activeTemplate: InjuryTemplate | undefined = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId);
  }, [selectedTemplateId, templates]);

  const toggleIcd = (code: string) => {
    setSelectedIcdCodes((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );
  };

  const handleAddInjury = () => {
    setError(null);

    if (!selectedTemplateId || !activeTemplate) {
      setError("Select an injury type/template.");
      return;
    }

    const isFirst = injuries.length === 0;
    const isPrimary = isFirst || !injuries.some((i) => i.primary);

    // Require at least a short title
    const finalTitle =
      title.trim() ||
      `${activeTemplate.name}${
        bodyRegion ? ` – ${bodyRegion}` : ""
      }`;

    const newInjury: InjuryInstance = {
      id: generateId(),
      templateId: selectedTemplateId,
      title: finalTitle,
      primary: isPrimary,
      bodyRegion: bodyRegion || undefined,
      laterality: (laterality as any) || undefined,
      icd10Codes: selectedIcdCodes.length
        ? selectedIcdCodes
        : activeTemplate.icd10Suggestions.slice(0, 1).map((o) => o.code),
      mechanismSummary: undefined,
      keyFindings: undefined,
      redFlags: [],
      odgProfile: undefined,
      keyForNecessity: false,
    };

    onChange([...injuries, newInjury]);

    // Reset form
    setTitle("");
    setBodyRegion("");
    setLaterality("");
    setSelectedIcdCodes([]);
    // Keep template selected to allow multiple related additions if desired
  };

  const handleRemove = (id: string) => {
    const next = injuries.filter((i) => i.id !== id);
    // Ensure at least one remaining primary if any injuries left
    if (next.length > 0 && !next.some((i) => i.primary)) {
      next[0].primary = true;
    }
    onChange(next);
  };

  const handleSetPrimary = (id: string) => {
    const next = injuries.map((i) => ({
      ...i,
      primary: i.id === id,
    }));
    onChange(next);
  };

  return (
    <section className="bg-white border rounded-xl p-4 shadow-sm mb-4">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h2 className="text-sm font-semibold">
          Injury Profile & Medical Necessity Setup
        </h2>
        <span className="text-[10px] text-slate-500">
          Drives templates, ICD-10 mapping, and narrative reports.
        </span>
      </div>

      {/* Existing injuries list */}
      {injuries.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-semibold text-slate-600 mb-1">
            Current Injuries for This Case
          </div>
          <ul className="space-y-1 text-[10px]">
            {injuries.map((inj) => (
              <li
                key={inj.id}
                className="flex items-center justify-between gap-2 border rounded px-2 py-1"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold">
                    {inj.primary && (
                      <span className="mr-1 text-emerald-600">
                        ● Primary
                      </span>
                    )}
                    {inj.title}
                  </div>
                  <div className="text-slate-500">
                    Template: {inj.templateId}{" "}
                    {inj.bodyRegion && `· ${inj.bodyRegion}`}{" "}
                    {inj.laterality && `· ${inj.laterality}`}
                  </div>
                  {inj.icd10Codes?.length > 0 && (
                    <div className="text-slate-500">
                      ICD-10: {inj.icd10Codes.join(", ")}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {!inj.primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(inj.id)}
                      className="text-[9px] px-2 py-0.5 border rounded bg-slate-50 hover:bg-slate-100"
                    >
                      Make Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(inj.id)}
                    className="text-[9px] px-2 py-0.5 border rounded bg-white text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t pt-3 mt-2">
        <div className="text-[10px] font-semibold text-slate-700 mb-1">
          Add Injury (Primary or Additional)
        </div>

        {/* Search & template list */}
        <div className="flex flex-col gap-2 mb-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded px-2 py-1 text-[10px]"
            placeholder="Search by injury name (e.g., 'whiplash', 'crush', 'fall')"
          />
          <select
            className="w-full border rounded px-2 py-1 text-[10px]"
            value={selectedTemplateId}
            onChange={(e) =>
              setSelectedTemplateId(e.target.value as InjuryTemplateId | "")
            }
          >
            <option value="">Select injury template...</option>
            {filteredTemplates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
          {activeTemplate && (
            <p className="text-[9px] text-slate-500">
              {activeTemplate.description}
            </p>
          )}
        </div>

        {/* Basic fields */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-[9px] text-slate-600 mb-0.5">
              Short label / description
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded px-2 py-1 text-[10px]"
              placeholder="e.g., Lumbar strain after rear-end MVA"
            />
          </div>
          <div>
            <label className="block text-[9px] text-slate-600 mb-0.5">
              Body region (optional)
            </label>
            <input
              type="text"
              value={bodyRegion}
              onChange={(e) => setBodyRegion(e.target.value)}
              className="w-full border rounded px-2 py-1 text-[10px]"
              placeholder="e.g., Right hand, cervical spine"
            />
          </div>
        </div>

        {/* Laterality */}
        <div className="mb-2">
          <label className="block text-[9px] text-slate-600 mb-0.5">
            Laterality (if applicable)
          </label>
          <select
            className="w-full border rounded px-2 py-1 text-[10px]"
            value={laterality}
            onChange={(e) =>
              setLaterality(
                e.target.value as
                  | "Right"
                  | "Left"
                  | "Bilateral"
                  | "Unspecified"
                  | ""
              )
            }
          >
            <option value="">Select...</option>
            <option value="Right">Right</option>
            <option value="Left">Left</option>
            <option value="Bilateral">Bilateral</option>
            <option value="Unspecified">Unspecified</option>
          </select>
        </div>

        {/* ICD-10 Suggestions */}
        {activeTemplate && activeTemplate.icd10Suggestions.length > 0 && (
          <div className="mb-2">
            <div className="text-[9px] text-slate-600 mb-0.5">
              Suggested ICD-10 codes (click to toggle)
            </div>
            <div className="flex flex-wrap gap-1">
              {activeTemplate.icd10Suggestions.map((opt: ICD10Option) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => toggleIcd(opt.code)}
                  className={
                    "px-2 py-0.5 rounded border text-[9px] " +
                    (selectedIcdCodes.includes(opt.code)
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100")
                  }
                >
                  {opt.code} – {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-[9px] text-red-600 mb-1">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleAddInjury}
          className="mt-1 px-3 py-1 border rounded text-[10px] bg-slate-900 text-white hover:bg-slate-800"
        >
          Add Injury to Case
        </button>
      </div>
    </section>
  );
};

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "inj_" + Math.random().toString(36).substring(2, 10);
}

export default InjurySelector;
