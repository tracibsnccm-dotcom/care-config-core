import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import TenVsScreen from "../../screens/rn/TenVsScreen";

const RnCase10VsRoute: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  // Store caseId in localStorage for the screen to use
  React.useEffect(() => {
    if (caseId && typeof window !== "undefined") {
      try {
        window.localStorage.setItem("rcms_active_case_id", caseId);
      } catch (e) {
        console.error("Failed to save case ID", e);
      }
    }
  }, [caseId]);

  return (
    <div>
      <div style={{ marginBottom: "0.75rem" }}>
        <button
          type="button"
          onClick={() => navigate("/rn")}
          className="px-2 py-1 rounded-md text-[10px] border bg-white text-slate-700 hover:bg-slate-50"
        >
          ← Back to RN Console
        </button>
      </div>
      {caseId && (
        <div className="mb-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md">
          <p className="text-xs font-medium text-slate-700">
            Case ID: <span className="font-semibold">{caseId}</span>
          </p>
        </div>
      )}
      <TenVsScreen />
    </div>
  );
};

export default RnCase10VsRoute;

