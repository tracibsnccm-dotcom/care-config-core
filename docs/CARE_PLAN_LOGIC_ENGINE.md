# RECONCILE C.A.R.E. - Care Plan Logic Engine™

## Document Information

| Field | Value |
|-------|-------|
| **Version** | 1.0.0 |
| **Last Updated** | January 13, 2026 |
| **Owner** | Nurses as Entrepreneurs / Traci B. SNCCM |
| **Status** | Active - Source of Truth |

---

## Overview

The Care Plan Logic Engine™ is the proprietary clinical workflow system that powers Reconcile C.A.R.E. It combines the **4Ps of Wellness** framework with the **10Vs of Care Management** to create holistic, individualized, and legally defensible care plans.

Unlike traditional case management that relies solely on treatment guidelines (MCG/InterQual/ODG), this engine ensures care plans are:

1. **Client-centered** - The client's voice and circumstances drive the plan
2. **Holistically assessed** - All 4Ps are evaluated, not just the diagnosis
3. **Clinically gated** - RNs must complete mandatory assessments before proceeding
4. **Deviation-documented** - When guidelines don't fit, the reasoning is captured
5. **Legally defensible** - Creates audit trail for attorney use

---

## The 4Ps of Wellness

The 4Ps framework is based on Maslow's Hierarchy of Needs. Each pillar is scored 1-5:

| Score | Stage | Description |
|-------|-------|-------------|
| **1** | Crisis / Survival Mode | Critical - immediate intervention required |
| **2** | Emergent Instability | Urgent - significant barriers to engagement |
| **3** | Managed / Maintenance | Fragile - needs active management |
| **4** | Sustainable / Growth | Stable - room to grow |
| **5** | Optimal / Fulfillment | Thriving - proactive and engaged |

### The Four Pillars

| Pillar | Name | What It Assesses |
|--------|------|------------------|
| **P1** | Physical Wellness | Physical health, pain, functional capacity, medical conditions |
| **P2** | Psychological Wellness | Mental health, emotional state, coping, cognitive function |
| **P3** | Psychosocial Wellness | Social support, environment, housing, food security, SDOH |
| **P4** | Professional Wellness | Work capacity, financial stability, vocational function |

---

## The 10Vs of Care Management

The 10Vs provide a structured clinical assessment framework for care planning.

| V | Name | Definition | Purpose |
|---|------|------------|---------|
| **V1** | Voice / View | Captures the client's lived story, self-perception, and desired outcome | Ensures the client's voice drives the case narrative |
| **V2** | Viability | Assesses readiness, capacity, and stability across the 4Ps and SDOH | Identifies barriers early so RN can stabilize before expecting progress |
| **V3** | Vision | Defines shared goals and desired recovery trajectory | Establishes direction, milestones, and expectations |
| **V4** | Veracity | Focuses on integrity, accuracy, advocacy, and moral courage | Supports negotiations and protects client when issues arise |
| **V5** | Versatility | Assesses adaptability and flexibility of the care plan | Enables course-corrections as conditions change |
| **V6** | Vitality | Measures momentum, engagement, and forward movement | Signals if case is progressing, stagnant, or regressing |
| **V7** | Vigilance | Continuous monitoring of risk, safety, compliance, and gaps | Prevents harm and identifies crises early |
| **V8** | Verification | Ensures accuracy, evidence, and guideline alignment | Strengthens legal foundation and documentation integrity |
| **V9** | Value | Quantifies benefit, outcomes, efficiency, and restored function | Measures improvement relative to time, effort, and barriers |
| **V10** | Validation | Quality assurance and equity loop | Confirms RN actions were appropriate and equitable |

---

## Care Plan Requirements

### Mandatory Vs (Always Required)

These six Vs **MUST** be completed for every care plan—initial and follow-up. The RN **cannot submit** a care plan until all mandatory Vs are satisfied.

| V | Name | Why It's Always Required |
|---|------|--------------------------|
| **V1** | Voice / View | Client's story and goals must drive every plan |
| **V2** | Viability | Must assess if client CAN engage before planning |
| **V3** | Vision | Shared goals must be established |
| **V8** | Verification | Evidence and guideline alignment must be documented |
| **V9** | Value | Outcomes and benefit must be measured |
| **V10** | Validation | QA/equity check - confirms appropriate care |

