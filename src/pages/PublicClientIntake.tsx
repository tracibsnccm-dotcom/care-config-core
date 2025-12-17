// src/pages/PublicClientIntake.tsx
import React, { useState } from "react";

const PublicClientIntake: React.FC = () => {
  const [attorneyCode, setAttorneyCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitted(false);

    try {
      // 🔹 For now, just log. Next step we’ll hook this to your Supabase intake RPC.
      console.log("Intake submit", {
        attorneyCode,
        firstName,
        lastName,
        phone,
        email,
      });

      setSubmitted(true);
    } catch (error) {
      console.error("Intake submit failed", error);
      alert("Something went wrong submitting your information.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-3 py-6">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-md p-6">
        <h1 className="text-xl font-semibold mb-1">
          Reconcile C.A.R.E. Client Intake
        </h1>
        <p className="text-[12px] text-slate-700 mb-4">
          Please complete this secure form to help your attorney&apos;s nurse
          care management team understand your situation. This form is{" "}
          <strong>confidential</strong> and used only for your case.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Attorney Code */}
          <div>
            <label className="block text-[11px] font-semibold mb-1">
              Attorney Code
            </label>
            <input
              type="text"
              value={attorneyCode}
              onChange={(e) => setAttorneyCode(e.target.value.toUpperCase())}
              required
              className="w-full border rounded-md px-2 py-1 text-[12px]"
              placeholder="Enter the code provided by your attorney"
            />
          </div>

          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full border rounded-md px-2 py-1 text-[12px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full border rounded-md px-2 py-1 text-[12px]"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full border rounded-md px-2 py-1 text-[12px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border rounded-md px-2 py-1 text-[12px]"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full bg-slate-900 text-white text-[12px] font-semibold py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Intake"}
          </button>

          {submitted && !submitting && (
            <p className="mt-2 text-[11px] text-emerald-700">
              Thank you. Your information has been received. A nurse care
              manager may contact you if additional details are needed.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default PublicClientIntake;
