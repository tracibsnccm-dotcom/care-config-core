// src/components/injuries/InjurySelector.tsx

import React, { useState, useMemo } from "react";
import { InjurySelection } from "../../lib/models";
import { injuryTemplates, getTemplateById } from "../../lib/icd10Library";
import { ICD10Code } from "../../lib/models";

interface InjurySelectorProps {
  selected: InjurySelection[];
  onChange: (injuries: InjurySelection[]) => void;
}

/**
 * Medical Necessity Review Driver - Injury & ICD-10 Selector
 *
 * - RN chooses primary + secondary injuries using curated templates
 * - Each selection can map to a suggested ICD-10 code
 * - Output is stored on AppState.injuries (single source for narrative + reports)
 */
const InjurySelector: React.FC<InjurySelectorProps> = ({
  selected,
  onChange,
}) => {
  const [search, setSearch] = useState("");

  const filteredTemplates = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return injuryTemplates;
    return injuryTemplates.filter(
      (t) =>
        t.label.toLowerCase().includes(term) ||
        t.suggestedCodes.some(
          (c) =>
            c.code.toLowerCase().includes(term) ||
            c.label.toLowerCase().includes(term)
        )
    );
  }, [search]);

  const setPrimary = (id: string) => {
    onChange(
      selected.map((inj) => ({
        ...inj,
        primary: inj.id === id,
      }))
    );
  };

  const toggleTemplate = (templateId: string) => {
    const existing = selected.find((i) => i.templateId === templateId);
    if (existing) {
      // remove
      onChange(selected.filter((i) => i.templateId !== templateId));
    } else {
      const tpl = getTemplateById(templateId);
      if (!tpl) return;
      const newInjury: InjurySelection = {
        id: `inj-${Date.now()}-${templateId}`,
        templateId,
        label: tpl.label,
        primary: selected.length === 0, // first one becomes primary
      };
      onChange([...selected, newInjury]);
    }
  };

  const updateCode = (id: string, code: string) => {
    onChange(
      selected.map((inj) =>
        inj.id === id ? { ...inj, icd10Code: code || undefined } : inj
      )
    );
  };

  const getCodesForInjury = (inj: InjurySelection): ICD10Code[] => {
    const tpl = getTemplateById(inj.templateId);
    return tpl?.suggestedCodes || [];
  };

  return (
    <section className="bg-white border rounded-xl p-4 shadow-sm mb-4">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-sm font-semibold">
          Medical Necessity Driver: Injury &amp; ICD-10 Map
        </h2>
        <span className="text-[9px] text-slate-500">
          Select primary & related injuries. This feeds your narrative—not payor denial.
        </span>
      </div>

      {/* Search */}
      <div className="mb-2">
        <input
          className="w-full border rounded px-2 py-1 text-[10px]"
          placeholder="Search by injury type or ICD-10 (e.g., whiplash, S13.4)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Template list */}
      <div className="grid gap-2 text-[10px]">
        {filteredTemplates.map((tpl) => {
          const active = selected.some((s) => s.templateId === tpl.id);
          return (
            <label
              key={tpl.id}
              className={
                "flex items-start gap-2 px-2 py-1.5 rounded border cursor-pointer " +
                (active
                  ? "border-sky-600 bg-sky-50"
                  : "border-slate-200 bg-slate-50")
              }
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggleTemplate(tpl.id)}
                className="mt-0.5"
              />
              <div>
                <div className="font-semibold">{tpl.label}</div>
                <div className="text-slate-600">{tpl.description}</div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Selected injuries + ICD-10 */}
      {selected.length > 0 && (
        <div className="mt-3 border-t pt-2 space-y-2">
          <div className="text-[9px] font-semibold text-slate-700">
            Selected Injuries &amp; Codes
          </div>
          {selected.map((inj) => {
            const codes = getCodesForInjury(inj);
            return (
              <div
                key={inj.id}
                className="px-2 py-1.5 rounded border border-slate-200 bg-slate-50 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-[10px]">
                    {inj.label}
                    {inj.primary && (
                      <span className="ml-1 text-[8px] text-emerald-700">
                        PRIMARY
                      </span>
                    )}
                  </div>
                  {!inj.primary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(inj.id)}
                      className="text-[8px] px-2 py-0.5 border rounded"
                    >
                      Set Primary
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[9px]">
                  <span>ICD-10:</span>
                  <select
                    className="border rounded px-1 py-0.5 text-[9px]"
                    value={inj.icd10Code || ""}
                    onChange={(e) => updateCode(inj.id, e.target.value)}
                  >
                    <option value="">Select suggested code</option>
                    {codes.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.label}
                      </option>
                    ))}
                  </select>
                  {inj.icd10Code && (
                    <span className="text-slate-600">
                      Selected: {inj.icd10Code}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default InjurySelector;

