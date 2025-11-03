import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { AlertTriangle, Phone, Clock } from "lucide-react";
import { RCMS } from "@/constants/brand";
import { format, formatDistanceToNow } from "date-fns";
import { AddressAlertModal } from "./AddressAlertModal";

interface EmergencyAlert {
  id: string;
  case_id: string;
  client_id: string;
  alert_type: string;
  severity: string;
  alert_details: any;
  shift_start_time: string;
  sla_deadline: string;
  addressed_at: string | null;
  created_at: string;
}

export function EmergencyAlertsCard() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchAlerts();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('emergency-alerts')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rn_emergency_alerts',
          },
          () => {
            fetchAlerts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('rn_emergency_alerts')
        .select('*')
        .is('addressed_at', null)
        .eq('rn_id', user?.id)
        .order('sla_deadline', { ascending: true });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching emergency alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (slaDeadline: string) => {
    return new Date(slaDeadline) < new Date();
  };

  const isCritical = (alertType: string) => {
    return ['suicidal_ideation', 'homicidal_ideation', '911_trigger', '988_trigger'].includes(alertType);
  };

  const getAlertPriority = (alert: EmergencyAlert) => {
    if (isCritical(alert.alert_type)) return 1;
    if (isOverdue(alert.sla_deadline)) return 2;
    return 3;
  };

  const sortedAlerts = [...alerts].sort((a, b) => getAlertPriority(a) - getAlertPriority(b));

  const handleAddressAlert = (alert: EmergencyAlert) => {
    setSelectedAlert(alert);
    setShowAddressModal(true);
  };

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5" style={{ color: RCMS.brandRed }} />
            Emergency Alerts ({alerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No active emergency alerts</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {sortedAlerts.map((alert) => {
                const critical = isCritical(alert.alert_type);
                const overdue = isOverdue(alert.sla_deadline);
                const shouldBlink = !alert.addressed_at;

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-2 ${
                      shouldBlink ? (critical ? 'animate-pulse-red' : 'animate-pulse-orange') : ''
                    }`}
                    style={{
                      borderColor: critical ? RCMS.brandRed : overdue ? '#f39c12' : RCMS.brandTeal,
                      backgroundColor: critical ? `${RCMS.brandRed}10` : overdue ? '#f39c1210' : `${RCMS.brandTeal}10`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {critical && (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                              CRITICAL - 1 HR
                            </span>
                          )}
                          {!critical && overdue && (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-500 text-white">
                              OVERDUE
                            </span>
                          )}
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: RCMS.brandNavy }}>
                            {alert.alert_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-2">{alert.alert_details?.message || 'Emergency alert requires attention'}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due: {format(new Date(alert.sla_deadline), 'h:mm a')}
                          </span>
                          <span>
                            {overdue ? 'Overdue by ' : ''}
                            {formatDistanceToNow(new Date(alert.sla_deadline), { addSuffix: !overdue })}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddressAlert(alert)}
                        className="flex items-center gap-2 whitespace-nowrap"
                        style={{ backgroundColor: RCMS.brandTeal }}
                      >
                        <Phone className="w-4 h-4" />
                        Address
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAlert && (
        <AddressAlertModal
          alert={selectedAlert}
          open={showAddressModal}
          onClose={() => {
            setShowAddressModal(false);
            setSelectedAlert(null);
          }}
          onSuccess={() => {
            fetchAlerts();
            setShowAddressModal(false);
            setSelectedAlert(null);
          }}
        />
      )}

      <style>{`
        @keyframes pulse-red {
          0%, 100% {
            border-color: ${RCMS.brandRed};
            box-shadow: 0 0 0 0 ${RCMS.brandRed}40;
          }
          50% {
            border-color: ${RCMS.brandRed};
            box-shadow: 0 0 20px 5px ${RCMS.brandRed}60;
          }
        }

        @keyframes pulse-orange {
          0%, 100% {
            border-color: #f39c12;
            box-shadow: 0 0 0 0 #f39c1240;
          }
          50% {
            border-color: #f39c12;
            box-shadow: 0 0 20px 5px #f39c1260;
          }
        }

        .animate-pulse-red {
          animation: pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-pulse-orange {
          animation: pulse-orange 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </>
  );
}
