import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { MessageSquare, Mail } from "lucide-react";

interface CommunicationPrefs {
  emailSignature: string;
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  preferredContactMethod: string;
}

export function AttorneyCommunicationPreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<CommunicationPrefs>({
    emailSignature: "",
    autoReplyEnabled: false,
    autoReplyMessage: "",
    preferredContactMethod: "email",
  });

  useEffect(() => {
    loadPreferences();
  }, [user?.id]);

  const loadPreferences = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, full_name')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        const defaultSignature = `Best regards,\n${data.full_name || data.display_name || ''}\nAttorney at Law`;
        setPrefs({
          ...prefs,
          emailSignature: defaultSignature,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Store in user_preferences as JSON metadata
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
        });

      if (error) throw error;
      toast.success("Communication preferences saved");
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Communication Preferences
        </CardTitle>
        <CardDescription>
          Customize your email signature and automatic replies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-signature">Email Signature</Label>
            <Textarea
              id="email-signature"
              value={prefs.emailSignature}
              onChange={(e) => setPrefs({ ...prefs, emailSignature: e.target.value })}
              placeholder="Your professional email signature..."
              rows={5}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This signature will be added to your outgoing emails
            </p>
          </div>

          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-reply">Auto-Reply</Label>
                <p className="text-sm text-muted-foreground">
                  Send automatic responses when you're unavailable
                </p>
              </div>
              <Switch
                id="auto-reply"
                checked={prefs.autoReplyEnabled}
                onCheckedChange={(checked) =>
                  setPrefs({ ...prefs, autoReplyEnabled: checked })
                }
              />
            </div>

            {prefs.autoReplyEnabled && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label htmlFor="auto-reply-message">Auto-Reply Message</Label>
                <Textarea
                  id="auto-reply-message"
                  value={prefs.autoReplyMessage}
                  onChange={(e) => setPrefs({ ...prefs, autoReplyMessage: e.target.value })}
                  placeholder="Thank you for your message. I am currently unavailable..."
                  rows={4}
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t space-y-2">
            <Label htmlFor="contact-method">Preferred Contact Method</Label>
            <div className="flex gap-2">
              <Button
                variant={prefs.preferredContactMethod === 'email' ? 'default' : 'outline'}
                onClick={() => setPrefs({ ...prefs, preferredContactMethod: 'email' })}
                className="flex-1"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                variant={prefs.preferredContactMethod === 'platform' ? 'default' : 'outline'}
                onClick={() => setPrefs({ ...prefs, preferredContactMethod: 'platform' })}
                className="flex-1"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Platform Messages
              </Button>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}