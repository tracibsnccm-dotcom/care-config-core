import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Wand2, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiaryAIAssistantProps {
  entries?: any[];
  currentEntry?: any;
  onSuggestionApply?: (suggestion: any) => void;
}

export function DiaryAIAssistant({ entries, currentEntry, onSuggestionApply }: DiaryAIAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [categorization, setCategorization] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [sentiment, setSentiment] = useState<any>(null);

  const callAI = async (action: string, data: any = {}) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("diary-ai-assistant", {
        body: { action, ...data }
      });

      if (error) {
        if (error.message.includes("429")) {
          toast.error("Rate limit exceeded. Please try again in a moment.");
        } else if (error.message.includes("402")) {
          toast.error("AI credits exhausted. Please add credits to continue.");
        } else {
          toast.error("AI assistant error: " + error.message);
        }
        throw error;
      }

      return result.data;
    } catch (error) {
      console.error("AI assistant error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!entries || entries.length === 0) {
      toast.error("No entries to summarize");
      return;
    }
    const result = await callAI("generate_summary", { entries });
    setSummary(result.content);
    toast.success("Summary generated!");
  };

  const autoCategorize = async () => {
    if (!currentEntry) {
      toast.error("No entry to categorize");
      return;
    }
    const result = await callAI("auto_categorize", { entryData: currentEntry });
    setCategorization(result);
    toast.success("Entry categorized!");
  };

  const suggestTasks = async () => {
    if (!entries || entries.length === 0) {
      toast.error("No entries to analyze");
      return;
    }
    const result = await callAI("suggest_tasks", { entries });
    setSuggestions(result.suggestions);
    toast.success("Task suggestions generated!");
  };

  const analyzeSentiment = async () => {
    if (!entries || entries.length === 0) {
      toast.error("No entries to analyze");
      return;
    }
    const result = await callAI("sentiment_analysis", { entries });
    setSentiment(result);
    toast.success("Sentiment analyzed!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold text-lg">AI Assistant</h3>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={generateSummary}
          disabled={loading || !entries?.length}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Daily Summary
        </Button>

        <Button
          onClick={autoCategorize}
          disabled={loading || !currentEntry}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Auto-Categorize
        </Button>

        <Button
          onClick={suggestTasks}
          disabled={loading || !entries?.length}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
          Suggest Tasks
        </Button>

        <Button
          onClick={analyzeSentiment}
          disabled={loading || !entries?.length}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
          Sentiment
        </Button>
      </div>

      {/* Summary Display */}
      {summary && (
        <Card className="p-4 bg-purple-50 dark:bg-purple-950/20">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Daily Summary
          </h4>
          <p className="text-sm whitespace-pre-wrap">{summary}</p>
        </Card>
      )}

      {/* Categorization Display */}
      {categorization && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            AI Categorization
          </h4>
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium">Label:</span>
              <Badge variant="outline">{categorization.suggested_label}</Badge>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium">Priority:</span>
              <Badge variant={categorization.suggested_priority === "urgent" ? "destructive" : "outline"}>
                {categorization.suggested_priority}
              </Badge>
            </div>
            {categorization.risk_flags?.length > 0 && (
              <div className="flex gap-2 items-start">
                <span className="text-sm font-medium">Risks:</span>
                <div className="flex flex-wrap gap-1">
                  {categorization.risk_flags.map((flag: string) => (
                    <Badge key={flag} variant="destructive" className="text-xs">
                      {flag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">{categorization.reasoning}</p>
            <Button
              size="sm"
              onClick={() => onSuggestionApply?.(categorization)}
              className="mt-2"
            >
              Apply Suggestions
            </Button>
          </div>
        </Card>
      )}

      {/* Task Suggestions */}
      {suggestions.length > 0 && (
        <Card className="p-4 bg-green-50 dark:bg-green-950/20">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Suggested Tasks
          </h4>
          <div className="space-y-3">
            {suggestions.map((suggestion, idx) => (
              <div key={idx} className="border-b pb-2 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{suggestion.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{suggestion.reasoning}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.priority}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSuggestionApply?.(suggestion)}
                  className="mt-2 h-7 text-xs"
                >
                  Create Entry
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sentiment Analysis */}
      {sentiment && (
        <Card className="p-4 bg-orange-50 dark:bg-orange-950/20">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Sentiment Analysis
          </h4>
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium">Overall:</span>
              <Badge
                variant={sentiment.overall_sentiment === "concerning" ? "destructive" : "outline"}
              >
                {sentiment.overall_sentiment}
              </Badge>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium">Trend:</span>
              <Badge variant="outline">{sentiment.trend}</Badge>
            </div>
            {sentiment.concerns?.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Concerns:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {sentiment.concerns.map((concern: string, idx: number) => (
                    <li key={idx} className="text-orange-700 dark:text-orange-400">{concern}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">{sentiment.insights}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
