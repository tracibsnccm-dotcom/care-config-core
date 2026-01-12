import { WidgetGrid, Widget } from "./WidgetGrid";
import { QuickStatsWidget } from "./widgets/QuickStatsWidget";
import { MedicalResearchWidget } from "./widgets/MedicalResearchWidget";
import { EFilingWidget } from "./widgets/EFilingWidget";
import { CaseManagementWidget } from "./widgets/CaseManagementWidget";
import { PendingAssignmentsWidget } from "./widgets/PendingAssignmentsWidget";
import { RNValueWidget } from "./widgets/RNValueWidget";
import { DocumentManagementWidget } from "./widgets/DocumentManagementWidget";
import { CommunicationWidget } from "./widgets/CommunicationWidget";

const AVAILABLE_WIDGETS: Widget[] = [
  {
    id: "quick-stats",
    name: "Quick Stats",
    category: "clinical",
    component: QuickStatsWidget,
    defaultEnabled: true,
  },
  {
    id: "pending-assignments",
    name: "Pending Assignments",
    category: "clinical",
    component: PendingAssignmentsWidget,
    defaultEnabled: true,
  },
  {
    id: "communications",
    name: "Communications",
    category: "clinical",
    component: CommunicationWidget,
    defaultEnabled: true,
  },
  {
    id: "rn-value",
    name: "RN Clinical Impact",
    category: "clinical",
    component: RNValueWidget,
    defaultEnabled: true,
  },
  {
    id: "medical-research",
    name: "Medical Research Quick Search",
    category: "legal-tool",
    component: MedicalResearchWidget,
    defaultEnabled: true,
  },
  {
    id: "efiling",
    name: "E-Filing Portal Access",
    category: "legal-tool",
    component: EFilingWidget,
    defaultEnabled: false,
  },
  {
    id: "case-management",
    name: "Practice Management (Clio/MyCase)",
    category: "legal-tool",
    component: CaseManagementWidget,
    defaultEnabled: false,
  },
  {
    id: "document-management",
    name: "Document Management",
    category: "legal-tool",
    component: DocumentManagementWidget,
    defaultEnabled: false,
  },
];

export function AttorneyDashboard() {
  return (
    <div className="p-6">
      <WidgetGrid 
        availableWidgets={AVAILABLE_WIDGETS} 
        storageKey="attorney-dashboard-widgets"
      />
    </div>
  );
}
