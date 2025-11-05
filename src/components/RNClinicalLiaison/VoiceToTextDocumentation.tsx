import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Play, Sparkles, FileText, Copy } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function VoiceToTextDocumentation() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartRecording = () => {
    setIsRecording(true);
    // Placeholder: Would integrate with Web Speech API or similar
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Placeholder: Simulate transcription
    setTimeout(() => {
      setTranscription("Client reports improved mobility in left shoulder. Range of motion has increased approximately 30% since last assessment. Pain levels decreased from 7/10 to 4/10. Client is compliant with home exercise program. Discussed importance of continued PT attendance.");
      setAiSummary("**Key Points:**\n• Improved shoulder mobility (+30% ROM)\n• Pain reduced from 7/10 to 4/10\n• Compliant with HEP\n• Continue current PT plan");
      setIsProcessing(false);
    }, 2000);
  };

  const handleCopyTranscription = () => {
    navigator.clipboard.writeText(transcription);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Voice-to-Text Documentation</h2>
        <p className="text-sm text-muted-foreground">Record clinical notes using voice dictation</p>
      </div>

      <Alert>
        <Sparkles className="w-4 h-4" />
        <AlertDescription>
          <strong>AI-Enhanced:</strong> Automatic transcription with AI-powered summarization and key point extraction.
        </AlertDescription>
      </Alert>

      {/* Recording Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Voice Recording</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            {isRecording && (
              <div className="relative">
                <div className="absolute inset-0 animate-ping">
                  <div className="w-20 h-20 rounded-full bg-destructive/20"></div>
                </div>
                <div className="relative w-20 h-20 rounded-full bg-destructive flex items-center justify-center">
                  <Mic className="w-10 h-10 text-white" />
                </div>
              </div>
            )}
            {!isRecording && !isProcessing && (
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                <Mic className="w-10 h-10 text-white" />
              </div>
            )}
            {isProcessing && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Processing audio...</p>
              </div>
            )}
            
            <div className="text-center">
              {isRecording && (
                <>
                  <p className="text-lg font-semibold text-destructive">Recording...</p>
                  <p className="text-sm text-muted-foreground">Speak clearly into your microphone</p>
                </>
              )}
              {!isRecording && !isProcessing && (
                <>
                  <p className="text-lg font-semibold">Ready to Record</p>
                  <p className="text-sm text-muted-foreground">Click the button below to start</p>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-2">
            {!isRecording && !isProcessing && (
              <Button size="lg" onClick={handleStartRecording}>
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}
            {isRecording && (
              <Button size="lg" variant="destructive" onClick={handleStopRecording}>
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transcription */}
      {transcription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Transcription
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">100% Confidence</Badge>
                <Button variant="outline" size="sm" onClick={handleCopyTranscription}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
      )}

      {/* AI Summary */}
      {aiSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI-Generated Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans">{aiSummary}</pre>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-1" />
                Add to Case Notes
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-1" />
                Copy Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
