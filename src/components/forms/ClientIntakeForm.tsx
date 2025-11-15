// src/components/forms/ClientIntakeForm.tsx

// NOTE: In the original version this file tried to import a real workflow:
//   import { onIntakeSubmit } from "../../lib/workflows";
// For now, we keep everything ON THIS PAGE and use a safe stub so the app
// can build and you can test layout/flow without touching any live systems.

// TEMP STUB: remove this once you have a real ../../lib/workflows implementation
async function onIntakeSubmit(payload: any) {
  console.log("onIntakeSubmit stub called with:", payload);
  // Mimic a small async wait
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { ok: true };
}

import React, { useState } from "react";

type FourPsScore = 1 | 2 | 3 | 4 | 5;

type FourPsForm = {
  physical: FourPsScore | null;
  psychological: FourPsScore | null;
  psychosocial: FourPsScore | null;
  professional: FourPsScore | null;
};

type GoalsForm = {
  shortTerm: string;
  mediumTerm: string;
  longTerm: string;
};

type SdohForm = {
  housingIssue: boolean;
  foodIssue: boolean;
  transportIssue: boolean;
  financesIssue: boolean;
  safetyConcern: boolean;
};

type ClientIntakeFormState = {
  fourPs: FourPsForm;
  goals: GoalsForm;
  sdoh: SdohForm;
};

const initialState: ClientIntakeFormState = {
  fourPs: {
    physical: null,
    psychological: null,
    psychosocial: null,
    professional: null,
  },
  goals: {
    shortTerm: "",
    mediumTerm: "",
    longTerm: "",
  },
  sdoh: {
    housingIssue: false,
    foodIssue: false,
    transportIssue: false,
    financesIssue: false,
    safetyConcern: false,
  },
};

const scoreOptions: FourPsScore[] = [1, 2, 3, 4, 5];

const scoreLabel = (value: FourPsScore) => {
  // You can tweak these labels later to exactly match your 4Ps language.
  switch (value) {
    case 1:
      return "Very hard right now";
    case 2:
      return "Hard";
    case 3:
      return "In the middle";
    case 4:
      return "Doing fairly well";
    case 5:
      return "Doing well / stable";
  }
};

interface ClientIntakeFormProps {
  // Optional: a callback that runs after the stub "saves"
  onSaved?: () => void;
}

