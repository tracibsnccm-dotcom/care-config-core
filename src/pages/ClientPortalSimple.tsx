import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  LogOut, 
  Activity, 
  BookOpen, 
  Pill, 
  Stethoscope, 
  Calendar, 
  MessageSquare, 
  User,
  FileText,
  Home
} from "lucide-react";

// Import C.A.S.E. components
import { ClientJournal } from "@/components/ClientJournal";
import { ClientMedicationTracker } from "@/components/ClientMedicationTracker";
import { ClientTreatmentTracker } from "@/components/ClientTreatmentTracker";
import { ConsentDocumentViewer } from "@/components/ConsentDocumentViewer";

interface CaseData {
  id: string;
  case_number: string | null;
  case_status: string | null;
  case_type: string | null;
  date_of_injury: string | null;
  created_at: string;
}

// Public fetch for case data
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

export default function ClientPortalSimple() {
  const navigate = useNavigate();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const storedCaseId = sessionStorage.getItem('client_case_id');
    const storedCaseNumber = sessionStorage.getItem('client_case_number');
    const storedClientName = sessionStorage.getItem('client_name');

    if (!storedCaseId) {
      navigate('/client-login', { replace: true });
      return;
    }

    setCaseId(storedCaseId);
    setCaseNumber(storedCaseNumber);
    setClientName(storedClientName);
    loadCaseData(storedCaseId);
  }, [navigate]);

  async function loadCaseData(caseId: string) {
    try {
      setLoading(true);
      const { data, error: fetchError } = await publicSupabaseGet(
        'rc_cases',
        `select=id,case_number,case_status,case_type,date_of_injury,created_at&id=eq.${caseId}&limit=1`
      );

      if (fetchError) throw new Error(fetchError.message);
      
      const caseRecord = Array.isArray(data) ? data[0] : data;
      if (!caseRecord) throw new Error('Case not found');
      
      setCaseData(caseRecord as CaseData);
    } catch (err: any) {
      setError(err.message || 'Failed to load case information');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('client_case_id');
    sessionStorage.removeItem('client_case_number');
    sessionStorage.removeItem('client_name');
    navigate('/client-login', { replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p>Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={() => navigate('/client-login')} className="mt-4">
            Return to Login
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-amber-500">C.A.S.E. Portal</h1>
            <p className="text-slate-400 text-sm">
              Welcome{clientName ? `, ${clientName}` : ''} • Case: {caseNumber || 'N/A'}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="text-slate-300 border-slate-600">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-800 border border-slate-700 p-1 flex flex-wrap gap-1">
            <TabsTrigger value="home" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Home className="w-4 h-4 mr-2" />
              Home
            </TabsTrigger>
            <TabsTrigger value="wellness" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" />
              Wellness
            </TabsTrigger>
            <TabsTrigger value="journal" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              Journal
            </TabsTrigger>
            <TabsTrigger value="medications" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Pill className="w-4 h-4 mr-2" />
              Medications
            </TabsTrigger>
            <TabsTrigger value="treatments" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Stethoscope className="w-4 h-4 mr-2" />
              Treatments
            </TabsTrigger>
            <TabsTrigger value="appointments" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Home Tab */}
          <TabsContent value="home" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Case Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-slate-300">
                <div>
                  <p className="text-slate-400 text-sm">Case Number</p>
                  <p className="text-amber-500 font-mono">{caseData?.case_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  <p className="capitalize">{caseData?.case_status?.replace(/_/g, ' ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Case Type</p>
                  <p>{caseData?.case_type || 'N/A'}</p>
                </div>
                {caseData?.date_of_injury && (
                  <div>
                    <p className="text-slate-400 text-sm">Date of Injury</p>
                    <p>{new Date(caseData.date_of_injury).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center border-slate-600 text-slate-300 hover:bg-amber-600 hover:text-white hover:border-amber-600"
                  onClick={() => setActiveTab("wellness")}
                >
                  <Activity className="w-6 h-6 mb-1" />
                  <span className="text-xs">Check-in</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center border-slate-600 text-slate-300 hover:bg-amber-600 hover:text-white hover:border-amber-600"
                  onClick={() => setActiveTab("journal")}
                >
                  <BookOpen className="w-6 h-6 mb-1" />
                  <span className="text-xs">Journal</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center border-slate-600 text-slate-300 hover:bg-amber-600 hover:text-white hover:border-amber-600"
                  onClick={() => setActiveTab("appointments")}
                >
                  <Calendar className="w-6 h-6 mb-1" />
                  <span className="text-xs">Appointments</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center border-slate-600 text-slate-300 hover:bg-amber-600 hover:text-white hover:border-amber-600"
                  onClick={() => setActiveTab("messages")}
                >
                  <MessageSquare className="w-6 h-6 mb-1" />
                  <span className="text-xs">Messages</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wellness Tab */}
          <TabsContent value="wellness">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-500" />
                  Wellness Check-ins
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                <p className="mb-4">Track your daily wellness using the 4Ps framework:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-700 p-4 rounded-lg text-center">
                    <p className="text-amber-500 font-bold text-lg">P1</p>
                    <p className="text-sm">Physical</p>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg text-center">
                    <p className="text-amber-500 font-bold text-lg">P2</p>
                    <p className="text-sm">Psychological</p>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg text-center">
                    <p className="text-amber-500 font-bold text-lg">P3</p>
                    <p className="text-sm">Psychosocial</p>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg text-center">
                    <p className="text-amber-500 font-bold text-lg">P4</p>
                    <p className="text-sm">Purpose</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm">Wellness check-in form coming soon. You'll be able to rate how you're feeling and track your progress over time.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Journal Tab */}
          <TabsContent value="journal">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  My Journal
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                <p className="text-slate-400">Journal feature coming soon. You'll be able to write private entries about your recovery journey.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Pill className="w-5 h-5 text-amber-500" />
                  Medication Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                <p className="text-slate-400">Medication tracker coming soon. You'll be able to log your medications and track when you take them.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treatments Tab */}
          <TabsContent value="treatments">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-amber-500" />
                  Treatment Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                <p className="text-slate-400">Treatment tracker coming soon. You'll be able to log your treatments and therapy sessions.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  Appointments
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                <p className="text-slate-400">Appointment calendar coming soon. You'll be able to view upcoming appointments and confirm your attendance.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-500" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                <p className="text-slate-400">Secure messaging coming soon. You'll be able to communicate with your care team.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  My Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {caseId && <ConsentDocumentViewer caseId={caseId} showPrintButton={true} />}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-500" />
                  My Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                <div className="space-y-3">
                  <div>
                    <p className="text-slate-400 text-sm">Name</p>
                    <p>{clientName || 'Not available'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Case Number</p>
                    <p className="font-mono text-amber-500">{caseNumber || 'N/A'}</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mt-6">Profile editing coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
