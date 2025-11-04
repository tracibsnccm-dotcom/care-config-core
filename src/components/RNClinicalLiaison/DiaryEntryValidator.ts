import { z } from "zod";

// Email regex for validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone regex (formats: 123-456-7890, (123) 456-7890, 123.456.7890, 1234567890)
const phoneRegex = /^[\d\s().-]+$/;

export const diaryEntrySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().trim().max(1000, "Description must be less than 1000 characters").optional(),
  entry_type: z.string().min(1, "Entry type is required"),
  scheduled_date: z.string().min(1, "Scheduled date is required"),
  scheduled_time: z.string().optional(),
  location: z.string().trim().max(500, "Location must be less than 500 characters").optional(),
  contact_name: z.string().trim().max(100, "Contact name must be less than 100 characters").optional(),
  contact_phone: z.string().trim().optional(),
  contact_email: z.string().trim().optional(),
  requires_contact: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  reminder_enabled: z.boolean().default(false),
  reminder_minutes_before: z.number().min(0).max(10080).optional(), // Max 1 week
  shared_with_supervisor: z.boolean().default(true),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional(),
  recurrence_end_date: z.string().optional(),
  template_name: z.string().trim().max(100).optional()
}).superRefine((data, ctx) => {
  // Validate phone/text/fax entries require valid phone number
  if (data.entry_type && ["phone_call", "text_message", "client_followup", "fax"].includes(data.entry_type)) {
    if (data.requires_contact) {
      if (!data.contact_phone || data.contact_phone.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phone number is required for phone/text/fax entries",
          path: ["contact_phone"]
        });
      } else if (!phoneRegex.test(data.contact_phone.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid phone number format",
          path: ["contact_phone"]
        });
      }
    }
  }

  // Validate email entries require valid email address
  if (data.entry_type === "email" && data.requires_contact) {
    if (!data.contact_email || data.contact_email.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email address is required for email entries",
        path: ["contact_email"]
      });
    } else if (!emailRegex.test(data.contact_email.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid email address format",
        path: ["contact_email"]
      });
    }
  }

  // Validate recurring entries have pattern set
  if (data.is_recurring && !data.recurrence_pattern) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Recurrence pattern is required for recurring entries",
      path: ["recurrence_pattern"]
    });
  }

  // Validate recurrence end date is after start date
  if (data.is_recurring && data.recurrence_end_date && data.scheduled_date) {
    if (new Date(data.recurrence_end_date) <= new Date(data.scheduled_date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurrence end date must be after scheduled date",
        path: ["recurrence_end_date"]
      });
    }
  }
});

export type DiaryEntryFormData = z.infer<typeof diaryEntrySchema>;

export function validateDiaryEntry(data: any): { success: boolean; errors?: Record<string, string>; data?: DiaryEntryFormData } {
  try {
    const validated = diaryEntrySchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _global: "Validation failed" } };
  }
}
