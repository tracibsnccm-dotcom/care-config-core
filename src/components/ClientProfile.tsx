import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Edit, Save, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ClientProfileProps {
  caseId: string;
}

interface ClientData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  preferred_contact_method: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
}

interface CaseData {
  case_number: string | null;
  date_of_injury: string | null;
  assigned_rn_name: string | null;
  attorney_name: string | null;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const RELATIONSHIPS = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Friend",
  "Other",
];

export function ClientProfile({ caseId }: ClientProfileProps) {
  const { toast } = useToast();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ClientData>>({});

  useEffect(() => {
    fetchProfileData();
  }, [caseId]);

  async function fetchProfileData() {
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // a) First fetch the case to get client_id
      const caseResponse = await fetch(
        `${supabaseUrl}/rest/v1/rc_cases?id=eq.${caseId}&is_superseded=eq.false&select=id,case_number,client_id,date_of_injury`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!caseResponse.ok) {
        throw new Error('Failed to fetch case data');
      }

      const caseDataArray = await caseResponse.json();
      const caseInfo = caseDataArray[0];

      if (!caseInfo) {
        throw new Error('Case not found');
      }

      // Set case data
      setCaseData({
        case_number: caseInfo.case_number || null,
        date_of_injury: caseInfo.date_of_injury || null,
        assigned_rn_name: null, // Not assigned for now
        attorney_name: null, // Not assigned for now
      });

      // b) Then fetch the client using client_id
      const clientId = caseInfo.client_id;
      if (clientId) {
        const clientResponse = await fetch(
          `${supabaseUrl}/rest/v1/rc_clients?id=eq.${clientId}&select=*`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
          }
        );

        if (!clientResponse.ok) {
          throw new Error('Failed to fetch client data');
        }

        const clientDataArray = await clientResponse.json();
        const client = clientDataArray[0];
        if (client) {
          setClientData(client);
          setFormData(client);
        }
      } else {
        throw new Error('Client ID not found in case');
      }
    } catch (err) {
      console.error("Error fetching profile data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    console.log("=== HANDLE SAVE CALLED ===");
    if (!clientData) return;

    console.log("Save clicked, formData:", formData);
    console.log("Client ID:", clientData?.id);

    setSaving(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const updateData: Partial<ClientData> = {
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        date_of_birth: formData.date_of_birth || null,
        phone: formData.phone || null,
        email: formData.email || null,
        preferred_contact_method: formData.preferred_contact_method || null,
        street_address: formData.street_address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_relationship: formData.emergency_contact_relationship || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_clients?id=eq.${clientData.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(updateData),
        }
      );

      console.log("Save response status:", response.status);
      const responseText = await response.text();
      console.log("Save response:", responseText);

      if (!response.ok) {
        throw new Error(responseText || 'Failed to save profile');
      }

      // Update local state with saved values
      setClientData((prev) => (prev ? { ...prev, ...updateData } : null));
      setFormData((prev) => ({ ...prev, ...updateData }));
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });
      
      // Don't re-fetch immediately after save - it might cause issues
      // fetchProfileData();
    } catch (err: any) {
      console.error("Error saving profile:", err);
      toast({
        title: "Error",
        description: "Failed to save profile: " + (err.message || "Unknown error"),
        variant: "destructive",
      });
      // Stay in edit mode on error
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    if (clientData) {
      setFormData(clientData);
    }
    setIsEditing(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-slate-600">Loading profile...</p>
      </div>
    );
  }

  const data = clientData || formData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                <User className="w-6 h-6" />
                My Profile
              </CardTitle>
              <p className="text-white/80 text-sm mt-1">
                View and update your personal information
              </p>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <Button
                  onClick={cancelEdit}
                  variant="outline"
                  className="bg-white hover:bg-slate-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    console.log("Save button clicked");
                    saveProfile();
                  }}
                  disabled={saving}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Personal Information */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#4fb9af' }}>
        <CardHeader>
          <CardTitle className="text-white">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">First Name *</Label>
              {isEditing ? (
                <Input
                  value={formData.first_name || ""}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="bg-white border-slate-200"
                  placeholder="First Name"
                />
              ) : (
                <p className="text-white/90 mt-1">{data.first_name || "Not provided"}</p>
              )}
            </div>
            <div>
              <Label className="text-white">Last Name *</Label>
              {isEditing ? (
                <Input
                  value={formData.last_name || ""}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="bg-white border-slate-200"
                  placeholder="Last Name"
                />
              ) : (
                <p className="text-white/90 mt-1">{data.last_name || "Not provided"}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="text-white">Date of Birth</Label>
            {isEditing ? (
              <Input
                type="date"
                value={formData.date_of_birth || ""}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="bg-white border-slate-200"
              />
            ) : (
              <p className="text-white/90 mt-1">
                {data.date_of_birth ? format(new Date(data.date_of_birth), "MMM d, yyyy") : "Not provided"}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Phone Number</Label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-white border-slate-200"
                  placeholder="(555) 123-4567"
                />
              ) : (
                <p className="text-white/90 mt-1">{data.phone || "Not provided"}</p>
              )}
            </div>
            <div>
              <Label className="text-white">Email Address</Label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white border-slate-200"
                  placeholder="email@example.com"
                />
              ) : (
                <p className="text-white/90 mt-1">{data.email || "Not provided"}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="text-white">Preferred Contact Method</Label>
            {isEditing ? (
              <Select
                value={formData.preferred_contact_method || ""}
                onValueChange={(value) => setFormData({ ...formData, preferred_contact_method: value })}
              >
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Select contact method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-white/90 mt-1">
                {data.preferred_contact_method
                  ? data.preferred_contact_method.charAt(0).toUpperCase() + data.preferred_contact_method.slice(1)
                  : "Not provided"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#4fb9af' }}>
        <CardHeader>
          <CardTitle className="text-white">Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white">Street Address</Label>
            {isEditing ? (
              <Input
                value={formData.street_address || ""}
                onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                className="bg-white border-slate-200"
                placeholder="123 Main St"
              />
            ) : (
              <p className="text-white/90 mt-1">{data.street_address || "Not provided"}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-white">City</Label>
              {isEditing ? (
                <Input
                  value={formData.city || ""}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="bg-white border-slate-200"
                  placeholder="City"
                />
              ) : (
                <p className="text-white/90 mt-1">{data.city || "Not provided"}</p>
              )}
            </div>
            <div>
              <Label className="text-white">State</Label>
              {isEditing ? (
                <Select
                  value={formData.state || ""}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-white/90 mt-1">{data.state || "Not provided"}</p>
              )}
            </div>
            <div>
              <Label className="text-white">ZIP Code</Label>
              {isEditing ? (
                <Input
                  value={formData.zip_code || ""}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="bg-white border-slate-200"
                  placeholder="12345"
                />
              ) : (
                <p className="text-white/90 mt-1">{data.zip_code || "Not provided"}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#4fb9af' }}>
        <CardHeader>
          <CardTitle className="text-white">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white">Name</Label>
            {isEditing ? (
              <Input
                value={formData.emergency_contact_name || ""}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                className="bg-white border-slate-200"
                placeholder="Emergency contact name"
              />
            ) : (
              <p className="text-white/90 mt-1">{data.emergency_contact_name || "Not provided"}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Relationship</Label>
              {isEditing ? (
                <Select
                  value={formData.emergency_contact_relationship || ""}
                  onValueChange={(value) => setFormData({ ...formData, emergency_contact_relationship: value })}
                >
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((rel) => (
                      <SelectItem key={rel} value={rel.toLowerCase()}>
                        {rel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-white/90 mt-1">
                  {data.emergency_contact_relationship
                    ? data.emergency_contact_relationship.charAt(0).toUpperCase() + data.emergency_contact_relationship.slice(1)
                    : "Not provided"}
                </p>
              )}
            </div>
            <div>
              <Label className="text-white">Phone Number</Label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={formData.emergency_contact_phone || ""}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  className="bg-white border-slate-200"
                  placeholder="(555) 123-4567"
                />
              ) : (
                <p className="text-white/90 mt-1">{data.emergency_contact_phone || "Not provided"}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case Information (Read-only) */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white">Case Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-white">Case Number</Label>
            <p className="text-white/90 mt-1">{caseData?.case_number || "Not available"}</p>
          </div>
          <div>
            <Label className="text-white">Date of Injury</Label>
            <p className="text-white/90 mt-1">
              {caseData?.date_of_injury
                ? format(new Date(caseData.date_of_injury), "MMM d, yyyy")
                : "Not available"}
            </p>
          </div>
          <div>
            <Label className="text-white">Assigned RN</Label>
            <p className="text-white/90 mt-1">{caseData?.assigned_rn_name || "Not assigned"}</p>
          </div>
          <div>
            <Label className="text-white">Attorney</Label>
            <p className="text-white/90 mt-1">{caseData?.attorney_name || "Not assigned"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
