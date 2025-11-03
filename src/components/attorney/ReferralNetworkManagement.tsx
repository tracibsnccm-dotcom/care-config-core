import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Star, Phone, Mail, MapPin, Plus, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  referrals_sent: number;
  phone: string;
  email: string;
  location: string;
  network_tier: "preferred" | "standard" | "out-of-network";
  accepts_workers_comp: boolean;
}

export default function ReferralNetworkManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const [specialists] = useState<Specialist[]>([
    {
      id: "1",
      name: "Dr. Sarah Johnson",
      specialty: "Orthopedic Surgery",
      rating: 4.8,
      referrals_sent: 23,
      phone: "(555) 123-4567",
      email: "sjohnson@orthocenter.com",
      location: "Downtown Medical Plaza",
      network_tier: "preferred",
      accepts_workers_comp: true
    },
    {
      id: "2",
      name: "Dr. Michael Chen",
      specialty: "Neurology",
      rating: 4.9,
      referrals_sent: 15,
      phone: "(555) 234-5678",
      email: "mchen@neuroclinic.com",
      location: "Regional Hospital",
      network_tier: "preferred",
      accepts_workers_comp: true
    },
    {
      id: "3",
      name: "Dr. Emily Rodriguez",
      specialty: "Physical Therapy",
      rating: 4.7,
      referrals_sent: 45,
      phone: "(555) 345-6789",
      email: "erodriguez@ptcenter.com",
      location: "Rehabilitation Center",
      network_tier: "standard",
      accepts_workers_comp: true
    },
    {
      id: "4",
      name: "Dr. James Wilson",
      specialty: "Pain Management",
      rating: 4.6,
      referrals_sent: 18,
      phone: "(555) 456-7890",
      email: "jwilson@painspecialists.com",
      location: "Pain Management Clinic",
      network_tier: "preferred",
      accepts_workers_comp: true
    }
  ]);

  const filteredSpecialists = specialists.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const preferredProviders = specialists.filter(s => s.network_tier === "preferred");
  const totalReferrals = specialists.reduce((sum, s) => sum + s.referrals_sent, 0);
  const avgRating = specialists.reduce((sum, s) => sum + s.rating, 0) / specialists.length;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "preferred": return "default";
      case "standard": return "secondary";
      case "out-of-network": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Network Providers</p>
              <p className="text-2xl font-bold">{specialists.length}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Preferred Providers</p>
              <p className="text-2xl font-bold text-blue-500">{preferredProviders.length}</p>
            </div>
            <Star className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <p className="text-2xl font-bold">{totalReferrals}</p>
            </div>
            <UserPlus className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold text-yellow-500">{avgRating.toFixed(1)}</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search specialists by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Providers ({filteredSpecialists.length})</TabsTrigger>
          <TabsTrigger value="preferred">Preferred ({preferredProviders.length})</TabsTrigger>
          <TabsTrigger value="specialties">By Specialty</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {filteredSpecialists.map((specialist) => (
            <Card key={specialist.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{specialist.name}</h4>
                    <Badge variant={getTierColor(specialist.network_tier)}>
                      {specialist.network_tier}
                    </Badge>
                    {specialist.accepts_workers_comp && (
                      <Badge variant="outline">Workers Comp</Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{specialist.specialty}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{specialist.rating}/5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                      <span>{specialist.referrals_sent} referrals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{specialist.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{specialist.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                  <Button size="sm">Make Referral</Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="preferred" className="space-y-3">
          {preferredProviders.map((specialist) => (
            <Card key={specialist.id} className="p-4 border-blue-500">
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6 text-yellow-500" />
                <div className="flex-1">
                  <h4 className="font-semibold">{specialist.name}</h4>
                  <p className="text-sm text-muted-foreground">{specialist.specialty}</p>
                </div>
                <Badge variant="default">Preferred</Badge>
                <Button size="sm">Refer</Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="specialties">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Providers by Specialty</h3>
            <div className="space-y-4">
              {Array.from(new Set(specialists.map(s => s.specialty))).map((specialty) => {
                const count = specialists.filter(s => s.specialty === specialty).length;
                return (
                  <div key={specialty} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{specialty}</h4>
                      <p className="text-sm text-muted-foreground">{count} providers</p>
                    </div>
                    <Button size="sm" variant="outline">View All</Button>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
