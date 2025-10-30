import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, FileText, Briefcase, Wallet, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

export default function AttorneyBilling() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "plan";

  const [tierData, setTierData] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [addAmount, setAddAmount] = useState("");
  const [fundAgreed, setFundAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadTierData();
    loadWalletData();
    loadTransactions();
  }, [user]);

  async function loadTierData() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("attorney_metadata")
        .select("tier, plan_price, renewal_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setTierData(data);
    } catch (error) {
      console.error("Error loading tier data:", error);
    }
  }

  async function loadWalletData() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("attorney_wallet")
        .select("balance")
        .eq("attorney_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (!data) {
        // Create wallet if doesn't exist
        const { error: insertError } = await supabase
          .from("attorney_wallet")
          .insert({ attorney_id: user.id, balance: 0 });
        
        if (insertError) throw insertError;
        setWalletBalance(0);
      } else {
        setWalletBalance(data.balance);
      }
    } catch (error) {
      console.error("Error loading wallet data:", error);
    }
  }

  async function loadTransactions() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("attorney_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  }

  async function handleAddFunds() {
    if (!user || !fundAgreed) {
      toast({
        title: "Missing Information",
        description: "Please agree to the eWallet terms.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount < 1500) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit is $1,500.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const processingFee = amount * 0.0325;
      const tax = 0; // Calculate based on billing address
      const total = amount + processingFee + tax;

      // Record acknowledgment
      const messageHash = await crypto.subtle
        .digest("SHA-256", new TextEncoder().encode("no-refund-policy"))
        .then(hash => Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, "0"))
          .join(""));

      await supabase.from("wallet_acknowledgments").insert({
        attorney_id: user.id,
        ip_address: null,
        user_agent: navigator.userAgent,
        message_hash: messageHash,
      });

      // Create transaction
      await supabase.from("wallet_transactions").insert({
        attorney_id: user.id,
        transaction_type: "deposit",
        amount,
        processing_fee: processingFee,
        tax,
        total_amount: total,
        description: "eWallet deposit",
        status: "completed",
        payment_method: "Credit Card",
      });

      // Update wallet balance
      const { error: updateError } = await supabase
        .from("attorney_wallet")
        .update({ balance: walletBalance + amount })
        .eq("attorney_id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Funds Added",
        description: `$${amount.toLocaleString()} has been added to your eWallet.`,
      });

      setAddAmount("");
      setFundAgreed(false);
      loadWalletData();
      loadTransactions();
    } catch (error) {
      console.error("Error adding funds:", error);
      toast({
        title: "Error",
        description: "Failed to add funds. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0f2a6a]">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your plan, payments, and eWallet.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="plan">Plan Details</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="services">RN CM Services</TabsTrigger>
          <TabsTrigger value="ewallet">eWallet</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0f2a6a]">
                <Briefcase className="h-5 w-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tier</Label>
                  <p className="text-2xl font-bold text-[#b09837]">
                    {tierData?.tier || "Basic"}
                  </p>
                </div>
                <div>
                  <Label>Monthly Price</Label>
                  <p className="text-2xl font-bold">
                    ${tierData?.plan_price?.toLocaleString() || "0"}
                  </p>
                </div>
              </div>
              {tierData?.renewal_date && (
                <div>
                  <Label>Next Renewal</Label>
                  <p className="text-lg">
                    {new Date(tierData.renewal_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              <Button className="bg-[#b09837] text-black hover:bg-[#b09837]/90">
                Update / Change Plan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0f2a6a]">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Payment method management coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0f2a6a]">
                <FileText className="h-5 w-5" />
                Invoices & Receipts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Invoice history coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0f2a6a]">RN CM Special Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Additional Clinical Narrative Report</h3>
                    <p className="text-sm text-muted-foreground">Detailed case summary by RN CM</p>
                  </div>
                  <Button className="bg-[#b09837] text-black hover:bg-[#b09837]/90">
                    Request
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Provider Coordination Add-On</h3>
                    <p className="text-sm text-muted-foreground">Enhanced provider liaison services</p>
                  </div>
                  <Button className="bg-[#b09837] text-black hover:bg-[#b09837]/90">
                    Request
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ewallet" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#b09837]">
                <Wallet className="h-5 w-5" />
                eWallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Current Balance</Label>
                <p className="text-4xl font-bold">${walletBalance.toLocaleString()}</p>
                {walletBalance < 1500 && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <p>Low balance—add funds to accept referrals.</p>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 border-2 border-[#b09837] rounded-lg">
                <h3 className="font-semibold">Add Funds</h3>
                <div>
                  <Label htmlFor="amount">Amount (minimum $1,500)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1500"
                    step="100"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="1500"
                  />
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="fund-agree"
                    checked={fundAgreed}
                    onCheckedChange={(checked) => setFundAgreed(checked === true)}
                  />
                  <Label htmlFor="fund-agree" className="text-sm leading-relaxed cursor-pointer">
                    I understand eWallet funds are non-refundable and will be credited to my account only.
                  </Label>
                </div>

                <Button
                  onClick={handleAddFunds}
                  disabled={!fundAgreed || loading || parseFloat(addAmount) < 1500}
                  className="w-full bg-[#b09837] text-black hover:bg-[#b09837]/90"
                >
                  {loading ? "Processing..." : "Add Funds"}
                </Button>
              </div>

              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm">eWallet Refund / Credit Policy</h4>
                <p className="text-sm text-muted-foreground">
                  Funds added to your Reconcile C.A.R.E. eWallet are <strong>non-refundable</strong>. 
                  No cash refunds will be issued. If you request a return of funds, the remaining eWallet 
                  balance will be <strong>credited to your account</strong> to be applied against future 
                  platform fees or services.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Case ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Fees</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No transactions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell>{new Date(txn.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{txn.case_id ? `RC-${txn.case_id.slice(-8).toUpperCase()}` : "—"}</TableCell>
                        <TableCell>{txn.description}</TableCell>
                        <TableCell>${txn.amount.toLocaleString()}</TableCell>
                        <TableCell>${txn.processing_fee.toLocaleString()}</TableCell>
                        <TableCell>${txn.tax.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold">${txn.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            txn.status === "completed" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {txn.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
