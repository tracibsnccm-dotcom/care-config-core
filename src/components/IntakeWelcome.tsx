import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, Play, HelpCircle } from "lucide-react";
import { Consent, Client } from "@/config/rcms";

interface IntakeWelcomeProps {
  client: Client;
  consent: Consent;
  sensitiveTag: boolean;
  onClientChange: (client: Client) => void;
  onConsentChange: (consent: Consent) => void;
  onSensitiveChange: (sensitive: boolean) => void;
  onContinue: () => void;
}

export function IntakeWelcome({
  client,
  consent,
  sensitiveTag,
  onClientChange,
  onConsentChange,
  onSensitiveChange,
  onContinue,
}: IntakeWelcomeProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [showCaraModal, setShowCaraModal] = useState(false);
  const [caraQuestion, setCaraQuestion] = useState("");
  const [caraLang, setCaraLang] = useState("en");
  const [caraStyle, setCaraStyle] = useState("simple");
  const [caraAnswer, setCaraAnswer] = useState("");
  const [isLoadingCara, setIsLoadingCara] = useState(false);

  const VIDEO_URL = "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&autoplay=1";

  const handleCaraExplain = async () => {
    if (!caraQuestion.trim()) {
      return;
    }
    
    setIsLoadingCara(true);
    try {
      // This would call your CARA API endpoint
      // For now, we'll show a placeholder
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCaraAnswer("CARA will help explain this in your preferred language and style. This feature connects to your CARA assistant backend.");
    } catch (error) {
      console.error("CARA error:", error);
      setCaraAnswer("Could not reach CARA at this time. Please try again.");
    } finally {
      setIsLoadingCara(false);
    }
  };

  const handleAskCara = (prefillText?: string) => {
    setCaraQuestion(prefillText || "");
    setCaraAnswer("");
    setShowCaraModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6 items-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-primary">
            Welcome to Reconcile <span className="text-accent">C.A.R.E.</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            This guided intake takes about <strong>8–10 minutes</strong>. You can pause and resume anytime.
            Your information is private, encrypted, and only shared with your authorized care team.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-accent text-primary">HIPAA-Aligned</Badge>
            <Badge variant="outline" className="border-accent text-primary">Secure & Encrypted</Badge>
            <Badge variant="outline" className="border-accent text-primary">Trauma-Informed</Badge>
          </div>
        </div>

        {/* Video Section */}
        <Card className="relative aspect-video overflow-hidden border-2 border-accent">
          {!showVideo ? (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => setShowVideo(true)}
            >
              <Button size="lg" className="rounded-full w-16 h-16 p-0">
                <Play className="w-8 h-8" />
              </Button>
              <p className="mt-4 font-semibold text-foreground">Watch: How this works (2:10)</p>
            </div>
          ) : (
            <iframe
              src={VIDEO_URL}
              title="Intake Explainer"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </Card>
      </div>

      {/* CARA Quick Access Bar */}
      <Card className="p-4 bg-secondary/20 border-accent">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="font-bold text-primary">CARA</span>
            <span className="text-muted-foreground">— Your Care Reflection Assistant</span>
            <button
              className="w-5 h-5 rounded-full bg-accent text-background flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity"
              onClick={() => handleAskCara("What is CARA and how does it help me?")}
              aria-label="Privacy Info"
            >
              ?
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Select value={caraLang} onValueChange={setCaraLang}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="ht">Kreyòl Ayisyen</SelectItem>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => handleAskCara()} className="bg-primary hover:bg-primary/90">
              ✨ Ask CARA
            </Button>
          </div>
        </div>
      </Card>

      {/* Consent Card */}
      <Card className="p-6 border-2 border-accent">
        <h2 className="text-2xl font-bold text-primary mb-2">Welcome & Consent Gate</h2>
        <p className="text-muted-foreground mb-6">
          Please tell us your name and how you want us to share information with your care team.
        </p>

        <div className="space-y-6">
          <div>
            <Label htmlFor="client-name" className="flex items-center gap-2 mb-2">
              Client full name
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => handleAskCara("Please explain why you need my full name")}
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </Label>
            <Input
              id="client-name"
              value={client.fullName || ""}
              onChange={(e) => onClientChange({ ...client, fullName: e.target.value })}
              placeholder="e.g., Sue Smith"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="consent-attorney"
                checked={consent.scope.shareWithAttorney}
                onCheckedChange={(checked) =>
                  onConsentChange({
                    ...consent,
                    scope: { ...consent.scope, shareWithAttorney: checked as boolean },
                  })
                }
              />
              <Label htmlFor="consent-attorney" className="cursor-pointer flex items-center gap-2">
                Authorize sharing with attorney
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAskCara("What does authorizing sharing with attorney mean?");
                  }}
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="consent-providers"
                checked={consent.scope.shareWithProviders}
                onCheckedChange={(checked) =>
                  onConsentChange({
                    ...consent,
                    scope: { ...consent.scope, shareWithProviders: checked as boolean },
                  })
                }
              />
              <Label htmlFor="consent-providers" className="cursor-pointer flex items-center gap-2">
                Authorize sharing with providers
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAskCara("What does authorizing sharing with providers mean?");
                  }}
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </Label>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                onConsentChange({
                  ...consent,
                  signed: true,
                  signedAt: new Date().toISOString(),
                });
                onContinue();
              }}
              className="bg-accent hover:bg-accent/90 text-background"
            >
              <Check className="w-4 h-4 mr-2" />
              Agree & Continue
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onConsentChange({ ...consent, signed: false });
                onContinue();
              }}
            >
              Not now
            </Button>
          </div>

          {/* Sensitive Case Banner */}
          <Card className="p-4 bg-destructive/5 border-destructive/20">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="sensitive-tag"
                checked={sensitiveTag}
                onCheckedChange={(checked) => onSensitiveChange(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="sensitive-tag" className="cursor-pointer font-bold flex items-center gap-2">
                  Mark as Sensitive Case
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAskCara("What is a sensitive case and why would I mark it?");
                    }}
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  (sexual assault, minor, hate-crime) — If checked, your case is restricted and only visible to a limited team with additional protections.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {/* CARA Modal */}
      <Dialog open={showCaraModal} onOpenChange={setShowCaraModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Ask CARA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cara-question">What would you like help with?</Label>
              <Textarea
                id="cara-question"
                value={caraQuestion}
                onChange={(e) => setCaraQuestion(e.target.value)}
                placeholder="Type or paste the question you want explained or translated…"
                rows={3}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cara-modal-lang">Language</Label>
                <Select value={caraLang} onValueChange={setCaraLang}>
                  <SelectTrigger id="cara-modal-lang" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="ht">Kreyòl Ayisyen</SelectItem>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cara-modal-style">Style</Label>
                <Select value={caraStyle} onValueChange={setCaraStyle}>
                  <SelectTrigger id="cara-modal-style" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple & clear</SelectItem>
                    <SelectItem value="encouraging">Encouraging</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleCaraExplain} 
              disabled={isLoadingCara || !caraQuestion.trim()}
              className="w-full"
            >
              {isLoadingCara ? "Thinking..." : "Explain / Translate"}
            </Button>

            {caraAnswer && (
              <Card className="p-4 bg-secondary/20">
                <p className="text-sm whitespace-pre-wrap">{caraAnswer}</p>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
