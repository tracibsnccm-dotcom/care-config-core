import React, { useState } from "react";

type CrisisModeButtonProps = {
  caseId: string;
  onStart?: () => void;
};

export const CrisisModeButton: React.FC<CrisisModeButtonProps> = ({
  caseId,
  onStart,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // Placeholder API call – your dev will wire this to Supabase later
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

      if (!res.ok) {
        console.error("Failed to start crisis incident");
        alert("Could not enter Crisis Mode. Please try again.");
        return;
      }

      const data = await res.json();
      console.log("Crisis incident started:", data);

      if (onStart) onStart();

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
