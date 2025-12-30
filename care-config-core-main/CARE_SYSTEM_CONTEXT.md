# Reconcile C.A.R.E. — System Context (Authoritative)

## Purpose
Reconcile C.A.R.E. is an RN-led clinical CARE assessment platform that supports attorney CASE strategy.
Nurses assess CARE. Attorneys strategize CASES.
Clinical assessments inform legal strategy but do not replace medical judgment or legal advice.

## Role Boundaries (Non-Negotiable)
- Nurses assess care needs; they do NOT diagnose, interpret medical records as physicians, or render medical opinions.
- Attorneys receive clinically informed CARE summaries, flags, and narratives — not raw RN scoring logic.
- Clients see read-only CARE plan summaries written in non-diagnostic, client-friendly language.
- Provider views (if present) are informational only and not required for demo.

## Language Rules
- Use RN-appropriate assessment language only.
- No diagnosis, no medical interpretation, no treatment orders.
- Use “clinically informed care narrative,” NOT “case narrative.”
- CARE (nursing) and CASE (attorney) are distinct concepts and must not be conflated.

## Core Frameworks (Already Defined — Do Not Redesign)
- 4Ps of Wellness (Physical, Psychological, Psychosocial, Professional)
- 10-V Care Framework
- Crisis Mode Logic
- SDOH Flags

## Demo Scope (Jan 15 — Demo-Only)
- This build is demo-ready, not production.
- Stability and clarity > completeness.
- Demo may use mock data.
- Demo must NOT write to Supabase.
- No production authentication required.
- No PHI in URLs, logs, or client-side storage.

## Expected Demo Flow
1. User enters /demo
2. Demo gating is consistent and intentional
3. Case selector is always visible once unlocked
4. RN completes assessment (or mock equivalent)
5. Attorney views CARE summary and flags
6. Client views read-only CARE plan summary

## Technical Guardrails
- One source of truth for active case selection
- RN, Attorney, and Client views read from the same active case
- Attorney never sees RN internal scoring structures
- Broken routes and dead links must be removed or hidden

## Out of Scope for Jan 15
- Full provider workflows
- Production auth
- Payments
- Full Supabase write flows
- Edge-case hardening

This file is authoritative. When ambiguity exists, defer to this document.