const ClientIntakeForm: React.FC<ClientIntakeFormProps> = ({ onSaved }) => {
  const [form, setForm] = useState<ClientIntakeFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateFourP = (field: keyof FourPsForm, value: FourPsScore) => {
    setForm((prev) => ({
      ...prev,
      fourPs: {
        ...prev.fourPs,
        [field]: value,
      },
    }));
  };

  const updateGoal = (field: keyof GoalsForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      goals: {
        ...prev.goals,
        [field]: value,
      },
    }));
  };

  const updateSdoh = (field: keyof SdohForm, value: boolean) => {
    setForm((prev) => ({
      ...prev,
      sdoh: {
        ...prev.sdoh,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);
    setSubmitError(null);

    // Basic validation: require all 4Ps scores
    const { fourPs } = form;
    if (
      fourPs.physical === null ||
      fourPs.psychological === null ||
      fourPs.psychosocial === null ||
      fourPs.professional === null
    ) {
      setSubmitError(
        "Please answer all four 4Ps questions before continuing."
      );
      return;
    }

    setSubmitting(true);
    try {
      // When we wire this to real workflows, we’ll send form as the payload.
      const result = await onIntakeSubmit(form);
      if (result && (result as any).ok) {
        setSubmitMessage(
          "Your answers have been saved. Your RN Care Manager will use this information to tailor your plan."
        );
        if (onSaved) {
          onSaved();
        }
      } else {
        setSubmitError(
          "We could not save your answers right now. Please try again."
        );
      }
    } catch (err) {
      console.error("Error in onIntakeSubmit stub:", err);
      setSubmitError(
        "Something went wrong while saving your answers. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border bg-white p-4 shadow-sm text-sm"
    >
      {/* Intro */}
      <section className="space-y-1">
        <h2 className="text-base font-semibold">
          4Ps of Wellness &amp; Recovery Snapshot
        </h2>
        <p className="text-xs text-gray-600">
          These questions help your RN Care Manager understand how you&apos;re
          doing in four key areas. There are no right or wrong answers – this
          is about your real everyday experience.
        </p>
      </section>

      {/* 4Ps grid */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Physical */}
          <div className="rounded-lg border bg-gray-50/80 p-3 space-y-2">
            <h3 className="text-xs font-semibold">Physical</h3>
            <p className="text-[11px] text-gray-600">
              Thinking about your body, pain, and energy – how are you doing
              most days?
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {scoreOptions.map((value) => (
                <label
                  key={value}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] cursor-pointer ${
                    form.fourPs.physical === value
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="physical"
                    value={value}
                    checked={form.fourPs.physical === value}
                    onChange={() => updateFourP("physical", value)}
                    className="hidden"
                  />
                  <span className="font-semibold">{value}</span>
                  <span className="text-[10px]">{scoreLabel(value)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Psychological */}
          <div className="rounded-lg border bg-gray-50/80 p-3 space-y-2">
            <h3 className="text-xs font-semibold">Psychological</h3>
            <p className="text-[11px] text-gray-600">
              Thinking about your mood, anxiety, and mental health – how are
              you doing most days?
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {scoreOptions.map((value) => (
                <label
                  key={value}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] cursor-pointer ${
                    form.fourPs.psychological === value
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="psychological"
                    value={value}
                    checked={form.fourPs.psychological === value}
                    onChange={() => updateFourP("psychological", value)}
                    className="hidden"
                  />
                  <span className="font-semibold">{value}</span>
                  <span className="text-[10px]">{scoreLabel(value)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Psychosocial */}
          <div className="rounded-lg border bg-gray-50/80 p-3 space-y-2">
            <h3 className="text-xs font-semibold">Psychosocial</h3>
            <p className="text-[11px] text-gray-600">
              Thinking about your relationships, support system, and day-to-day
              responsibilities at home – how are you doing most days?
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {scoreOptions.map((value) => (
                <label
                  key={value}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] cursor-pointer ${
                    form.fourPs.psychosocial === value
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="psychosocial"
                    value={value}
                    checked={form.fourPs.psychosocial === value}
                    onChange={() => updateFourP("psychosocial", value)}
                    className="hidden"
                  />
                  <span className="font-semibold">{value}</span>
                  <span className="text-[10px]">{scoreLabel(value)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Professional */}
          <div className="rounded-lg border bg-gray-50/80 p-3 space-y-2">
            <h3 className="text-xs font-semibold">Professional / Work / School</h3>
            <p className="text-[11px] text-gray-600">
              Thinking about work, school, or your main role in the day – how
              manageable does it feel with your current symptoms?
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {scoreOptions.map((value) => (
                <label
                  key={value}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] cursor-pointer ${
                    form.fourPs.professional === value
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="professional"
                    value={value}
                    checked={form.fourPs.professional === value}
                    onChange={() => updateFourP("professional", value)}
                    className="hidden"
                  />
                  <span className="font-semibold">{value}</span>
                  <span className="text-[10px]">{scoreLabel(value)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-500">
          In your RN dashboard later, these scores will appear as a quick
          snapshot so your RN Care Manager can see where you&apos;re struggling
          and where you&apos;re more stable.
        </p>
      </section>

      {/* SDOH snapshot – light touch, no deep trauma content here */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold">
          Quick Check: Things That Can Affect Your Recovery
        </h2>
        <p className="text-[11px] text-gray-600">
          These brief questions help us understand if your environment is
          making it harder to follow your plan. You can skip any that do not
          apply.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={form.sdoh.housingIssue}
              onChange={(e) =>
                updateSdoh("housingIssue", e.target.checked)
              }
              className="mt-[2px]"
            />
            <span>
              I have concerns about my housing or where I&apos;m staying right
              now.
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={form.sdoh.foodIssue}
              onChange={(e) => updateSdoh("foodIssue", e.target.checked)}
              className="mt-[2px]"
            />
            <span>I sometimes struggle to get enough food.</span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={form.sdoh.transportIssue}
              onChange={(e) =>
                updateSdoh("transportIssue", e.target.checked)
              }
              className="mt-[2px]"
            />
            <span>Getting to appointments or therapy is hard because of transportation.</span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={form.sdoh.financesIssue}
              onChange={(e) =>
                updateSdoh("financesIssue", e.target.checked)
              }
              className="mt-[2px]"
            />
            <span>
              Money or bills are making it harder for me to focus on recovery.
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={form.sdoh.safetyConcern}
              onChange={(e) =>
                updateSdoh("safetyConcern", e.target.checked)
              }
              className="mt-[2px]"
            />
            <span>
              I have concerns about my safety or the safety of others where I
              live.
            </span>
          </label>
        </div>

        <p className="text-[11px] text-gray-500">
          Your RN Care Manager will not list these details in general
          attorney-facing summaries. They&apos;re used to make sure your plan
          is realistic and safe, and they stay in nursing-only notes.
        </p>
      </section>

      {/* Goals */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold">Your Goals</h2>
        <p className="text-[11px] text-gray-600">
          In your own words, what would you like to be able to do again? It&apos;s
          okay if this changes later – this just gives us a starting point.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
          <div className="space-y-1">
            <label className="font-semibold text-gray-700">
              Next 30 days
            </label>
            <textarea
              rows={3}
              value={form.goals.shortTerm}
              onChange={(e) =>
                updateGoal("shortTerm", e.target.value)
              }
              className="w-full border rounded-lg px-2 py-1 text-[11px]"
              placeholder="Example: Make it to all my PT visits and sleep more than 5 hours most nights."
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-gray-700">
              Next 60–90 days
            </label>
            <textarea
              rows={3}
              value={form.goals.mediumTerm}
              onChange={(e) =>
                updateGoal("mediumTerm", e.target.value)
              }
              className="w-full border rounded-lg px-2 py-1 text-[11px]"
              placeholder="Example: Walk 15–20 minutes without stopping."
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-gray-700">
              Longer-term (&gt; 90 days)
            </label>
            <textarea
              rows={3}
              value={form.goals.longTerm}
              onChange={(e) =>
                updateGoal("longTerm", e.target.value)
              }
              className="w-full border rounded-lg px-2 py-1 text-[11px]"
              placeholder="Example: Return to work, drive, or manage my usual routine."
            />
          </div>
        </div>
      </section>

      {/* Submit + messages */}
      <section className="space-y-2">
        {submitError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
            {submitError}
          </div>
        )}
        {submitMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
            {submitMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Saving your answers…" : "Save and continue"}
        </button>

        <p className="text-[10px] text-gray-500 mt-1">
          This is a prototype intake screen. In the full build, your answers
          will be securely stored and visible only to your RN Care Manager and,
          where appropriate, summarized for your attorney in a way that protects
          your privacy.
        </p>
      </section>
    </form>
  );
};

export default ClientIntakeForm;
