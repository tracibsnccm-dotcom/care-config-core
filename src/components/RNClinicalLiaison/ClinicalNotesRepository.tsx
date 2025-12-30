import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, Download, Eye, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClinicalNotesRepositoryProps {
  caseId: string;
}

interface ClinicalNote {
  id: string;
  title: string;
  note_type: string;
  created_by: string;
  created_at: string;
  file_path?: string;
}

export default function ClinicalNotesRepository({ caseId }: ClinicalNotesRepositoryProps) {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, [caseId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);

      // Fetch documents that are clinical notes
      const { data, error } = await supabase
        .from("documents")
        .select(`
          id,
          file_name,
          document_type,
          uploaded_by,
          created_at,
          file_path
        `)
        .eq("case_id", caseId)
        .in("document_type", ["Clinical Note", "Progress Note", "Assessment", "Discharge Summary"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch uploader names
      const uploaderIds = [...new Set(data?.map((d) => d.uploaded_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", uploaderIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]));

      setNotes(
        data?.map((doc) => ({
          id: doc.id,
          title: doc.file_name,
          note_type: doc.document_type,
          created_by: profileMap.get(doc.uploaded_by) || "Unknown",
          created_at: doc.created_at,
          file_path: doc.file_path,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching clinical notes:", error);
      toast({
        title: "Error",
        description: "Failed to load clinical notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from("case-documents").download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.note_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.created_by.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Clinical Notes Repository</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {searchTerm ? "No notes match your search" : "No clinical notes available"}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Note Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNotes.map((note) => (
              <TableRow key={note.id}>
                <TableCell className="font-medium">{note.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{note.note_type}</Badge>
                </TableCell>
                <TableCell>{note.created_by}</TableCell>
                <TableCell>{new Date(note.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {note.file_path && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(note.file_path!, note.title)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
