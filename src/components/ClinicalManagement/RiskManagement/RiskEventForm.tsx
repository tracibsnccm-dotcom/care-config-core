import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RiskEvent } from "@/hooks/useRiskEvents";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const riskSchema = z.object({
  event_type: z.string().min(1, "Event type is required"),
  severity: z.string().min(1, "Severity is required"),
  status: z.string().min(1, "Status is required"),
  reported_date: z.string().min(1, "Date is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  immediate_action: z.string().optional().nullable(),
  corrective_actions: z.string().optional().nullable(),
});

type RiskFormData = z.infer<typeof riskSchema>;

interface RiskEventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk?: RiskEvent | null;
  onSubmit: (data: Partial<RiskEvent>) => void;
  isSubmitting: boolean;
}

export function RiskEventForm({
  open,
  onOpenChange,
  risk,
  onSubmit,
  isSubmitting,
}: RiskEventFormProps) {
  const form = useForm<RiskFormData>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      event_type: risk?.event_type || "",
      severity: risk?.severity || "medium",
      status: risk?.status || "open",
      reported_date: risk?.reported_date || format(new Date(), "yyyy-MM-dd"),
      description: risk?.description || "",
      immediate_action: risk?.immediate_action || "",
      corrective_actions: risk?.corrective_actions || "",
    },
  });

  const handleSubmit = (data: RiskFormData) => {
    const submitData: Partial<RiskEvent> = data;
    if (risk?.id) {
      submitData.id = risk.id;
    }
    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{risk ? "Edit Risk Event" : "Report Risk Event"}</DialogTitle>
          <DialogDescription>
            {risk ? "Update risk event details" : "Document a new risk event or safety concern"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="event_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="patient_safety">Patient Safety</SelectItem>
                        <SelectItem value="clinical">Clinical</SelectItem>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="mitigating">Mitigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reported_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reported Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detailed description..." className="min-h-24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="immediate_action"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Immediate Action</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Actions taken immediately..." className="min-h-20" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="corrective_actions"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Corrective Actions</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Corrective measures..." className="min-h-20" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {risk ? "Update Risk" : "Report Risk"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
