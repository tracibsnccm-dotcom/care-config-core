// src/rn/RNFollowUpForm.tsx
// RN Follow-Up form for non-crisis case work.
// Correct 4Ps: Physical · Psychological · Psychosocial · Professional
// 10-Vs snapshot for Dec 31 demos (no backend wiring yet).

import React from "react";

const RNFollowUpForm: React.FC = () => {
  return (
    <div className="border rounded-xl bg-white p-3 space-y-3 text-[11px] text-slate-800">
      {/* Header */}
      <header className="border-b pb-2 mb-2">
        <h2 className="text-[12px] font-semibold uppercase tracking-wide">
          RN Follow-Up – Case Workbench
        </h2>
        <p className="text-[10px] text-slate-500">
          Use this space to document routine (non-crisis) contact using your
          4Ps and 10-Vs lenses. This version is for demo/testing only and does
          not save to the live database yet.
        </p>
      </header>

      {/* Contact Snapshot */}
      <section className="space-y-1">
        <div className="text-[10px] font-semibold uppercase text-slate-600">
          Contact Snapshot
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">Contact Type</span>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white">
              <option>Phone – Outbound</option>
              <option>Phone – Inbound</option>
              <option>Video Visit</option>
              <option>Portal Message</option>
              <option>In-Person</option>
              <option>Other</option>
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">Contact Focus</span>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white">
              <option>Routine Follow-Up</option>
              <option>New Symptom</option>
              <option>Medication Issue</option>
              <option>Return to Work / Function</option>
              <option>Provider Coordination</option>
              <option>Benefits / Financial</option>
            </select>
          </label>
        </div>
      </section>

      {/* 4Ps Snapshot */}
      <section className="space-y-2 border rounded-md p-2 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase text-slate-600">
            4Ps Snapshot
          </div>
          <div className="text-[9px] text-slate-500">
            Physical · Psychological · Psychosocial · Professional
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Physical */}
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-slate-700">
              Physical
            </div>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white w-full">
              <option>Stable / Baseline</option>
              <option>Improved</option>
              <option>Worsened</option>
              <option>New Physical Concern</option>
            </select>
            <textarea
              className="border rounded px-1 py-0.5 text-[10px] w-full"
              rows={2}
              placeholder="Mobility, endurance, sleep, ADLs, wound status, pain pattern, etc."
            />
          </div>

          {/* Psychological */}
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-slate-700">
              Psychological
            </div>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white w-full">
              <option>Calm / Coping</option>
              <option>Anxious</option>
              <option>Depressed</option>
              <option>Irritable</option>
              <option>New Behavior Change</option>
            </select>
            <textarea
              className="border rounded px-1 py-0.5 text-[10px] w-full"
              rows={2}
              placeholder="Mood, coping, red flags, engagement with care, adherence..."
            />
          </div>

          {/* Psychosocial */}
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-slate-700">
              Psychosocial
            </div>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white w-full">
              <option>Support Adequate</option>
              <option>Caregiver Strain</option>
              <option>Family Conflict</option>
              <option>Social Isolation</option>
              <option>Community / Faith / Peer Supports</option>
            </select>
            <textarea
              className="border rounded px-1 py-0.5 text-[10px] w-full"
              rows={2}
              placeholder="Family dynamics, caregiver capacity, social supports, community ties..."
            />
          </div>

          {/* Professional */}
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-slate-700">
              Professional
            </div>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white w-full">
              <option>Work Status Stable</option>
              <option>Off Work / Restricted</option>
              <option>RTW Plan in Progress</option>
              <option>Vocational Concern</option>
              <option>Employer / HR Issue</option>
            </select>
            <textarea
              className="border rounded px-1 py-0.5 text-[10px] w-full"
              rows={2}
              placeholder="Work status, restrictions, RTW planning, vocation, employer/HR issues..."
            />
          </div>
        </div>
      </section>

      {/* 10-Vs High-Level Note */}
      <section className="space-y-1 border rounded-md p-2 bg-white">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase text-slate-600">
            10-Vs Checkpoint (High-Level)
          </div>
        </div>

        <textarea
          className="border rounded px-1 py-0.5 text-[10px] w-full"
          rows={3}
          placeholder="RN quick note using the 10-Vs lens (e.g., Vitals, Voice, Value, Visibility, Variability, Velocity of change, etc.). This is a demo field only and does not yet save to the database."
        />
      </section>

      {/* RN Plan / Tasks */}
      <section className="space-y-2 border rounded-md p-2 bg-white">
        <div className="text-[10px] font-semibold uppercase text-slate-600">
          RN Actions & Next Steps
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">
              Planned RN Actions
            </span>
            <textarea
              className="border rounded px-1 py-0.5 text-[10px] w-full"
              rows={3}
              placeholder="Example: Call ortho office to confirm follow-up; message attorney with functional update; request updated PT notes..."
            />
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">
              Client Education / Coaching
            </span>
            <textarea
              className="border rounded px-1 py-0.5 text-[10px] w-full"
              rows={3}
              placeholder="Education given, self-management coaching, red-flag review, return-to-work guidance, etc."
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">
              Follow-Up Timeframe
            </span>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white">
              <option>1–3 days</option>
              <option>1 week</option>
              <option>2 weeks</option>
              <option>1 month</option>
              <option>As needed / PRN</option>
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">Routing / FYI</span>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white">
              <option>None</option>
              <option>Notify Attorney</option>
              <option>Notify Provider</option>
              <option>Notify Internal Supervisor</option>
            </select>
          </label>
        </div>
      </section>

      {/* Demo Notice */}
      <section className="border-t pt-2">
        <p className="text-[9px] text-slate-400">
          Demo note: This RN Follow-Up form is currently local-only for
          walkthroughs and Dec 31 testing. In a later phase, these fields will
          be wired to the case record, attorney view, and reporting.
        </p>
      </section>
    </div>
  );
};

export default RNFollowUpForm;