### Triggered Vs (Conditionally Required)

These Vs are activated when specific conditions occur. Once triggered, they become **mandatory** and must be completed.

| V | Name | Triggered When |
|---|------|----------------|
| **V4** | Veracity | Client refuses treatment, OR provider is unresponsive |
| **V5** | Versatility | Need to review path options, add services, or revise treatment. **Loops back to 4Ps** |
| **V6** | Vitality | Case stalled, treatment stalled, OR patient plateaued. **Also re-triggers V8 + V9** |
| **V7** | Vigilance | Ongoing monitoring - tracks plan revision frequency and follow-up call frequency |

---

## Trigger Conditions Detail

### V4 - Veracity Triggers

**Activated when there are issues with client engagement or provider communication.**

| Condition | Description |
|-----------|-------------|
| `CLIENT_REFUSES_TREATMENT` | Client has declined or refused recommended treatment |
| `PROVIDER_UNRESPONSIVE` | Client reports provider is not responding or communicating |

**RN Action Required:** Document the communication issue, assess barriers, advocate for client.

---

### V5 - Versatility Triggers

**Activated when the care plan needs adaptation or revision.**

| Condition | Description |
|-----------|-------------|
| `NEEDS_ADDITIONAL_SERVICES` | Client needs services not in current plan |
| `TREATMENT_NEEDS_REVISION` | Current treatment approach needs adjustment |
| `CONDITION_CHANGED` | Client's condition has changed (better or worse) |

**⚠️ IMPORTANT:** When V5 is triggered, the RN **MUST loop back to the 4Ps** to check if any pillar scores have changed before updating the care plan.

**Example:**  
Client's blood sugar has increased → Client cannot afford increased insulin → This impacts P3 (Psychosocial/financial) and P4 (Professional/economic) → 4Ps must be re-assessed → Then update care plan accordingly.

---

### V6 - Vitality Triggers

**Activated when case momentum has stalled or declined.**

| Condition | Description |
|-----------|-------------|
| `CASE_STALLED` | No progress being made on care plan goals |
| `PATIENT_PLATEAUED` | Client's condition has stopped improving |

**⚠️ IMPORTANT:** When V6 is triggered, it **ALSO re-triggers V8 (Verification) and V9 (Value)** for mandatory re-review.

The RN must assess:
- **V6 Vitality:** Why has momentum stopped?
- **V8 Verification:** Does the evidence still support this treatment path?
- **V9 Value:** Are we still getting benefit, or do we need to change course?

---

### V7 - Vigilance (Ongoing Monitoring)

**V7 is always active as a monitoring function, not just a one-time assessment.**

It tracks:
- How often the care plan is revised
- How often the client is followed up with via phone calls
- Compliance with scheduled check-ins

| Condition | Description |
|-----------|-------------|
| `PLAN_REVISION_DUE` | Scheduled plan revision date has arrived |
| `FOLLOWUP_CALL_DUE` | Scheduled client follow-up call is due |

---

