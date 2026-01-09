import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LogOut } from "lucide-react";

// Public fetch functions for unauthenticated requests (no auth token needed)
async function publicSupabaseGet(table: string, query: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    return { data: null, error: new Error(`${response.status}`) };
  }
  
  const data = await response.json();
  return { data, error: null };
}

interface CaseData {
  id: string;
  case_number: string | null;
  case_status: string | null;
  case_type: string | null;
  date_of_injury: string | null;
  jurisdiction: string | null;
  created_at: string;
}

export default function ClientPortalSimple() {
  const navigate = useNavigate();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read case_id from sessionStorage (set by ClientLogin)
    const storedCaseId = sessionStorage.getItem('client_case_id');
    const storedCaseNumber = sessionStorage.getItem('client_case_number');

    if (!storedCaseId) {
      // No case ID - redirect to login
      navigate('/client-login', { replace: true });
      return;
    }

    setCaseId(storedCaseId);
    setCaseNumber(storedCaseNumber);

    // Load case data
    loadCaseData(storedCaseId);
  }, [navigate]);

  async function loadCaseData(caseId: string) {
    try {
      setLoading(true);
      const { data, error: fetchError } = await publicSupabaseGet(
        'rc_cases',
        `select=id,case_number,case_status,case_type,date_of_injury,jurisdiction,created_at&id=eq.${caseId}&limit=1`
      );

      if (fetchError) {
        throw new Error(`Failed to load case data: ${fetchError.message}`);
      }

      const caseRecord = Array.isArray(data) ? data[0] : data;
      if (!caseRecord) {
        throw new Error('Case not found');
      }

      setCaseData(caseRecord as CaseData);
    } catch (err: any) {
      console.error('Failed to load case data:', err);
      setError(err.message || 'Failed to load case information');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('client_case_id');
    sessionStorage.removeItem('client_case_number');
    navigate('/client-login', { replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your case information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={handleLogout} className="mt-4 w-full" variant="outline">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Client Portal</h1>
            <p className="text-muted-foreground mt-1">Welcome to your case management portal</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Case Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Case Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {caseNumber && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Case Number</label>
                <p className="text-lg font-mono font-bold text-primary">{caseNumber}</p>
              </div>
            )}
            
            {caseData && (
              <>
                {caseData.case_status && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-lg">{caseData.case_status}</p>
                  </div>
                )}
                
                {caseData.case_type && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Case Type</label>
                    <p className="text-lg">{caseData.case_type}</p>
                  </div>
                )}
                
                {caseData.date_of_injury && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Injury</label>
                    <p className="text-lg">{new Date(caseData.date_of_injury).toLocaleDateString()}</p>
                  </div>
                )}
                
                {caseData.jurisdiction && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Jurisdiction</label>
                    <p className="text-lg">{caseData.jurisdiction}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Wellness Check-ins Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Wellness Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Wellness check-in features will be available here soon. 
              You'll be able to track your progress and communicate with your care team.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
