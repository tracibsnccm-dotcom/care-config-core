// src/App.tsx

import * as React from "react";
import { RNCaseTimeline } from "./components/RNCaseTimeline";
import { AttorneyCommLog } from "./components/AttorneyCommLog";

function App() {
  // For now we hard-code caseId to match mockTimeline.ts (case-001)
  const caseId = "case-001";
  const isCaseLegalLocked = true;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Simple top bar for now – we can swap this back to your full AppShell later */}
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Reconcile C.A.R.E.</h1>
          <p className="text-xs text-muted-foreground">
            Mock-first Case Timeline & Communications Log
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          RN + Attorney view • Case ID: <span className="font-mono">{caseId}</span>
        </div>
      </header>

      <main className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* RN Case Timeline */}
          <RNCaseTimeline
            caseId={caseId}
            isCaseLegalLocked={isCaseLegalLocked}
          />

          {/* Attorney Communications Log */}
          <AttorneyCommLog
            caseId={caseId}
            isCaseLegalLocked={isCaseLegalLocked}
          />
        </div>
      </main>
    </div>
  );
}

export default App;