## Care Plan Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT COMPLETES INTAKE                                        │
│  4Ps Assessment captured (P1, P2, P3, P4 scores)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  RN OPENS CASE                                                  │
│  Sees 4Ps baseline + any safety flags                           │
│  4Ps scores highlight which 10Vs need priority attention        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  RN SELECTS CONDITION TYPE                                      │
│  Condition overlay applied (modifies expectations)              │
│  RN references ODG/MCG/InterQual for guideline benchmarks       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  INITIAL CARE PLAN                                              │
│  RN MUST complete: V1, V2, V3, V8, V9, V10                      │
│  ❌ CANNOT SUBMIT until all 6 mandatory Vs are satisfied        │
│                                                                 │
│  For each V:                                                    │
│  • RN scores/assesses                                           │
│  • Documents clinical reasoning                                 │
│  • If deviating from guideline → documents rationale            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ONGOING MONITORING (V7 - Vigilance)                            │
│  • Follow-up calls logged                                       │
│  • Plan revision dates tracked                                  │
│  • System alerts when check-ins are due                         │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────────┐
│ CLIENT ISSUE DETECTED   │     │ TREATMENT ISSUE DETECTED        │
├─────────────────────────┤     ├─────────────────────────────────┤
│ • Client refuses TX     │     │ • Case stalled                  │
│ • Provider unresponsive │     │ • Patient plateaued             │
│                         │     │ • Needs new services            │
│         │               │     │ • Condition changed             │
│         ▼               │     │         │                       │
│ TRIGGERS V4 (Veracity)  │     │         ▼                       │
│                         │     │ TRIGGERS V5 (Versatility)       │
│                         │     │ TRIGGERS V6 (Vitality)          │
│                         │     │         │                       │
│                         │     │         ▼                       │
│                         │     │ V5 → Loops back to 4Ps          │
│                         │     │ V6 → Re-triggers V8 + V9        │
└─────────────────────────┘     └─────────────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  FOLLOW-UP CARE PLAN                                            │
│  RN MUST complete: V1, V2, V3, V8, V9, V10 (mandatory)          │
│  PLUS any triggered Vs: V4, V5, V6                              │
│  ❌ CANNOT SUBMIT until all required Vs are satisfied           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Documenting Guideline Deviations

When treatment guidelines (ODG/MCG/InterQual) recommend one thing but the holistic assessment shows the client needs something different, the RN **MUST document the deviation**.

### What Gets Documented:

1. **The Guideline Reference** - Which guideline was consulted
2. **What the Guideline Recommends** - Expected treatment/timeline
3. **The Client's 4Ps Reality** - What the assessment shows
4. **The Condition Overlay Impact** - How the condition modifies expectations
5. **Clinical Reasoning** - Why deviation is medically necessary
6. **The Alternative Plan** - What will be done instead

### Example Documentation:

```
GUIDELINE: ODG Cervical Strain
RECOMMENDATION: Return to work 2-4 weeks with conservative treatment

CLIENT'S 4Ps:
• P1 Physical: 2 - Severe pain, limited ROM
• P3 Psychosocial: 1 - Homeless, no support system  
• P4 Professional: 2 - Physical labor job, no light duty available

CONDITION OVERLAY: MVA + Chronic Pain History
"Clients with pre-existing chronic pain may require extended timeline"

DEVIATION RATIONALE:
"ODG 2-4 week RTW is not achievable for this client. P3 crisis 
(homeless) prevents treatment compliance - cannot store medications,
no stable place to rest/recover. P4 job requires full physical 
capacity with no light duty option available. Recommend 6-8 week 
timeline with concurrent SDOH intervention to stabilize housing.
Extended timeline is medically necessary due to compounding barriers
that would otherwise result in treatment failure."

ALTERNATIVE PLAN:
• Week 1-2: Prioritize housing stabilization (P3 intervention)
• Week 2-4: Begin PT once stable housing secured
• Week 4-6: Progress treatment, reassess RTW capacity
• Week 6-8: Return to modified duties if available, or full RTW
```

### Why This Matters:

This documentation creates **legal ammunition** for the attorney. When an insurance company or defense attorney challenges the timeline, the attorney can show:

1. ✅ 4Ps Assessment documented client's actual baseline
2. ✅ Condition overlay applied appropriate clinical modifications
3. ✅ Each V scored with RN clinical reasoning
4. ✅ Specific rationale for why guidelines don't fit THIS client
5. ✅ Timestamped, signed audit trail

---

## 4Ps → 10Vs Influence Mapping

This shows which 10Vs are most influenced by each 4P pillar. Used to guide RN attention based on 4Ps scores.

| 4P Pillar | Primary 10Vs Influenced |
|-----------|-------------------------|
| **P1 Physical** | V2 (Viability), V6 (Vitality), V8 (Verification), V9 (Value) |
| **P2 Psychological** | V1 (Voice/View), V2 (Viability), V6 (Vitality), V7 (Vigilance) |
| **P3 Psychosocial** | V2 (Viability), V5 (Versatility), V7 (Vigilance), V10 (Validation) |
| **P4 Professional** | V2 (Viability), V3 (Vision), V8 (Verification), V9 (Value) |

