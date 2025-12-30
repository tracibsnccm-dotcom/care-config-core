import { useState, useEffect } from "react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, FileText, User, FolderOpen, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";

interface SearchResult {
  id: string;
  type: "case" | "document" | "client" | "appointment";
  title: string;
  subtitle: string;
  route: string;
}

export default function AttorneyGlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  const { cases } = useApp();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search cases
    cases.forEach((c) => {
      const caseId = c.id?.toLowerCase() || "";
      const status = c.status?.toLowerCase() || "";
      const clientName = (c.client?.fullName || c.client?.displayNameMasked || "")?.toLowerCase();
      
      if (caseId.includes(lowerQuery) || status.includes(lowerQuery) || clientName.includes(lowerQuery)) {
        searchResults.push({
          id: c.id,
          type: "case",
          title: `Case ${c.id?.slice(-8)}`,
          subtitle: `${c.status} - ${c.client?.fullName || c.client?.displayNameMasked || "Unknown"}`,
          route: `/case-detail/${c.id}`
        });
      }
    });

    setResults(searchResults.slice(0, 10));
  }, [query, cases]);

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "case": return <FolderOpen className="h-4 w-4" />;
      case "document": return <FileText className="h-4 w-4" />;
      case "client": return <User className="h-4 w-4" />;
      case "appointment": return <Calendar className="h-4 w-4" />;
    }
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    navigate(result.route);
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full max-w-sm justify-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden md:inline">Search cases, documents...</span>
        <span className="md:hidden">Search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search cases, documents, clients..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {results.length > 0 && (
            <CommandGroup heading="Results">
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                  className="cursor-pointer"
                >
                  {getIcon(result.type)}
                  <div className="ml-2">
                    <div className="font-medium">{result.title}</div>
                    <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
