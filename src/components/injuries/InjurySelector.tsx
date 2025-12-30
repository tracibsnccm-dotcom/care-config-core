// src/components/injuries/InjurySelector.tsx
import React from "react";

type Injury = {
  id?: string;
  primary?: boolean;
  form?: string;
  label?: string;
  icd10?: string[] | string;
  side?: string;
  notes?: string;
  surgeryOccurred?: boolean;
  postOpTherapyWeeks?: number;
};

type Props = {
  selected: Injury[];
  onChange: (injuries: Injury[]) => void;
};

const InjurySelector: React.FC<Props> = ({ selected, onChange }) => {
  const handleAdd = () => {
    onChange([
      ...selected,
      {
        id: crypto.randomUUID(),
        primary: selected.length === 0,
        form: "",
        label: "",
        icd10: "",
        side: "",
        notes: "",
        surgeryOccurred: false,
        postOpTherapyWeeks: 0,
      },
    ]);
  };

  const handleUpdate = (index: number, field: keyof Injury, value: any) => {
    const next = [...selected];
    (next[index] as any)[field] = value;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    const next = selected.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <section className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Injury & ICD-10 Mapping</h3>
        <button
          type="button"
          onClick={handleAdd}
          className="text-xs px-2 py-1 border rounded hover:bg-slate-100"
        >
          + Add Injury
        </button>
      </div>

      {selected.length === 0 && (
        <p className="text-xs text-slate-600">No injuries recorded yet.</p>
      )}

      <div className="space-y-3">
        {selected.map((inj, idx) => (
          <div
            key={inj.id || idx}
            className="border rounded-lg p-3 bg-slate-50 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">
                Injury {idx + 1} {inj.primary && "(Primary)"}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-[10px] text-red-600"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block font-semibold mb-0.5">Form</label>
                <input
                  value={inj.form || ""}
                  onChange={(e) => handleUpdate(idx, "form", e.target.value)}
                  className="w-full border rounded p-1"
                  placeholder="e.g., Neck"
                />
              </div>
              <div>
                <label className="block font-semibold mb-0.5">Label</label>
                <input
                  value={inj.label || ""}
                  onChange={(e) => handleUpdate(idx, "label", e.target.value)}
                  className="w-full border rounded p-1"
                  placeholder="e.g., Whiplash injury"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block font-semibold mb-0.5">ICD-10 Code(s)</label>
                <input
                  value={
                    Array.isArray(inj.icd10)
                      ? inj.icd10.join(", ")
                      : inj.icd10 || ""
                  }
                  onChange={(e) =>
                    handleUpdate(
                      idx,
                      "icd10",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  className="w-full border rounded p-1"
                  placeholder="e.g., S13.4XXA"
                />
              </div>
              <div>
                <label className="block font-semibold mb-0.5">Side</label>
                <input
                  value={inj.side || ""}
                  onChange={(e) => handleUpdate(idx, "side", e.target.value)}
                  className="w-full border rounded p-1"
                  placeholder="Left / Right"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-0.5 text-xs">Notes</label>
              <textarea
                value={inj.notes || ""}
                onChange={(e) => handleUpdate(idx, "notes", e.target.value)}
                className="w-full border rounded p-1 text-xs"
                rows={2}
                placeholder="Any clinical context or relevant findings..."
              />
            </div>

            {/* NEW SURGICAL FIELDS */}
            <div className="flex flex-col sm:flex-row gap-3 text-xs mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!inj.surgeryOccurred}
                  onChange={(e) =>
                    handleUpdate(idx, "surgeryOccurred", e.target.checked)
                  }
                />
                Surgery occurred?
              </label>

              {inj.surgeryOccurred && (
                <div className="flex items-center gap-2">
                  <label className="font-semibold">Post-op therapy (weeks):</label>
                  <input
                    type="number"
                    min={0}
                    max={52}
                    value={inj.postOpTherapyWeeks || 0}
                    onChange={(e) =>
                      handleUpdate(
                        idx,
                        "postOpTherapyWeeks",
                        Number(e.target.value)
                      )
                    }
                    className="w-16 border rounded p-1 text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default InjurySelector;


