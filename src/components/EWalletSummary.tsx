import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export function EWalletSummary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [pendingReferrals, setPendingReferrals] = useState(0);
  const [pendingOffers, setPendingOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [attestationAgreed, setAttestationAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);

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
        .select("*")
        .eq("attorney_id", user.id)
        .eq("status", "pending");

      if (error) throw error;

      setPendingReferrals(data?.length || 0);
      setPendingOffers(data || []);
    } catch (error) {
      console.error("Error loading pending referrals:", error);
    }
  }

  function openAcceptModal(offer: any) {
    setSelectedOffer(offer);
    setAttestationAgreed(false);
    setShowAcceptModal(true);
  }

  function closeAcceptModal() {
    setShowAcceptModal(false);
    setSelectedOffer(null);
    setAttestationAgreed(false);
  }

  async function handleAcceptReferral() {
    if (!user || !selectedOffer || !attestationAgreed) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the attestation to proceed.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      // Call the accept_assignment_offer function
      const { data, error } = await supabase.rpc("accept_assignment_offer", {
        p_offer_id: selectedOffer.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; case_id?: string };

      if (result?.success === false) {
        toast({
          title: "Error",
          description: result.error || "Failed to accept referral.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Referral Accepted",
        description: "You have successfully accepted the client referral.",
      });

      // Refresh data
      await loadBalance();
      await loadPendingReferrals();
      closeAcceptModal();
    } catch (error) {
      console.error("Error accepting referral:", error);
      toast({
        title: "Error",
        description: "Failed to accept referral. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  }

  const isLowBalance = balance < 1500;

  return (
    <Card className={isLowBalance ? "border-2 border-amber-500" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#b09837]">
          <Wallet className="h-5 w-5" />
          Referrals & eWallet Balance
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

              <Button
                onClick={() => {
                  if (pendingReferrals > 0 && pendingOffers[0]) {
                    openAcceptModal(pendingOffers[0]);
                  }
                }}
                disabled={pendingReferrals === 0}
                className={
                  pendingReferrals > 0
                    ? "mt-3 w-full bg-[#b09837] text-black hover:bg-[#b09837]/90"
                    : "mt-3 w-full bg-muted text-muted-foreground cursor-not-allowed"
                }
              >
                Accept Referral
              </Button>

              {pendingReferrals > 0 && (
                <div className="space-y-2 mt-3">
                  {pendingOffers.slice(0, 3).map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-xs text-muted-foreground">
                        Case: RC-{offer.case_id.slice(-8).toUpperCase()}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => openAcceptModal(offer)}
                        className="bg-[#b09837] text-black hover:bg-[#b09837]/90 h-7 text-xs"
                      >
                        Accept Referral
                      </Button>
                    </div>
                  ))}
                  {pendingReferrals > 3 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="px-0 h-auto text-xs w-full"
                      onClick={() => navigate("/attorney-portal")}
                    >
                      View all {pendingReferrals} pending →
                    </Button>
                  )}
                </div>
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

      {/* Accept Referral Attestation Modal */}
      <Dialog open={showAcceptModal} onOpenChange={closeAcceptModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0f2a6a]">Accept Referral Attestation</DialogTitle>
            <DialogDescription>
              Please review and agree to the following terms before accepting this referral.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedOffer && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Case ID:</strong> RC-{selectedOffer.case_id.slice(-8).toUpperCase()}
                </p>
                <p className="text-sm mt-1">
                  <strong>Fee:</strong> $1,500 + 3.25% processing + applicable tax
                </p>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-[#b09837]/10 rounded-lg border border-[#b09837]/20">
              <Checkbox
                id="attestation"
                checked={attestationAgreed}
                onCheckedChange={(checked) => setAttestationAgreed(checked === true)}
              />
              <Label
                htmlFor="attestation"
                className="text-sm leading-relaxed cursor-pointer font-normal"
              >
                I authorize RCMS to deduct the Administrative Coordination & Case Transfer Fee from your eWallet, I understand that RCMS is not responsible for the duration of the relationship between attorney and client, and fee are non-refundable.
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAcceptModal} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleAcceptReferral}
              disabled={!attestationAgreed || processing}
              className="bg-[#b09837] text-black hover:bg-[#b09837]/90"
            >
              {processing ? "Processing..." : "Accept & Authorize Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
