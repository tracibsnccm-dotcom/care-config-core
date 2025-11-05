import { useState, useEffect } from "react";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { ProviderAvailabilityScheduler } from "@/components/provider/ProviderAvailabilityScheduler";
import { User, MapPin, Phone, Mail, FileText, Clock } from "lucide-react";

export default function ProviderProfileSetup() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile fields
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fax, setFax] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [npi, setNpi] = useState("");
  const [bio, setBio] = useState("");
  const [acceptingPatients, setAcceptingPatients] = useState(true);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProviderProfile();
    }
  }, [user]);

  async function fetchProviderProfile() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setName(data.name || "");
        setSpecialty(data.specialty || "");
        setPracticeName(data.practice_name || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setFax(data.fax || "");
        setAddress(data.address || "");
        setCity(data.city || "");
        setState(data.state || "");
        setZipCode(data.zip_code || "");
        setNpi(data.npi || "");
        setBio(data.bio || "");
        setAcceptingPatients(data.accepting_patients ?? true);
        setIsActive(data.is_active ?? true);
      }
    } catch (error: any) {
      console.error("Error fetching provider profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!name.trim() || !specialty.trim()) {
      toast.error("Name and specialty are required");
      return;
    }

    try {
      setSaving(true);

      // Check if provider exists
      const { data: existing } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      const providerData = {
        user_id: user!.id,
        name: name.trim(),
        specialty: specialty.trim(),
        practice_name: practiceName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        fax: fax.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zip_code: zipCode.trim() || null,
        npi: npi.trim() || null,
        bio: bio.trim() || null,
        accepting_patients: acceptingPatients,
        is_active: isActive,
      };

      if (existing) {
        const { error } = await supabase
          .from("providers")
          .update(providerData)
          .eq("id", existing.id);

        if (error) throw error;
        toast.success("Profile updated successfully");
      } else {
        const { error } = await supabase
          .from("providers")
          .insert([providerData]);

        if (error) throw error;
        toast.success("Profile created successfully");
      }
    } catch (error: any) {
      console.error("Error saving provider profile:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 flex items-center justify-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Provider Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your professional profile and availability</p>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Basic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. John Smith"
                />
              </div>
              <div>
                <Label htmlFor="specialty">Specialty *</Label>
                <Input
                  id="specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Orthopedic Surgeon"
                />
              </div>
              <div>
                <Label htmlFor="practice">Practice Name</Label>
                <Input
                  id="practice"
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                  placeholder="Smith Medical Group"
                />
              </div>
              <div>
                <Label htmlFor="npi">NPI Number</Label>
                <Input
                  id="npi"
                  value={npi}
                  onChange={(e) => setNpi(e.target.value)}
                  placeholder="1234567890"
                  maxLength={10}
                />
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@example.com"
                />
              </div>
              <div>
                <Label htmlFor="fax">Fax</Label>
                <Input
                  id="fax"
                  type="tel"
                  value={fax}
                  onChange={(e) => setFax(e.target.value)}
                  placeholder="(555) 123-4568"
                />
              </div>
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Location</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="zip">Zip Code</Label>
                  <Input
                    id="zip"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="94102"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Professional Bio */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Professional Bio</h2>
            </div>
            <div>
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your experience, specializations, and approach to patient care..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {bio.length} characters
              </p>
            </div>
          </Card>

          {/* Availability Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Availability</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="accepting">Accepting New Patients</Label>
                  <p className="text-sm text-muted-foreground">
                    Show your profile in the directory for new patient referrals
                  </p>
                </div>
                <Switch
                  id="accepting"
                  checked={acceptingPatients}
                  onCheckedChange={setAcceptingPatients}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="active">Profile Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible in the system
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>
          </Card>

          {/* Availability Scheduler */}
          <ProviderAvailabilityScheduler />

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim() || !specialty.trim()}
              className="bg-primary hover:bg-primary-dark"
            >
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
