import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { Phone, Mail, MessageSquare, User } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Alert {
  id: string;
  case_id: string;
  client_id: string;
  alert_type: string;
  alert_details: any;
}

interface AddressAlertModalProps {
  alert: Alert;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddressAlertModal({ alert, open, onClose, onSuccess }: AddressAlertModalProps) {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const addressMethods = [
    { value: "phone_call", label: "Phone Call", icon: Phone, requiresContact: "phone" },
    { value: "text_message", label: "Text Message", icon: MessageSquare, requiresContact: "phone" },
    { value: "email", label: "Email", icon: Mail, requiresContact: "email" },
    { value: "in_person", label: "In Person", icon: User, requiresContact: null },
  ];

  const handleSubmit = async () => {
    if (!selectedMethod) {
      toast.error("Please select how you addressed this alert");
      return;
    }

    if (!resolutionNote.trim()) {
      toast.error("Please provide resolution notes");
      return;
    }

    const method = addressMethods.find(m => m.value === selectedMethod);
    if (method?.requiresContact === "phone" && !contactPhone.trim()) {
      toast.error("Phone number is required for phone calls and text messages");
      return;
    }

    if (method?.requiresContact === "email" && !contactEmail.trim()) {
      toast.error("Email address is required for email communications");
      return;
    }

    setLoading(true);

    try {
      // Update the alert as addressed
      const { error: alertError } = await supabase
        .from('rn_emergency_alerts')
        .update({
          addressed_at: new Date().toISOString(),
          addressed_by: user?.id,
          address_method: selectedMethod,
          resolution_note: resolutionNote,
        })
        .eq('id', alert.id);

      if (alertError) throw alertError;

      // Create a diary entry documenting the action
      const diaryEntry: any = {
        rn_id: user?.id,
        case_id: alert.case_id,
        entry_type: selectedMethod === 'email' ? 'email' : selectedMethod === 'in_person' ? 'in_person_visit' : 'phone_call',
        entry_date: new Date().toISOString().split('T')[0],
        notes: `Emergency Alert Response: ${alert.alert_type}\n\n${resolutionNote}`,
        requires_contact: true,
      };

      if (method?.requiresContact === "phone") {
        diaryEntry.contact_phone = contactPhone;
      } else if (method?.requiresContact === "email") {
        diaryEntry.contact_email = contactEmail;
      }

      const { error: diaryError } = await supabase
        .from('rn_diary_entries')
        .insert(diaryEntry);

      if (diaryError) throw diaryError;

      toast.success("Emergency alert addressed successfully");
      onSuccess();
    } catch (error) {
      console.error('Error addressing alert:', error);
      toast.error("Failed to address alert");
    } finally {
      setLoading(false);
    }
  };

  const selectedMethodDetails = addressMethods.find(m => m.value === selectedMethod);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Address Emergency Alert</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm font-semibold mb-1">Alert Type: {alert.alert_type.replace(/_/g, ' ').toUpperCase()}</p>
            <p className="text-sm text-muted-foreground">{alert.alert_details?.message || 'Emergency alert requires attention'}</p>
          </div>

          <div className="space-y-3">
            <Label>How did you address this alert? *</Label>
            <div className="grid grid-cols-2 gap-2">
              {addressMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <Button
                    key={method.value}
                    type="button"
                    variant={selectedMethod === method.value ? "default" : "outline"}
                    className="h-auto py-3 flex flex-col items-center gap-2"
                    onClick={() => setSelectedMethod(method.value)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{method.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {selectedMethodDetails?.requiresContact === "phone" && (
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Contact Phone Number *</Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="Enter phone number used"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          )}

          {selectedMethodDetails?.requiresContact === "email" && (
            <div className="space-y-2">
              <Label htmlFor="contact-email">Contact Email Address *</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="Enter email address used"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="resolution-note">Resolution Notes *</Label>
            <Textarea
              id="resolution-note"
              placeholder="Describe what actions were taken, client response, and any follow-up needed..."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Confirm & Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
