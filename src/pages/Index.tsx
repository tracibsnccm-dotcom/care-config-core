import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, Shield, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Reconcile <span className="text-accent">C.A.R.E.</span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Comprehensive care management for legal and medical coordination
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="p-6 bg-white/95 backdrop-blur border-0 shadow-card">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Secure & Compliant</h3>
            <p className="text-muted-foreground">
              Built with privacy-first design and role-based access controls
            </p>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur border-0 shadow-card">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">The 4Ps of Wellness Care Management Tool</h3>
            <p className="text-muted-foreground">
              Tracks Physical, Psychological, Psychosocial and Professional dynamics that impacts overall health and wellness.
            </p>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur border-0 shadow-card">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Provider Network</h3>
            <p className="text-muted-foreground">
              Connect clients with verified healthcare providers seamlessly
            </p>
          </Card>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-accent hover:bg-accent-light text-accent-foreground px-8 py-6 text-lg mr-4"
            onClick={() => navigate("/attorney")}
          >
            Attorney Portal
          </Button>
          <Button
            size="lg"
            className="px-8 py-6 text-lg mr-4 text-white hover:opacity-90"
            style={{ backgroundColor: '#0f2a6a' }}
            onClick={() => navigate("/client-portal")}
          >
            Client Portal
          </Button>
          <Button
            size="lg"
            className="px-8 py-6 text-lg text-white hover:opacity-90"
            style={{ backgroundColor: '#009879' }}
            onClick={() => navigate("/intake")}
          >
            Client Intake
          </Button>
          <p className="text-white/60 text-sm mt-4">Demo Mode • No Authentication Required</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
