import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Upload, Search, Download, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/auth/supabaseAuth";

export function StaffDocumentsView() {
  const { user } = useAuth();
  const isRcmsStaff = user?.roles?.includes("RCMS_STAFF");

  const documents = [
    { id: 1, name: "Medical Records - Smith", type: "Medical", status: "Pending Review", date: "2024-01-20" },
    { id: 2, name: "Insurance Authorization - Johnson", type: "Insurance", status: "Approved", date: "2024-01-19" },
    { id: 3, name: "Consent Form - Taylor", type: "Legal", status: "Completed", date: "2024-01-18" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Document Management</CardTitle>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents by name, type, or case..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.type} • {doc.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={
                    doc.status === "Approved" ? "default" :
                    doc.status === "Completed" ? "secondary" :
                    "outline"
                  }>
                    {doc.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isRcmsStaff && (
        <Card>
          <CardHeader>
            <CardTitle>Document Processing Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No documents pending processing</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