### Critical Score Thresholds

| 4P Score | Action Required |
|----------|-----------------|
| **1 (Crisis)** | Immediate intervention - stabilize before care planning |
| **2 (Emergent)** | Urgent attention - address barriers before expecting compliance |
| **3 (Managed)** | Active management - monitor closely during treatment |
| **4-5 (Stable)** | Proceed with standard care planning |

### Safety Flags

| Flag | Action |
|------|--------|
| **Abuse Risk** | Activate safety protocol, document carefully, consider mandatory reporting |
| **Suicide Risk** | Crisis intervention required - do not proceed with standard care planning until stabilized |

---

## Condition Overlays (Lenses)

The use of "lenses" ensures the 4Ps assessment is calibrated to the specific risk factors of different demographics. Multiple lenses can be applied simultaneously (e.g., a 65-year-old female caregiver would have the 60+ Overlay, Gender-Female Overlay, and Caregiver/Dependent Overlay applied).

---

### 1. The 60+ Overlay: Geriatric Precision

**Age Range:** 60+

This lens integrates critical, evidence-based focus areas for clients aged 60 and over.

| Focus Area | Primary Domain | Key Screening Points |
|------------|----------------|---------------------|
| Functional Capacity & Safety | P1 Physical | ADLs/IADLs, Fall Risk Screening, Gait/Mobility status |
| Polypharmacy & Risk Review | P1 Physical | Review all medications, BEERS Criteria screening |
| Cognitive & Behavioral Health | P2 Psychological | Mandatory screening for Delirium, Depression, Dementia |
| Client Goals & Preferences | P3/P4 | Elicit client's "What Matters" goals (e.g., "maintain independence") |

**Stage Modification Example - P1 Physical Stage 2:**
- **Original:** Health is unstable with frequent crises or urgent care needs.
- **Modified:** Health is unstable, AND: Active Mobility deficit (e.g., two or more falls in the last month) OR Polypharmacy (5+ medications) with documented high-risk drug interaction.

---

### 2. Symmetrical Family Assessment Model (Caregiver/Dependent Overlay)

This model ensures the risk of dependents is factored into the adult's instability score and vice versa.

**Adult 4Ps Overlay - New Screening Items:**

| Pillar | Screening Question |
|--------|-------------------|
| P1 Physical | Is the client's physical condition severe enough to impact their ability to provide basic physical supervision/care for dependents? |
| P2 Psychological | Does the client's current mental/emotional status pose a risk of emotional or physical neglect to dependents? |
| P3 Psychosocial | Does the client's housing, income, or financial strain jeopardize the stability/safety of the entire family unit? |
| P4 Professional | Do caregiving responsibilities for dependents create a direct conflict that jeopardizes the client's own recovery, work, or treatment adherence? |

**The Principle of Symmetrical Risk:**
- **For a Child (Dependent):** The child's initial stability score in each P can be NO HIGHER than the Caregiver's corresponding pillar score.
- **For an Adult (Caregiver):** The adult's Stability Stage definitions are expanded to include dependent risk, automatically lowering the score to reflect the functional severity of their crisis.

---

### 3. The Student Lens (Ages 18-24)

A tailored framework for assessing the unique drivers of health in a student population.

| Stage | P1 Physical | P2 Psychological | P3 Psychosocial | P4 Professional |
|-------|-------------|------------------|-----------------|-----------------|
| **5** | Peak health, excels in healthy habits | Strong well-being, manages stress effectively | Safe housing, supportive campus community | "The Thriving Scholar" - purposeful education, secure funding |
| **4** | Stable, chronic conditions controlled | Diagnosed condition well-controlled | Stable environment, satisfied with relationships | "The Secure Student" - satisfied with path, costs covered |
| **3** | Fragile, acute illness causes missed classes | "The Struggling Student" - stress affects grades | Stable but strained, socially isolated | "The Straining Student" - high stress, significant debt |
| **2** | Unstable, chronic condition exacerbated | "The Student in Crisis" - severe depression | Active housing/food insecurity, profoundly isolated | "The At-Risk Student" - insufficient aid, considering dropout |
| **1** | Critical, requires medical leave | "The Student at Acute Risk" - danger to self/others | Homeless, dangerous environment | "The Student in Crisis" - dropped out or verge of collapse |

