import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiaryNaturalLanguageSearchProps {
  onFiltersApply: (filters: any) => void;
}

export function DiaryNaturalLanguageSearch({ onFiltersApply }: DiaryNaturalLanguageSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("diary-ai-assistant", {
        body: {
          action: "natural_language_search",
          query: query.trim()
        }
      });

      if (error) throw error;

      const filters = data.data;
      onFiltersApply(filters);
      toast.success("Search filters applied!");
    } catch (error) {
      console.error("Natural language search error:", error);
      toast.error("Failed to process search query");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Try: "show urgent calls from last week" or "find medication entries"'
          className="pl-10"
          disabled={loading}
        />
      </div>
      <Button onClick={handleSearch} disabled={loading || !query.trim()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
      </Button>
    </div>
  );
}
