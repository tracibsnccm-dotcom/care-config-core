import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { Phone, MapPin, FileText, Globe } from "lucide-react";

interface ContactInfo {
  phone: string;
  fax: string;
  officeAddress: string;
  city: string;
  state: string;
  zipCode: string;
  website: string;
}

export function AttorneyContactInfo() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<ContactInfo>({
    phone: "",
    fax: "",
    officeAddress: "",
    city: "",
    state: "",
    zipCode: "",
    website: "",
  });

  useEffect(() => {
    loadContactInfo();
  }, [user?.id]);

  const loadContactInfo = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        // Extract contact info from profiles table (assuming these fields exist or will be added)
        setContact({
          phone: (data as any).phone || "",
          fax: (data as any).fax || "",
          officeAddress: (data as any).office_address || "",
          city: (data as any).city || "",
          state: (data as any).state || "",
          zipCode: (data as any).zip_code || "",
          website: (data as any).website || "",
        });
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: contact.phone,
          fax: contact.fax,
          office_address: contact.officeAddress,
          city: contact.city,
          state: contact.state,
          zip_code: contact.zipCode,
          website: contact.website,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('user_id', user?.id);

      if (error) throw error;
      toast.success("Contact information saved");
    } catch (error: any) {
      console.error('Error saving contact info:', error);
      toast.error("Failed to save contact information");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary" />
          Contact Information
        </CardTitle>
        <CardDescription>
          Manage your professional contact details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Office Phone</Label>
            <div className="flex gap-2">
              <Phone className="w-4 h-4 text-muted-foreground mt-3" />
              <Input
                id="phone"
                type="tel"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fax">Fax Number</Label>
            <div className="flex gap-2">
              <FileText className="w-4 h-4 text-muted-foreground mt-3" />
              <Input
                id="fax"
                type="tel"
                value={contact.fax}
                onChange={(e) => setContact({ ...contact, fax: e.target.value })}
                placeholder="(555) 123-4568"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Office Address
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="office-address">Street Address</Label>
            <Input
              id="office-address"
              value={contact.officeAddress}
              onChange={(e) => setContact({ ...contact, officeAddress: e.target.value })}
              placeholder="123 Main Street, Suite 100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={contact.city}
                onChange={(e) => setContact({ ...contact, city: e.target.value })}
                placeholder="New York"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={contact.state}
                onChange={(e) => setContact({ ...contact, state: e.target.value })}
                placeholder="NY"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={contact.zipCode}
                onChange={(e) => setContact({ ...contact, zipCode: e.target.value })}
                placeholder="10001"
                maxLength={10}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="website">Website</Label>
          <div className="flex gap-2">
            <Globe className="w-4 h-4 text-muted-foreground mt-3" />
            <Input
              id="website"
              type="url"
              value={contact.website}
              onChange={(e) => setContact({ ...contact, website: e.target.value })}
              placeholder="https://www.lawfirm.com"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? "Saving..." : "Save Contact Information"}
        </Button>
      </CardContent>
    </Card>
  );
}