---

### 4. Pediatric Frameworks

#### 4a. Adolescent Lens (Ages 13-17)

| Pillar | Focus Area | Screening Actions |
|--------|------------|-------------------|
| P1 Physical | Health Maintenance, Risk Behaviors | Verify immunizations, assess medication adherence barriers, screen for substance use |
| P2 Psychological | Identity, Coping, Emotional Regulation | Complete PHQ-9/GAD-7, refer to trauma-informed therapy |
| P3 Psychosocial | Peer Influence, Family Dynamics | Assess social media use/peer pressure, evaluate family support and conflict |
| P4 Pedagogical | Academic Engagement, Future Goals | Contact school social worker, review IEP accommodations, discuss vocational/college plans |

#### 4b. Child Lens (Ages 3-12)

| Pillar | Focus Area | Screening Actions |
|--------|------------|-------------------|
| P1 Physical | Developmental Milestones | Verify immunizations, refer to OT/PT/Speech for deficits |
| P2 Psychological | Affect Regulation, Trauma | Screen caregivers for parenting stress, verify behavioral health referrals |
| P3 Psychosocial | Family Support, Neglect | Mandatory reporting if abuse/neglect suspected (CPS), assess for bullying |
| P4 Pedagogical | N/A | Child's primary "role" is growth and learning through play - captured in other domains |

#### 4c. Infant/Toddler Lens (Ages 0-2)

| Pillar | Focus Area | Screening Actions |
|--------|------------|-------------------|
| P1 Physical | Growth, Health Maintenance | Verify immunizations, refer to pediatric dietician, verify WIC/SNAP enrollment |
| P2 Psychological | Attachment, Responsiveness | Observe caregiver-infant interaction, refer to Infant Mental Health/dyadic therapy |
| P3 Psychosocial | Caregiver Support, Basic Needs | Connect to home visiting programs and respite care, assess basic needs |
| P4 Pedagogical | N/A | Infant's primary "role" is secure attachment and sensorimotor development - captured in P1/P2 |

---

### 5. Gender-Specific Health Considerations (Adults 18+)

This lens demonstrates the interconnectedness of the 4Ps by highlighting how biological sex and gender identity influence health drivers.

| Pillar | Female-Assigned Adults | Male-Assigned Adults |
|--------|------------------------|----------------------|
| P1 Physical | Cervical/breast cancer screening, Bone/Vitamin D review | Testicular/prostate health, Vascular health for high-risk behaviors |
| P2 Psychological | Perinatal/Postpartum Mood Screening, Domestic Violence Screening | Targeted Substance Use Screening, Address barriers to emotional expression |
| P3 Psychosocial | Role strain as primary caregiver, Access to women's health resources | Social isolation assessment, Paternity leave and family support policies |
| P4 Professional | Financial impacts of caregiver leave, Gender-based pay inequity | Workplace stress from breadwinner expectations, Hazardous occupational exposures |

---

### Applying Multiple Overlays

Overlays can and should be combined based on client demographics:

**Example:** 68-year-old female who is primary caregiver for grandchildren
- Apply: 60+ Overlay + Gender-Female Overlay + Caregiver/Dependent Overlay
- All three sets of screening items and stage modifications apply
- The most restrictive stage modification takes precedence

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | January 13, 2026 | Initial version - Core logic engine documented | Traci B. / Claude |

---

## Intellectual Property Notice

**COPYRIGHT © 2024-2025 Nurses as Entrepreneurs / Traci B. SNCCM**

The Care Plan Logic Engine™, 4Ps of Wellness™, and 10Vs of Care Management™ are proprietary intellectual property. The methodologies, workflows, and clinical logic documented herein represent trade secrets and confidential business information.

All rights reserved. Unauthorized reproduction, distribution, or use is prohibited.
