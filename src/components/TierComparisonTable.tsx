import { Badge } from "@/components/ui/badge";

interface TierComparisonTableProps {
  currentTier?: string | null;
}

export function TierComparisonTable({ currentTier = "Basic" }: TierComparisonTableProps) {
  const tierColumns = ["Basic", "Clinical", "Premium"];
  const tierHeaders = [
    { name: "BASIC", subtitle: "(Core Only)" },
    { name: "CLINICAL", subtitle: "(Limited RN Care Mgmt)" },
    { name: "PREMIUM", subtitle: "(Full RN Care Mgmt + Advanced Analytics)" }
  ];

  const features = [
    {
      name: "Monthly Price",
      basic: "$9,500 / month",
      clinical: "$16,000 / month",
      premium: "$24,000 / month"
    },
    {
      name: "Core Platform Software",
      desc: "Dashboard, Pain Diary, 4Ps Tracker, SDOH Flags",
      basic: "✅",
      clinical: "✅",
      premium: "✅"
    },
    {
      name: "Client Education Packets",
      desc: "Pain, mental health, abuse, SDOH resources",
      basic: "✅",
      clinical: "✅",
      premium: "✅"
    },
    {
      name: "Provider Network & Scheduling",
      desc: "Upload providers; client booking; badges",
      basic: "✅",
      clinical: "✅",
      premium: "✅"
    },
    {
      name: "SDOH Resource Placement",
      desc: "Targeted resource routing and tracking",
      basic: "✅",
      clinical: "✅",
      premium: "✅"
    },
    {
      name: 'Client "Nudge" & Compliance Tools',
      desc: "Automated reminders and adherence tracking",
      basic: "✅ Core",
      clinical: "✅ Enhanced rules",
      premium: "✅ Priority + custom logic"
    },
    {
      name: "Clinical Reporting & Insight",
      desc: "RN-prepared reports and insights",
      basic: '⚠️ One-time initiation report <em>"first chapter of the playbook"</em>',
      clinical: "✅ Multiple reports + RN CM oversight",
      premium: "✅ Multiple reports + RN CM oversight"
    },
    {
      name: "RN Care Management",
      desc: "Ongoing coordination & advocacy",
      basic: "❌ Not Included",
      clinical: "⚠️ Limited support",
      premium: "✅ Full support",
      xBasic: true
    },
    {
      name: "Direct Client Interaction",
      desc: "RN contacts client for intake & follow-up",
      basic: "❌",
      clinical: "⚠️ Limited",
      premium: "✅",
      xBasic: true
    },
    {
      name: "Provider Service Coordination",
      desc: "RN coordinates communication with MDs & clinics",
      basic: "❌",
      clinical: "⚠️ Limited",
      premium: "✅",
      xBasic: true
    },
    {
      name: "Milestone Alert System",
      desc: "Proactive alerts on critical clinical events",
      basic: "❌",
      clinical: "✅",
      premium: "✅",
      xBasic: true
    },
    {
      name: "Clinical Collaboration Module",
      desc: "One-click recommendations to providers",
      basic: "❌",
      clinical: "✅",
      premium: "✅",
      xBasic: true
    },
    {
      name: "Attorney Analytics & Insights",
      desc: "Case metrics, timelines, provider response times",
      basic: "❌",
      clinical: "✅ Expanded filters",
      premium: "✅ Full suite + exports",
      xBasic: true
    },
    {
      name: "Priority Support",
      basic: "Standard",
      clinical: "Priority",
      premium: "Priority Plus"
    },
    {
      name: "ODG/MCG Medical Necessity Engine",
      basic: "❌",
      clinical: "❌",
      premium: "✅",
      xBasic: true,
      xClinical: true
    },
    {
      name: "One-Click Appeal Generator",
      basic: "❌",
      clinical: "❌",
      premium: "✅",
      xBasic: true,
      xClinical: true
    },
    {
      name: "Peer-to-Peer Review Coordination",
      basic: "❌",
      clinical: "❌",
      premium: "✅",
      xBasic: true,
      xClinical: true
    },
    {
      name: "Settlement Readiness Score (1–100)",
      basic: "❌",
      clinical: "❌",
      premium: "✅",
      xBasic: true,
      xClinical: true
    },
    {
      name: "Cost-of-Care Calculator",
      desc: "Projected future medical costs",
      basic: "❌",
      clinical: "❌",
      premium: "✅",
      xBasic: true,
      xClinical: true
    },
    {
      name: "Hospitalization Event Alert & Summary",
      basic: "➕ Add-On",
      clinical: "➕ Add-On",
      premium: "➕ Add-On"
    },
    {
      name: "Custom Clinical Timeline Build",
      basic: "➕ Add-On",
      clinical: "➕ Add-On",
      premium: "➕ Add-On"
    },
    {
      name: "Expedited Records Retrieval",
      basic: "➕ Add-On",
      clinical: "➕ Add-On",
      premium: "➕ Add-On"
    },
    {
      name: "Deposition Prep Packet (Clinical)",
      basic: "➕ Add-On",
      clinical: "➕ Add-On",
      premium: "➕ Add-On"
    },
    {
      name: "Medication Reconciliation & Adherence Plan",
      basic: "➕ Add-On",
      clinical: "➕ Add-On",
      premium: "➕ Add-On"
    },
    {
      name: "RN CM Special Services Catalog",
      basic: "➕ À la carte",
      clinical: "➕ À la carte",
      premium: "➕ À la carte"
    }
  ];

  const getColumnClass = (tierName: string) => {
    return currentTier === tierName ? "rcms-current-tier-col" : "";
  };

  return (
    <section id="rcms-tiers" aria-labelledby="rcms-tiers-title" className="rcms-tiers">
      <style>{`
        .rcms-tiers { margin: 24px 0; }
        .rcms-header { margin-bottom: 8px; }
        .rcms-header h2 { margin: 0; padding: 10px 14px; background: #0f2a6a; color: #fff; border-radius: 12px 12px 0 0; font-size: 1.5rem; font-weight: 600; }
        .rcms-subtext { margin: 8px 0 0; color: #333; font-size: 0.95rem; }
        .rcms-legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.9rem; margin: 10px 0; }
        .rcms-legend .x { color: #b00000; }
        .rcms-table-wrap { background: #fff; border: 1px solid #b09837; border-radius: 16px; box-shadow: 0 6px 18px rgba(0,0,0,0.06); overflow: auto; }
        .rcms-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .rcms-table thead th { position: sticky; top: 0; background: #0f2a6a; color: #fff; padding: 12px; text-align: center; font-weight: 700; z-index: 10; }
        .rcms-table thead th:first-child { text-align: left; padding-left: 16px; }
        .rcms-table thead th small { display: block; font-weight: 400; font-size: 0.75rem; margin-top: 4px; opacity: 0.9; }
        .rcms-table th[scope="row"] { text-align: left; padding: 12px 16px; vertical-align: top; border-top: 1px solid #eaeaea; font-weight: 600; }
        .rcms-table th[scope="row"] small { display: block; font-weight: 400; font-size: 0.85rem; color: #555; margin-top: 2px; }
        .rcms-table td { text-align: center; padding: 12px; vertical-align: top; border-top: 1px solid #eaeaea; }
        .rcms-table td.x { color: #b00000; font-weight: 700; }
        .rcms-table small { color: #555; }
        .rcms-note { margin-top: 8px; color: #444; font-size: 0.9rem; }
        .rcms-current-tier-col { outline: 2px solid rgba(176, 152, 55, 0.35); }
        .rcms-tier-badge { display: inline-block; background: #b09837; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-left: 8px; }
        
        @media (max-width: 820px) {
          .rcms-table thead { display: none; }
          .rcms-table tbody { display: block; }
          .rcms-table tr { display: block; border-top: 1px solid #eaeaea; margin-bottom: 12px; background: #f9f9f9; border-radius: 8px; padding: 8px; }
          .rcms-table th[scope="row"], .rcms-table td { display: block; text-align: left; border: none; padding: 10px 14px; }
          .rcms-table td::before {
            content: attr(data-col);
            font-weight: 600;
            color: #0f2a6a;
            display: block;
            margin-bottom: 2px;
          }
          .rcms-table th[scope="row"] { background: #0f2a6a; color: #fff; border-radius: 6px 6px 0 0; }
        }
      `}</style>

      <header className="rcms-header">
        <h2 id="rcms-tiers-title">Compare Service Tiers</h2>
        <p className="rcms-subtext">Choose the level of clinical coordination and advocacy that matches your firm's needs.</p>
      </header>

      <div className="rcms-legend" aria-label="Legend">
        <span>✅ Included</span>
        <span>⚠️ Limited/Partial</span>
        <span className="x">❌ Not Included</span>
        <span>➕ Add-On</span>
      </div>

      <div className="rcms-table-wrap" role="region" aria-labelledby="rcms-tiers-title">
        <table className="rcms-table">
          <thead>
            <tr>
              <th scope="col">Feature</th>
              {tierHeaders.map((tier, idx) => (
                <th key={idx} scope="col" className={getColumnClass(tierColumns[idx])}>
                  {tier.name}
                  <small>{tier.subtitle}</small>
                  {currentTier === tierColumns[idx] && (
                    <Badge className="rcms-tier-badge" variant="secondary">Your Plan</Badge>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, idx) => (
              <tr key={idx}>
                <th scope="row">
                  {feature.name}
                  {feature.desc && <small>{feature.desc}</small>}
                </th>
                <td 
                  data-col="BASIC" 
                  className={feature.xBasic ? "x" : ""}
                  dangerouslySetInnerHTML={{ __html: feature.basic }}
                />
                <td 
                  data-col="CLINICAL" 
                  className={feature.xClinical ? "x" : ""}
                  dangerouslySetInnerHTML={{ __html: feature.clinical }}
                />
                <td 
                  data-col="PREMIUM"
                  dangerouslySetInnerHTML={{ __html: feature.premium }}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="rcms-note" aria-live="polite">
        <em>Tip:</em> Upgrade to unlock broader RN engagement, proactive alerts, and advanced analytics.
      </footer>
    </section>
  );
}

export type TierName = "Basic" | "Clinical" | "Premium";
