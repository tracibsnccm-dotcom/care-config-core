import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Users, Edit, Award } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AttorneyMetadata {
  id: string;
  user_id: string;
  status: string;
  capacity_limit: number;
  capacity_available: number;
  last_assigned_date: string | null;
  profiles: {
    display_name: string;
    email: string;
  };
}

export function AttorneyRoster() {
  const [attorneys, setAttorneys] = useState<AttorneyMetadata[]>([]);
  const [nextEligible, setNextEligible] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingAttorney, setEditingAttorney] = useState<AttorneyMetadata | null>(null);

  useEffect(() => {
    loadAttorneys();
    loadNextEligible();
  }, []);

  async function loadAttorneys() {
    try {
      const { data, error } = await supabase
        .from("attorney_metadata")
        .select(`
          *,
          profiles!attorney_metadata_user_id_fkey (
            display_name,
            email
          )
        `)
        .order("last_assigned_date", { ascending: true, nullsFirst: true });

      if (error) throw error;
      setAttorneys(data || []);
    } catch (error) {
      console.error("Error loading attorneys:", error);
      toast.error("Failed to load attorney roster");
    } finally {
      setLoading(false);
    }
  }

  async function loadNextEligible() {
    try {
      const { data, error } = await supabase.rpc("get_next_round_robin_attorney");
      if (error) throw error;
      setNextEligible(data);
    } catch (error) {
      console.error("Error loading next eligible attorney:", error);
    }
  }

  async function updateAttorney(attorney: AttorneyMetadata) {
    try {
      const { error } = await supabase
        .from("attorney_metadata")
        .update({
          status: attorney.status,
          capacity_limit: attorney.capacity_limit,
          capacity_available: attorney.capacity_available,
        })
        .eq("id", attorney.id);

      if (error) throw error;
      toast.success("Attorney updated");
      loadAttorneys();
      loadNextEligible();
      setEditingAttorney(null);
    } catch (error) {
      console.error("Error updating attorney:", error);
      toast.error("Failed to update attorney");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--rcms-teal))]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[hsl(var(--rcms-teal))]" />
          Attorney Roster
        </CardTitle>
        <CardDescription>
          Manage attorney capacity and round robin assignment order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attorney</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Last Assigned</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attorneys.map((attorney) => {
              const isNext = attorney.user_id === nextEligible;
              return (
                <TableRow
                  key={attorney.id}
                  className={isNext ? "border-2 border-[hsl(var(--rcms-gold))]" : ""}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{attorney.profiles.display_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {attorney.profiles.email}
                        </div>
                      </div>
                      {isNext && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Award className="h-4 w-4 text-[hsl(var(--rcms-gold))]" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Next eligible for auto-assignment</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={attorney.status === "Active" ? "default" : "secondary"}>
                      {attorney.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={attorney.capacity_available === 0 ? "text-destructive" : ""}>
                      {attorney.capacity_available} / {attorney.capacity_limit}
                    </span>
                  </TableCell>
                  <TableCell>
                    {attorney.last_assigned_date
                      ? format(new Date(attorney.last_assigned_date), "MMM d, yyyy h:mm a")
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <Dialog open={editingAttorney?.id === attorney.id} onOpenChange={(open) => !open && setEditingAttorney(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingAttorney(attorney)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Attorney</DialogTitle>
                          <DialogDescription>
                            Update capacity and status for {attorney.profiles.display_name}
                          </DialogDescription>
                        </DialogHeader>
                        {editingAttorney && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Status</Label>
                              <Select
                                value={editingAttorney.status}
                                onValueChange={(value) =>
                                  setEditingAttorney({ ...editingAttorney, status: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Active">Active</SelectItem>
                                  <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Capacity Limit</Label>
                              <Input
                                type="number"
                                min="0"
                                value={editingAttorney.capacity_limit}
                                onChange={(e) =>
                                  setEditingAttorney({
                                    ...editingAttorney,
                                    capacity_limit: parseInt(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Capacity Available</Label>
                              <Input
                                type="number"
                                min="0"
                                max={editingAttorney.capacity_limit}
                                value={editingAttorney.capacity_available}
                                onChange={(e) =>
                                  setEditingAttorney({
                                    ...editingAttorney,
                                    capacity_available: parseInt(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                            <Button onClick={() => updateAttorney(editingAttorney)}>
                              Save Changes
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
