import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceDictationProps {
  onTranscript: (text: string) => void;
  language?: string;
}

export function VoiceDictation({ onTranscript, language = "en-US" }: VoiceDictationProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + " ";
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      setTranscript(finalTranscript + interimTranscript);
      
      if (finalTranscript) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        toast.error("No speech detected. Please try again.");
      } else if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please enable it in your browser settings.");
      } else {
        toast.error(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.success("Voice dictation stopped");
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
      toast.info("Voice dictation started. Speak now...");
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <MicOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Voice dictation is not supported in your browser.
              <br />
              Try Chrome, Edge, or Safari for voice features.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isListening ? "border-primary" : ""}>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            <span className="font-medium">Voice Dictation</span>
          </div>
          <Button
            variant={isListening ? "destructive" : "default"}
            size="sm"
            onClick={toggleListening}
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Start Dictation
              </>
            )}
          </Button>
        </div>

        {isListening && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-primary animate-pulse" style={{ animationDelay: "0ms" }} />
                <div className="w-1 h-4 bg-primary animate-pulse" style={{ animationDelay: "150ms" }} />
                <div className="w-1 h-4 bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-sm font-medium text-primary">Listening...</span>
            </div>
            {transcript && (
              <p className="text-sm text-muted-foreground mt-2">
                {transcript}
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Click "Start Dictation" and speak naturally. Your words will be transcribed in real-time.
        </p>
      </CardContent>
    </Card>
  );
}