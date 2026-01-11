import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, FileText, CheckCircle2 } from 'lucide-react';
import { supabaseGet } from '@/lib/supabaseRest';
import { format } from 'date-fns';

interface ConsentData {
  id: string;
  session_id: string;
  service_agreement_signed_at: string | null;
  service_agreement_signature: string | null;
  legal_disclosure_signed_at: string | null;
  legal_disclosure_signature: string | null;
  legal_disclosure_attorney_name: string | null;
  obtain_records_signed_at: string | null;
  obtain_records_signature: string | null;
  obtain_records_injury_date: string | null;
  healthcare_coord_signed_at: string | null;
  healthcare_coord_signature: string | null;
  healthcare_coord_pcp: string | null;
  healthcare_coord_specialist: string | null;
  healthcare_coord_therapy: string | null;
  hipaa_acknowledged_at: string | null;
  hipaa_signature: string | null;
}

interface ConsentDocumentViewerProps {
  intakeId?: string;
  sessionId?: string;
  caseId?: string;
  showPrintButton?: boolean;
}

export function ConsentDocumentViewer({ 
  intakeId, 
  sessionId,
  caseId,
  showPrintButton = true 
}: ConsentDocumentViewerProps) {
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadConsent() {
      setLoading(true);
      setError(null);
      
      try {
        let query = 'select=*';
        
        if (intakeId) {
          query += `&client_intake_id=eq.${intakeId}`;
        } else if (sessionId) {
          query += `&session_id=eq.${sessionId}`;
        } else if (caseId) {
          // First get intake ID from case
          const { data: intakes } = await supabaseGet(
            'rc_client_intakes',
            `select=id&case_id=eq.${caseId}&limit=1`
          );
          const intake = Array.isArray(intakes) ? intakes[0] : intakes;
          if (intake?.id) {
            query += `&client_intake_id=eq.${intake.id}`;
          } else {
            setError('No intake found for this case');
            setLoading(false);
            return;
          }
        } else {
          setError('No intake or session ID provided');
          setLoading(false);
          return;
        }
        
        query += '&limit=1';
        
        const { data, error: fetchError } = await supabaseGet('rc_client_consents', query);
        
        if (fetchError) throw new Error(fetchError.message);
        
        const consentData = Array.isArray(data) ? data[0] : data;
        if (consentData) {
          setConsent(consentData);
        } else {
          setError('No consent records found');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load consents');
      } finally {
        setLoading(false);
      }
    }
    
    loadConsent();
  }, [intakeId, sessionId, caseId]);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Signed Consent Documents</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .consent-section { margin-bottom: 30px; padding: 20px; border: 1px solid #ccc; }
                .consent-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
                .signature-line { margin-top: 20px; padding-top: 10px; border-top: 1px solid #000; }
                .signature { font-family: 'Brush Script MT', cursive; font-size: 24px; }
                .timestamp { font-size: 12px; color: #666; }
                .badge { display: inline-block; padding: 2px 8px; background: #22c55e; color: white; border-radius: 4px; font-size: 12px; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>
              <h1>Signed Consent Documents</h1>
              <p>Reconcile C.A.R.E. - Client Authorization Records</p>
              <hr />
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not signed';
    return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
  };

  const ConsentSection = ({ 
    title, 
    signedAt, 
    signature, 
    children 
  }: { 
    title: string; 
    signedAt: string | null; 
    signature: string | null;
    children?: React.ReactNode;
  }) => (
    <div className="consent-section border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="consent-title text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {title}
        </h3>
        {signedAt && <Badge className="badge bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Signed</Badge>}
      </div>
      
      {children}
      
      {signature && (
        <div className="signature-line mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-1">Electronic Signature:</p>
          <p className="signature text-2xl font-serif italic">{signature}</p>
          <p className="timestamp text-xs text-muted-foreground mt-1">
            Signed: {formatDate(signedAt)}
          </p>
        </div>
      )}
      
      {!signature && (
        <p className="text-amber-600 text-sm mt-2">Not yet signed</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading consent documents...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!consent) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No consent documents found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Signed Consent Documents
        </CardTitle>
        {showPrintButton && (
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div ref={printRef}>
          <ConsentSection
            title="1. Service Agreement"
            signedAt={consent.service_agreement_signed_at}
            signature={consent.service_agreement_signature}
          >
            <p className="text-sm text-muted-foreground">
              Agreement to receive care management services from Reconcile C.A.R.E.
            </p>
          </ConsentSection>

          <ConsentSection
            title="2. Authorization for Legal Disclosure"
            signedAt={consent.legal_disclosure_signed_at}
            signature={consent.legal_disclosure_signature}
          >
            <p className="text-sm text-muted-foreground">
              Authorization to share Protected Health Information with legal representatives.
            </p>
            {consent.legal_disclosure_attorney_name && (
              <p className="text-sm mt-2">
                <strong>Attorney:</strong> {consent.legal_disclosure_attorney_name}
              </p>
            )}
          </ConsentSection>

          <ConsentSection
            title="3. Authorization to Obtain Records"
            signedAt={consent.obtain_records_signed_at}
            signature={consent.obtain_records_signature}
          >
            <p className="text-sm text-muted-foreground">
              Authorization to request and obtain medical records from healthcare providers.
            </p>
            {consent.obtain_records_injury_date && (
              <p className="text-sm mt-2">
                <strong>Injury Date:</strong> {consent.obtain_records_injury_date}
              </p>
            )}
          </ConsentSection>

          <ConsentSection
            title="4. Authorization for Healthcare Coordination"
            signedAt={consent.healthcare_coord_signed_at}
            signature={consent.healthcare_coord_signature}
          >
            <p className="text-sm text-muted-foreground">
              Authorization to coordinate care with healthcare providers.
            </p>
            {(consent.healthcare_coord_pcp || consent.healthcare_coord_specialist || consent.healthcare_coord_therapy) && (
              <div className="text-sm mt-2 space-y-1">
                {consent.healthcare_coord_pcp && <p><strong>PCP:</strong> {consent.healthcare_coord_pcp}</p>}
                {consent.healthcare_coord_specialist && <p><strong>Specialist:</strong> {consent.healthcare_coord_specialist}</p>}
                {consent.healthcare_coord_therapy && <p><strong>Therapy:</strong> {consent.healthcare_coord_therapy}</p>}
              </div>
            )}
          </ConsentSection>

          <ConsentSection
            title="5. HIPAA Privacy Notice"
            signedAt={consent.hipaa_acknowledged_at}
            signature={consent.hipaa_signature}
          >
            <p className="text-sm text-muted-foreground">
              Acknowledgment of HIPAA Privacy Practices and rights regarding Protected Health Information.
            </p>
          </ConsentSection>
        </div>
      </CardContent>
    </Card>
  );
}
