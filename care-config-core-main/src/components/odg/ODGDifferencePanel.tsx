// src/components/odg/ODGDifferencePanel.tsx

import React, { useMemo, useState } from "react";
import { toCsv } from "../../lib/csv";
import { encryptAndDownload } from "../../lib/crypto";

type InjuryLite = {
  code?: string;      // ICD-10 or internal
  label?: string;     // display name
  name?: string;      // fallback
};

type Row = {
  id: string;
  label: string;
  icd?: string;
  odgBaselineDays: number | "";
  currentCourseDays: number | "";
  comorbidityAddDays: number | "";
  postopAddDays: number | "";
};

function normNum(n: number | ""): number {
  return typeof n === "number" && !isNaN(n) ? n : 0;
}

function badge(delta: number) {
  // UI color helper for delta
  if (delta >= 10) return "bg-red-100 text-red-700 border-red-300";
  if (delta >= 1)  return "bg-amber-100 text-amber-700 border-amber-300";
  if (delta <= -5) return "bg-emerald-100 text-emerald-700 border-emerald-300";
  return "bg-slate-100 text-slate-700 border-slate-300";
}

export interface ODGDifferencePanelProps {
  injuries: InjuryLite[];
  clientId?: string;
}

const ODGDifferencePanel: React.FC<ODGDifferencePanelProps> = ({ injuries, clientId }) => {
  const [rows, setRows] = useState<Row[]>(
    (injuries || []).map((inj, idx) => ({
      id: `${idx}`,
      label: inj.label || inj.name || "Injury",
      icd: inj.code,
      odgBaselineDays: "",
      currentCourseDays: "",
      comorbidityAddDays: "",
      postopAddDays: "",
    }))
  );

  const totals = useMemo(() => {
    let sumBaseline = 0;
    let sumExpected = 0;
    rows.forEach((r) => {
      const base = normNum(r.odgBaselineDays);
      const expected = normNum(r.currentCourseDays) + normNum(r.comorbidityAddDays) + normNum(r.postopAddDays);
      sumBaseline += base;
      sumExpected += expected;
    });
    return { sumBaseline, sumExpected, delta: sumExpected - sumBaseline };
  }, [rows]);

  const handleNum =
    (id: string, key: keyof Row) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = e.target.value.trim() === "" ? "" : Number(e.target.value);
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [key]: isNaN(n as number) ? "" : n } : r))
      );
    };

  const exportEncryptedCsv = async () => {
    const headers = [
      "Injury",
      "ICD-10",
      "ODG Baseline (days)",
      "Course (days)",
      "Comorbidity Add-on (days)",
      "Post-op Add-on (days)",
      "Expected Total (days)",
      "Delta vs ODG (days)",
    ];

    const data = rows.map((r) => {
      const base = normNum(r.odgBaselineDays);
      const expected = normNum(r.currentCourseDays) + normNum(r.comorbidityAddDays) + normNum(r.postopAddDays);
      const delta = expected - base;
      return [
        r.label,
        r.icd || "",
        base,
        normNum(r.currentCourseDays),
        normNum(r.comorbidityAddDays),
        normNum(r.postopAddDays),
        expected,
        delta,
      ];
    });

    // Add a totals line
    data.push([
      "TOTALS",
      "",
      totals.sumBaseline,
      "",
      "",
      "",
      totals.sumExpected,
      totals.delta,
    ]);

    const csv = toCsv(headers, data);

    const passphrase = window.prompt(
      "Enter an encryption passphrase to protect this CSV export (.enc):"
    );
    if (!passphrase) return;

    await encryptAndDownload(
      `rcms-odg-delta-${clientId || "client"}`,
      csv,
      passphrase
    );
    alert("Encrypted .enc file generated. Share passphrase out-of-band.");
  };

  return (
    <section className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">ODG-Linked Difference Calculator</h3>
        <div
          className={
            "text-[10px] px-2 py-1 border rounded " + badge(totals.delta)
          }
          title="Aggregate Difference vs ODG (Expected minus Baseline)"
        >
          Total Δ vs ODG: {totals.delta} days
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-xs text-slate-500">
          Select at least one injury above to activate the calculator.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-2">Injury</th>
                <th className="py-2 pr-2">ICD-10</th>
                <th className="py-2 pr-2">ODG Baseline (days)</th>
                <th className="py-2 pr-2">Course (days)</th>
                <th className="py-2 pr-2">Comorbidity + (days)</th>
                <th className="py-2 pr-2">Post-op + (days)</th>
                <th className="py-2 pr-2">Expected Total</th>
                <th className="py-2 pr-2">Δ vs ODG</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const base = normNum(r.odgBaselineDays);
                const expected =
                  normNum(r.currentCourseDays) +
                  normNum(r.comorbidityAddDays) +
                  normNum(r.postopAddDays);
                const delta = expected - base;
                return (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 pr-2">{r.label}</td>
                    <td className="py-2 pr-2 text-slate-500">{r.icd || ""}</td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        className="w-24 border rounded px-1 py-0.5"
                        value={r.odgBaselineDays}
                        onChange={handleNum(r.id, "odgBaselineDays")}
                        placeholder="e.g., 28"
                        min={0}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        className="w-24 border rounded px-1 py-0.5"
                        value={r.currentCourseDays}
                        onChange={handleNum(r.id, "currentCourseDays")}
                        placeholder="e.g., 35"
                        min={0}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        className="w-24 border rounded px-1 py-0.5"
                        value={r.comorbidityAddDays}
                        onChange={handleNum(r.id, "comorbidityAddDays")}
                        placeholder="e.g., 7"
                        min={0}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        className="w-24 border rounded px-1 py-0.5"
                        value={r.postopAddDays}
                        onChange={handleNum(r.id, "postopAddDays")}
                        placeholder="e.g., 14"
                        min={0}
                      />
                    </td>
                    <td className="py-2 pr-2">{expected}</td>
                    <td className="py-2 pr-2">
                      <span className={"px-2 py-0.5 border rounded " + badge(delta)}>
                        {delta}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td className="py-2 pr-2 font-semibold">TOTALS</td>
                <td />
                <td className="py-2 pr-2 font-semibold">{totals.sumBaseline}</td>
                <td />
                <td />
                <td />
                <td className="py-2 pr-2 font-semibold">{totals.sumExpected}</td>
                <td className="py-2 pr-2">
                  <span className={"px-2 py-0.5 border rounded " + badge(totals.delta)}>
                    {totals.delta}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="flex justify-end mt-3">
        <button
          type="button"
          onClick={exportEncryptedCsv}
          className="px-3 py-1.5 text-[10px] border rounded-md text-slate-700 hover:bg-slate-100"
        >
          Export Encrypted CSV (.enc)
        </button>
      </div>

      <p className="text-[10px] text-slate-500 mt-2">
        TIP: Enter ODG baseline values from your licensed tables. Only add Post-op days when surgery actually occurs.
        Comorbidity adds should reflect DM/HTN/COPD, etc., per your policy.
      </p>
    </section>
  );
};

export default ODGDifferencePanel;
