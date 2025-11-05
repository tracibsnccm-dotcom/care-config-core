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
import { ClinicalAudit } from "@/hooks/useClinicalAudits";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const auditSchema = z.object({
  audit_name: z.string().min(3, "Audit name must be at least 3 characters"),
  audit_type: z.string().min(1, "Audit type is required"),
  status: z.string().min(1, "Status is required"),
  scheduled_date: z.string().min(1, "Scheduled date is required"),
  cases_reviewed: z.number().min(0, "Must be at least 0"),
  priority: z.string().min(1, "Priority is required"),
  findings: z.string().optional().nullable(),
  recommendations: z.string().optional().nullable(),
});

type AuditFormData = z.infer<typeof auditSchema>;

interface AuditFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audit?: ClinicalAudit | null;
  onSubmit: (data: Partial<ClinicalAudit>) => void;
  isSubmitting: boolean;
}

export function AuditFormDialog({
  open,
  onOpenChange,
  audit,
  onSubmit,
  isSubmitting,
}: AuditFormDialogProps) {
  const form = useForm<AuditFormData>({
    resolver: zodResolver(auditSchema),
    defaultValues: {
      audit_name: audit?.audit_name || "",
      audit_type: audit?.audit_type || "",
      status: audit?.status || "scheduled",
      scheduled_date: audit?.scheduled_date || format(new Date(), "yyyy-MM-dd"),
      cases_reviewed: audit?.cases_reviewed || 0,
      priority: audit?.priority || "medium",
      findings: audit?.findings || "",
      recommendations: audit?.recommendations || "",
    },
  });

  const handleSubmit = (data: AuditFormData) => {
    const submitData: Partial<ClinicalAudit> = {
      ...data,
      follow_up_required: false,
    };

    if (audit?.id) {
      submitData.id = audit.id;
    }

    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {audit ? "Edit Clinical Audit" : "Schedule Clinical Audit"}
          </DialogTitle>
          <DialogDescription>
            {audit ? "Update the audit details" : "Schedule a new clinical audit"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="audit_name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Audit Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Q1 Documentation Review" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="audit_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audit Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="documentation">Documentation</SelectItem>
                        <SelectItem value="clinical_quality">Clinical Quality</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="safety">Safety</SelectItem>
                        <SelectItem value="process">Process</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
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
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cases_reviewed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cases Reviewed</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="findings"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Findings</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Document audit findings..."
                        className="min-h-20"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recommendations"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Recommendations</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List recommendations for improvement..."
                        className="min-h-20"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {audit ? "Update Audit" : "Schedule Audit"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
