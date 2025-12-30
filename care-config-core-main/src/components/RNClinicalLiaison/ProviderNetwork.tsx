import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Phone, Mail, MapPin, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProviderNetworkProps {
  caseId: string;
}

interface Provider {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
  accepting_patients: boolean;
}

export default function ProviderNetwork({ caseId }: ProviderNetworkProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .eq("accepting_patients", true)
        .order("name");

      if (error) throw error;

      setProviders(
        data?.map((p) => ({
          id: p.id,
          name: p.name,
          specialty: p.specialty || "General Practice",
          phone: p.phone || "N/A",
          email: p.email || "N/A",
          address: p.address || "N/A",
          rating: 4.5, // Placeholder
          accepting_patients: p.accepting_patients,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast({
        title: "Error",
        description: "Failed to load provider network",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter(
    (provider) =>
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Provider Network</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {filteredProviders.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {searchTerm ? "No providers match your search" : "No providers available"}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{provider.name}</h4>
                  <Badge variant="secondary" className="mt-1">
                    {provider.specialty}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{provider.rating}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{provider.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{provider.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{provider.address}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant={provider.accepting_patients ? "default" : "secondary"}>
                  {provider.accepting_patients ? "Accepting Patients" : "Not Accepting"}
                </Badge>
                <Button variant="outline" size="sm">
                  Request Referral
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
