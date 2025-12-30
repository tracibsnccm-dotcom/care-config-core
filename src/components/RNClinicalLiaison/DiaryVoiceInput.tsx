import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DiaryVoiceInputProps {
  onTranscript: (text: string) => void;
  field: "title" | "description";
}

export function DiaryVoiceInput({ onTranscript, field }: DiaryVoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          
          onTranscript(transcript);
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error !== 'no-speech') {
            toast.error(`Voice input error: ${event.error}`);
          }
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      toast.info("Voice input stopped");
    } else {
      recognition.start();
      setIsListening(true);
      toast.info(`Listening for ${field}...`);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={isListening ? "destructive" : "outline"}
      size="sm"
      onClick={toggleListening}
      className="shrink-0"
    >
      {isListening ? (
        <>
          <MicOff className="h-4 w-4 mr-2" />
          Stop
        </>
      ) : (
        <>
          <Mic className="h-4 w-4 mr-2" />
          Dictate
        </>
      )}
    </Button>
  );
}