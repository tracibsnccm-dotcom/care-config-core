// src/components/admin/DecryptTool.tsx
import React, { useMemo, useState } from "react";
import { aesDecryptFromBase64 } from "../../lib/crypto";

function parseCsvToRows(csv: string): string[][] {
  // Very light CSV parser for preview (handles quotes & commas/newlines)
  // For production, consider Papaparse—but this works for our admin preview.
  const rows: string[][] = [];
  let cur = "";
  let inQuotes = false;
  const pushCell = (r: string[]) => {
    // unescape quotes
    r.push(cur.replace(/""/g, '"'));
    cur = "";
  };

  let row: string[] = [];
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"') {
        // peek next
        if (csv[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        pushCell(row);
      } else if (ch === "\n") {
        pushCell(row);
        rows.push(row);
        row = [];
      } else if (ch === "\r") {
        // ignore CR; handle CRLF by letting \n finish the row
      } else {
        cur += ch;
      }
    }
  }
  // flush
  pushCell(row);
  if (row.length) rows.push(row);
  return rows;
}

const DecryptTool: React.FC = () => {
  const [encInput, setEncInput] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [decrypted, setDecrypted] = useState<string>("");

  const rows = useMemo(() => {
    if (!decrypted) return [];
    try {
      return parseCsvToRows(decrypted);
    } catch {
      return [];
    }
  }, [decrypted]);

  const handleDecrypt = async () => {
    setError(null);
    setDecrypted("");
    if (!encInput.trim()) {
      setError("Paste the encrypted base64 (.enc file contents) first.");
      return;
    }
    if (!pass) {
      setError("Enter the passphrase used during export.");
      return;
    }
    try {
      const csv = await aesDecryptFromBase64(encInput.trim(), pass);
      setDecrypted(csv);
    } catch (e: any) {
      setError(e?.message || "Decryption failed. Check the passphrase and content.");
    }
  };

  const downloadCsv = () => {
    if (!decrypted) return;
    const blob = new Blob([decrypted], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rcms-decrypted.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="bg-white border rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold mb-2">Admin — Decrypt Encrypted Export</h3>
      <p className="text-[11px] text-slate-600 mb-3">
        Paste the contents of a <code>.enc</code> file and the passphrase to preview and download the CSV.
        All decryption happens locally in your browser.
      </p>

      <div className="grid gap-2">
        <label className="text-[11px] font-medium">Encrypted payload (base64 from .enc file)</label>
        <textarea
          className="w-full border rounded p-2 text-xs min-h-[120px]"
          value={encInput}
          onChange={(e) => setEncInput(e.target.value)}
          placeholder="Paste the entire .enc file contents here"
        />

        <label className="text-[11px] font-medium mt-2">Passphrase</label>
        <input
          type="password"
          className="w-full border rounded p-2 text-xs"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="Enter the passphrase used to encrypt"
        />

        {error && <div className="text-xs text-red-600">{error}</div>}

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={handleDecrypt}
            className="px-3 py-1.5 text-[10px] border rounded-md text-slate-700 hover:bg-slate-100"
          >
            Decrypt & Preview
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={!decrypted}
            className="px-3 py-1.5 text-[10px] border rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Download CSV
          </button>
        </div>
      </div>

      {!!rows.length && (
        <div className="mt-4 overflow-auto border rounded">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                {rows[0].map((h, i) => (
                  <th key={i} className="text-left px-2 py-1 border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((r, ri) => (
                <tr key={ri} className="odd:bg-white even:bg-slate-50">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-2 py-1 border-b">{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default DecryptTool;
