import React, { useState } from "react";

type CrisisModeButtonProps = {
  caseId: string;
  onStart?: (incidentId: string) => void;
};

const CrisisModeButton: React.FC<CrisisModeButtonProps> = ({
  caseId,
  onStart,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      let incidentId = `dev-stub-incident-${Date.now()}`;

      try {
        const res = await fetch("/api/crisis-incidents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            case_id: caseId,
            trigger_source: "rn_manual",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          console.log("Crisis incident started (API):", data);
          incidentId = (data && data.incidentId) || incidentId;
        } else {
          console.warn(
            "Crisis incident API not OK in dev. Using fallback incident ID.",
            res.status
          );
        }
      } catch (error) {
        console.warn(
          "Crisis incident API not reachable in dev. Using fallback incident ID.",
          error
        );
      }

      if (onStart) onStart(incidentId);

      alert("Crisis Mode started for this case.");
    } catch (error) {
      console.error("Error starting crisis incident:", error);
      alert("Unexpected error starting Crisis Mode.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      style={{
        padding: "0.5rem 1rem",
        borderRadius: "999px",
        border: "none",
        fontWeight: 600,
        cursor: isLoading ? "not-allowed" : "pointer",
        backgroundColor: "#b91c1c",
        opacity: isLoading ? 0.7 : 1,
        color: "#ffffff",
      }}
    >
      {isLoading ? "Starting Crisis Mode..." : "Enter Crisis Mode"}
    </button>
  );
};

export default CrisisModeButton;
