import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { useNavigate } from "react-router-dom";

export function EWalletSummary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [pendingReferrals, setPendingReferrals] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadBalance();
    loadPendingReferrals();
  }, [user]);

  async function loadBalance() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("attorney_wallet")
        .select("balance")
        .eq("attorney_id", user.id)
        .maybeSingle();

      if (error) throw error;

      setBalance(data?.balance || 0);
    } catch (error) {
      console.error("Error loading wallet balance:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingReferrals() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("assignment_offers")
        .select("id")
        .eq("attorney_id", user.id)
        .eq("status", "pending");

      if (error) throw error;

      setPendingReferrals(data?.length || 0);
    } catch (error) {
      console.error("Error loading pending referrals:", error);
    }
  }

  const isLowBalance = balance < 1500;

  return (
    <Card className={isLowBalance ? "border-2 border-amber-500" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#b09837]">
          <Wallet className="h-5 w-5" />
          eWallet Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <>
            {/* Pending Referrals */}
            <div className="pb-3 border-b border-border">
              <p className="text-sm text-muted-foreground mb-1">Pending Referrals</p>
              <p className="text-2xl font-bold text-primary">{pendingReferrals}</p>
              {pendingReferrals > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  className="px-0 h-auto text-xs"
                  onClick={() => navigate("/attorney-portal")}
                >
                  View pending assignments →
                </Button>
              )}
            </div>

            {/* Wallet Balance */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">eWallet Balance</p>
              <p className="text-3xl font-bold">${balance.toLocaleString()}</p>
              {isLowBalance && (
                <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <p>Low balance—add funds to accept referrals.</p>
                </div>
              )}
            </div>
            <Button
              onClick={() => navigate("/attorney/billing?tab=ewallet")}
              className="w-full bg-[#b09837] text-black hover:bg-[#b09837]/90"
            >
              Add Funds
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
