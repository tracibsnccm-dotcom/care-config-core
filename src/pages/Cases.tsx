import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { CaseCard } from "@/components/CaseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/context/AppContext";
import { Plus, Search } from "lucide-react";

export default function Cases() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { cases } = useApp();

  const filteredCases = cases.filter((c) =>
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.client.rcmsId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cases</h1>
            <p className="text-muted-foreground mt-1">Manage all client cases</p>
          </div>
          <Button className="bg-primary hover:bg-primary-dark">
            <Plus className="w-4 h-4 mr-2" />
            New Case
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search cases by ID or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCases.map((caseData) => (
            <CaseCard
              key={caseData.id}
              case={caseData}
              onClick={() => navigate(`/cases/${caseData.id}`)}
            />
          ))}
        </div>

        {filteredCases.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No cases found matching your search.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
