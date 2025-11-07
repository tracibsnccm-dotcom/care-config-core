import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppointmentReminderRequest {
  appointmentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { appointmentId }: AppointmentReminderRequest = await req.json();

    // Fetch appointment details
    const { data: appointment, error: apptError } = await supabaseClient
      .from("client_appointments")
      .select(`
        *,
        client:profiles!client_id(display_name, email),
        provider:providers(name, practice_name, phone)
      `)
      .eq("id", appointmentId)
      .single();

    if (apptError || !appointment) {
      throw new Error("Appointment not found");
    }

    const clientEmail = appointment.client?.email;
    const clientName = appointment.client?.display_name || "Client";
    const providerName = appointment.provider?.name || "Provider";
    const practiceName = appointment.provider?.practice_name;
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const appointmentTime = appointment.appointment_time || "TBD";

    if (!clientEmail) {
      throw new Error("Client email not found");
    }

    // Send reminder email
    const emailResponse = await resend.emails.send({
      from: "RCMS <onboarding@resend.dev>",
      to: [clientEmail],
      subject: `Reminder: Upcoming Appointment with ${providerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Appointment Reminder</h1>
          <p>Hi ${clientName},</p>
          <p>This is a reminder about your upcoming appointment:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Provider:</strong> ${providerName}</p>
            ${practiceName ? `<p style="margin: 5px 0;"><strong>Practice:</strong> ${practiceName}</p>` : ""}
            <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${appointmentTime}</p>
            ${appointment.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${appointment.location}</p>` : ""}
          </div>
          
          ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ""}
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you need to cancel or reschedule, please do so at least 24 hours in advance.
          </p>
          
          <p>Best regards,<br>RCMS Team</p>
        </div>
      `,
    });

    console.log("Reminder sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending reminder:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
