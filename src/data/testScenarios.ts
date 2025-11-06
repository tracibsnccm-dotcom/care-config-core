// Test scenarios configuration with all 30 scenarios
export interface TestScenario {
  id: string;
  name: string;
  clientProfile: string;
  corePattern: string;
  attorneyStatus: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  time: string;
  description: string;
  expectedAction?: string;
}

export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: "scenario-1",
    name: "Standard Intake & Nudge Pattern",
    clientProfile: "Jane Doe - Initial case intake",
    corePattern: "Client initiates a case, triggering a fixed deadline and time-sensitive notifications.",
    attorneyStatus: "No Attorney",
    timeline: [
      {
        time: "T+0 Hours (Jan 1, 9:00 AM)",
        description: "Client 'Jane Doe' completes initial intake",
        expectedAction: "System timestamp recorded"
      },
      {
        time: "T+72 Hours (Jan 4, 9:00 AM)",
        description: "System sends nudge email to assigned attorney",
        expectedAction: "Email: 'Client Jane Doe has 4 days left to complete intake'"
      },
      {
        time: "T+7 Days (Jan 8, 9:01 AM)",
        description: "Deadline reached - intake not complete",
        expectedAction: "Automatically delete all of Jane's PHI"
      }
    ]
  },
  {
    id: "scenario-2",
    name: "Nurse SLA & Escalation Pattern",
    clientProfile: "John Smith - Case assigned to nurse",
    corePattern: "A case is assigned to a nurse, triggering strict deadlines for action.",
    attorneyStatus: "No Attorney",
    timeline: [
      {
        time: "T+0 Hours (Jan 1, 2:00 PM)",
        description: "Case for 'John Smith' assigned to Nurse Alice",
        expectedAction: "Assignment confirmed"
      },
      {
        time: "T+8 Hours (Jan 1, 10:00 PM)",
        description: "Med Rec Deadline",
        expectedAction: "Flag if Nurse Alice has not completed medication reconciliation"
      },
      {
        time: "T+25 Hours (Jan 2, 3:00 PM)",
        description: "Contact Deadline Missed",
        expectedAction: "Flag 24-hour contact SLA breach and escalate to Clinical Manager"
      }
    ]
  },
  {
    id: "scenario-3",
    name: "Critical Alert Lockout Pattern",
    clientProfile: "Bob Lee - Active suicidal ideation",
    corePattern: "A client's response triggers a system-wide lockout for a specific user until a mandatory task is complete.",
    attorneyStatus: "No Attorney",
    timeline: [
      {
        time: "T+0 Hours (Jan 1, 11:00 AM)",
        description: "Client 'Bob Lee' submits intake indicating active suicidal ideation",
        expectedAction: "Critical alert triggered"
      },
      {
        time: "T+0.1 Hours (Jan 1, 11:06 AM)",
        description: "Nurse Betty's dashboard locked with blinking red alert",
        expectedAction: "Cannot access any other patient files"
      },
      {
        time: "T+0.5 Hours (Jan 1, 11:30 AM)",
        description: "Nurse Betty completes mandatory 'Critical Incident' form",
        expectedAction: "Dashboard lock released"
      }
    ]
  },
  {
    id: "scenario-4",
    name: "Evolving Case with Provider Feedback",
    clientProfile: "Maria Garcia - Pain escalation over time",
    corePattern: "A case evolves over time with new client entries and external provider input, requiring ongoing nurse coordination.",
    attorneyStatus: "No Attorney",
    timeline: [
      {
        time: "T+0 Days (Jan 1)",
        description: "Client 'Maria Garcia' completes intake. Pain is 4/10",
        expectedAction: "Initial assessment recorded"
      },
      {
        time: "T+2 Days (Jan 3)",
        description: "Maria uses wellness diary: 'Pain is 8/10, can't sleep'",
        expectedAction: "Case flagged for RN review"
      },
      {
        time: "T+5 Days (Jan 6)",
        description: "Physical Therapist uploads report: 'Patient has guarded prognosis'",
        expectedAction: "Report added to case file"
      },
      {
        time: "T+6 Days (Jan 7)",
        description: "RN updates care plan based on PT's report and contacts attorney",
        expectedAction: "Care plan updated, attorney notified"
      }
    ]
  },
  {
    id: "scenario-5",
    name: "Attorney Referral & Payment Timeout",
    clientProfile: "Valuable case for high-rated attorney",
    corePattern: "A referral is made to an attorney with a time-limited window to accept via payment.",
    attorneyStatus: "Referred to Attorney Clark",
    timeline: [
      {
        time: "T+0 Hours (Jan 1, 9:00 AM)",
        description: "Valuable case offered to Attorney Clark (>4.5 rating)",
        expectedAction: "Referral sent"
      },
      {
        time: "T+24 Hours (Jan 2, 9:00 AM)",
        description: "System checks Attorney Clark's eWallet",
        expectedAction: "If funds not present, rescind referral and offer to next attorney in queue"
      }
    ]
  },
  {
    id: "scenario-6",
    name: "Complaint about Provider",
    clientProfile: "Chloe R., 29, domestic violence",
    corePattern: "Tests rebuilding trust and the provider rating system after negative ER experience.",
    attorneyStatus: "No Attorney",
    timeline: [
      {
        time: "T+0 (Jan 1, 10:00 AM)",
        description: "Intake completed. Describes negative ER experience - dismissive doctor",
        expectedAction: "Complaint documented"
      },
      {
        time: "T+2 Hrs (Jan 1, 12:00 PM)",
        description: "RN CM contacts Chloe, apologizes for experience, explains provider badge system",
        expectedAction: "Trust-building conversation"
      },
      {
        time: "T+1 Day (Jan 2, 10:00 AM)",
        description: "RN CM assigns highly-rated, compassionate PCP from directory",
        expectedAction: "New provider assigned"
      }
    ]
  },
  {
    id: "scenario-7",
    name: "Complaint about Attorney",
    clientProfile: "Robert Y., 70, hip fx. Lives alone",
    corePattern: "Tests the protocol for handling poor attorney communication.",
    attorneyStatus: "Has Attorney (Davis)",
    timeline: [
      {
        time: "T+3 Days (Jan 4, 2:00 PM)",
        description: "Client tells RN CM he can't reach his attorney",
        expectedAction: "Complaint documented"
      },
      {
        time: "T+3.5 Hrs (Jan 4, 5:30 PM)",
        description: "RN CM documents complaint and escalates to legal liaison per protocol",
        expectedAction: "Escalation initiated"
      },
      {
        time: "T+1 Day (Jan 5, 2:00 PM)",
        description: "System task created for liaison to follow up",
        expectedAction: "Task assigned"
      }
    ]
  },
  {
    id: "scenario-8",
    name: "The Expired Case",
    clientProfile: "Thomas B., 40, minor MVA",
    corePattern: "Tests the 7-day hard delete rule and system cleanup.",
    attorneyStatus: "No Attorney",
    timeline: [
      {
        time: "T+0 (Jan 1, 9:00 AM)",
        description: "Intake started but not completed",
        expectedAction: "Draft intake created"
      },
      {
        time: "T+6 Days (Jan 7, 9:00 AM)",
        description: "System sends final nudge to attorney",
        expectedAction: "Final warning email"
      },
      {
        time: "T+7 Days, 1 Min (Jan 8, 9:01 AM)",
        description: "All PHI for Thomas permanently deleted",
        expectedAction: "Case shows as 'Expired' in logs"
      }
    ]
  },
  {
    id: "scenario-9",
    name: "Worsening Mental Health",
    clientProfile: "Elena G., 50, work stress, anxiety",
    corePattern: "Tests system alerts for escalating symptoms and care plan adaptation.",
    attorneyStatus: "Has Attorney (Wilson)",
    timeline: [
      {
        time: "T+0 (Jan 1)",
        description: "Intake completed - moderate anxiety reported",
        expectedAction: "Initial assessment"
      },
      {
        time: "T+10 Days (Jan 11)",
        description: "Diary: 'Anxiety so bad I can't leave house. Missed therapy'",
        expectedAction: "Case flagged for immediate RN attention"
      },
      {
        time: "T+10.5 Hrs (Jan 11, 6:00 PM)",
        description: "RN CM conducts safety check, provides telehealth options, updates care plan",
        expectedAction: "Crisis intervention completed"
      }
    ]
  },
  {
    id: "scenario-10",
    name: "The 'Know-It-All' Client",
    clientProfile: "Mike S., 55, self-representing",
    corePattern: "Tests audit trail when client/attorney pushes back against medical advice.",
    attorneyStatus: "Is his own Attorney",
    timeline: [
      {
        time: "T+2 Days (Jan 3)",
        description: "RN CM recommends PT",
        expectedAction: "Recommendation documented"
      },
      {
        time: "T+3 Days (Jan 4)",
        description: "Mike refuses, demands MRI instead",
        expectedAction: "Refusal documented"
      },
      {
        time: "T+3.5 Hrs (Jan 4, 2:00 PM)",
        description: "RN CM documents refusal and rationale for PT recommendation",
        expectedAction: "Note: 'client acting against medical advice'"
      }
    ]
  },
  {
    id: "scenario-11",
    name: "The Lunchtime Crisis",
    clientProfile: "Sarah W., 22, MVA with active suicidal plan",
    corePattern: "Tests escalation protocol when assigned nurse is unreachable.",
    attorneyStatus: "No Attorney",
    timeline: [
      {
        time: "T+0 (Jan 1, 12:05 PM)",
        description: "Intake with active suicidal plan - locks Nurse Amy's dashboard",
        expectedAction: "Critical alert triggered"
      },
      {
        time: "T+0:05 Hrs (Jan 1, 12:10 PM)",
        description: "System detects no action - escalates to Clinical Supervisor",
        expectedAction: "Auto-escalation initiated"
      },
      {
        time: "T+0:10 Hrs (Jan 1, 12:15 PM)",
        description: "Supervisor reassigns case, contacts 911/emergency contact",
        expectedAction: "Emergency protocol activated"
      }
    ]
  },
  {
    id: "scenario-12",
    name: "The 'Ideal' Control Case",
    clientProfile: "James H., 48, MVA",
    corePattern: "Measures baseline efficiency and cost. Contrast with other scenarios.",
    attorneyStatus: "Has Attorney (Miller)",
    timeline: [
      {
        time: "T+0 (Jan 1)",
        description: "Intake completed",
        expectedAction: "Standard workflow initiated"
      },
      {
        time: "T+1 Day (Jan 2)",
        description: "RN CM contact, med rec, care plan",
        expectedAction: "All initial tasks completed on time"
      },
      {
        time: "T+2 Weeks (Jan 15)",
        description: "Steady progress in diary. Low-cost PT",
        expectedAction: "Case ready for closure"
      }
    ]
  },
  {
    id: "scenario-13",
    name: "The Badge at Risk",
    clientProfile: "Dr. Evans, Ortho provider",
    corePattern: "Tests the gating of referrals based on rating and the warning system.",
    attorneyStatus: "Has Attorney (Lee)",
    timeline: [
      {
        time: "T+0 (Jan 1)",
        description: "Dr. Evans has 4.4 rating. Referral attempted",
        expectedAction: "System blocks referral"
      },
      {
        time: "T+0 (Jan 1)",
        description: "Warning sent to Dr. Evans",
        expectedAction: "Message: 'Rating below 4.5. 60 days to improve'"
      }
    ]
  },
  {
    id: "scenario-14",
    name: "The eWallet Race",
    clientProfile: "Linda C., 33",
    corePattern: "Tests rule for choosing between multiple eligible attorneys.",
    attorneyStatus: "No Attorney",
    timeline: [
      {
        time: "T+0 (Jan 1, 9:00 AM)",
        description: "Case enters queue. Attorneys A & B have 4.5+ rating and funds",
        expectedAction: "System evaluates eligible attorneys"
      },
      {
        time: "T+0 (Jan 1, 9:00 AM)",
        description: "System offers case to Attorney A (higher rating)",
        expectedAction: "Referral sent to highest-rated attorney"
      }
    ]
  },
  {
    id: "scenario-15",
    name: "Referral Payment Timeout",
    clientProfile: "Carlos M., 31",
    corePattern: "Tests the 24-hour funding window and re-circulation.",
    attorneyStatus: "Referred by Attorney Ray",
    timeline: [
      {
        time: "T+0 (Jan 1, 9:00 AM)",
        description: "Referral sent to Attorney Ray (empty eWallet)",
        expectedAction: "24-hour countdown starts"
      },
      {
        time: "T+24 Hrs (Jan 2, 9:00 AM)",
        description: "System checks wallet, finds it empty. Rescinds offer",
        expectedAction: "Referral withdrawn"
      },
      {
        time: "T+24 Hrs, 1 Min (Jan 2, 9:01 AM)",
        description: "Offer sent to next attorney in queue",
        expectedAction: "Re-circulation complete"
      }
    ]
  },
  {
    id: "scenario-16",
    name: "The HIPAA Test",
    clientProfile: "Anita T., 65, fall",
    corePattern: "Tests permission walls and HIPAA warnings.",
    attorneyStatus: "Has Attorney (Ford)",
    timeline: [
      {
        time: "T+2 Days (Jan 3)",
        description: "Staff user tries to access clinical therapy notes",
        expectedAction: "Access attempt logged"
      },
      {
        time: "T+2 Days (Jan 3)",
        description: "System blocks access",
        expectedAction: "Flag: 'Access Denied: HIPAA Minimum Necessary Rule'"
      }
    ]
  },
  {
    id: "scenario-17",
    name: "The File Upload Glitch",
    clientProfile: "Brian O., 52",
    corePattern: "Tests handling of upload failures and user error.",
    attorneyStatus: "Has Attorney (Garcia)",
    timeline: [
      {
        time: "T+1 Day (Jan 2)",
        description: "Staff starts uploading 20-page record. Internet fails",
        expectedAction: "Upload interrupted"
      },
      {
        time: "T+1 Day, 0.5 Hrs (Jan 2, 1:30 PM)",
        description: "Staff re-uploads. Then accidentally uploads personal photo",
        expectedAction: "Wrong file uploaded"
      },
      {
        time: "T+1 Day, 0.6 Hrs (Jan 2, 1:36 PM)",
        description: "Staff successfully deletes wrong file. System saves state correctly",
        expectedAction: "Correct file remains, wrong file deleted"
      }
    ]
  },
  {
    id: "scenario-18",
    name: "The Out-of-Office Nurse",
    clientProfile: "Patricia N., 38",
    corePattern: "Tests bulk reassignment of a nurse's queue without breaching SLAs.",
    attorneyStatus: "No Attorney",
    timeline: [
      {
        time: "T+0 (Jan 1, 8:00 AM)",
        description: "Case assigned to Nurse Amy (out sick)",
        expectedAction: "Initial assignment"
      },
      {
        time: "T+2 Hrs (Jan 1, 10:00 AM)",
        description: "Clinical Manager reassigns Amy's entire queue to other nurses",
        expectedAction: "Bulk reassignment executed"
      },
      {
        time: "T+3 Hrs (Jan 1, 11:00 AM)",
        description: "New assigned nurse makes contact, beating 24h SLA",
        expectedAction: "SLA maintained"
      }
    ]
  },
  {
    id: "scenario-19",
    name: "The Director's Overview",
    clientProfile: "George V., 70, complex case",
    corePattern: "Tests that Director role has view-only access to all data.",
    attorneyStatus: "Has Attorney (Harris)",
    timeline: [
      {
        time: "T+5 Days (Jan 6)",
        description: "Clinical Director reviews the case",
        expectedAction: "Director accesses case file"
      },
      {
        time: "T+5 Days (Jan 6)",
        description: "Director can see every note, form, financial transaction, and log entry",
        expectedAction: "No access restrictions - view-only confirmed"
      }
    ]
  },
  {
    id: "scenario-20",
    name: "The Chronic Pain Patient",
    clientProfile: "Deborah L., 58",
    corePattern: "Tests handling of high-risk medications and coordination with specialists.",
    attorneyStatus: "Has Attorney (Clark)",
    timeline: [
      {
        time: "T+0 (Jan 1)",
        description: "Intake reveals long-term opioid use for pre-existing pain",
        expectedAction: "High-risk medication flagged"
      },
      {
        time: "T+1 Day (Jan 2)",
        description: "RN CM's med rec flags this for high priority. Contacts pain management MD",
        expectedAction: "Specialist consultation initiated"
      },
      {
        time: "T+2 Days (Jan 3)",
        description: "Care plan and provider packet highlight opioid history to prevent withdrawal",
        expectedAction: "Safety protocols documented"
      }
    ]
  },
  {
    id: "scenario-21",
    name: "Simple, Fast Resolution",
    clientProfile: "Frank Z., 38, minor burn",
    corePattern: "Tests quick turnaround and efficient use of resources.",
    attorneyStatus: "No Attorney",
    timeline: [
      {
        time: "T+0 to T+5 Days (Jan 1-5)",
        description: "Straightforward intake, quick RN contact, simple care plan, rapid improvement",
        expectedAction: "Case closed quickly with minimal resource use"
      }
    ]
  },
  {
    id: "scenario-22",
    name: "Neurological Monitoring",
    clientProfile: "Gwen H., 27, concussion",
    corePattern: "Tests tracking of cognitive symptoms over time.",
    attorneyStatus: "Has Attorney (Lee)",
    timeline: [
      {
        time: "T+0 (Jan 1)",
        description: "Intake: headache, dizziness reported",
        expectedAction: "Initial neurological assessment"
      },
      {
        time: "T+4 Days (Jan 5)",
        description: "Diary: 'Memory is foggy, sensitive to light'",
        expectedAction: "Symptom progression documented"
      },
      {
        time: "T+5 Days (Jan 6)",
        description: "RN CM refers to neurologist, updates care plan",
        expectedAction: "Specialist referral made"
      }
    ]
  },
  {
    id: "scenario-23",
    name: "The Well-Managed Recovery",
    clientProfile: "Lisa T., 30, shoulder sprain",
    corePattern: "Tests successful case closure and reporting.",
    attorneyStatus: "Has Attorney (Miller)",
    timeline: [
      {
        time: "T+1 Week (Jan 8)",
        description: "Diary shows steady improvement",
        expectedAction: "Progress documented"
      },
      {
        time: "T+2 Weeks (Jan 15)",
        description: "Pain at 1/10. 'PT helped, back to normal'",
        expectedAction: "Recovery confirmed"
      },
      {
        time: "T+2 Weeks, 1 Day (Jan 16)",
        description: "RN CM prepares closure summary for attorney",
        expectedAction: "Case closure initiated"
      }
    ]
  },
  {
    id: "scenario-24",
    name: "The Non-Compliant Patient",
    clientProfile: "Mark S., 55, knee injury",
    corePattern: "Tests alerts and documentation when a client misses treatments.",
    attorneyStatus: "Has Attorney (Garcia)",
    timeline: [
      {
        time: "T+1 Week (Jan 8)",
        description: "Provider alert: 'Missed 2 PT appointments'",
        expectedAction: "Non-compliance flagged"
      },
      {
        time: "T+1 Week, 0.5 Days (Jan 8, 2:00 PM)",
        description: "RN CM contacts client, identifies 'no motivation' as barrier",
        expectedAction: "Non-compliance documented with root cause"
      }
    ]
  },
  {
    id: "scenario-25",
    name: "The Poly-Victim",
    clientProfile: "Linda C., 33, MVA",
    corePattern: "Tests triage and management of severe, concurrent psychosocial issues.",
    attorneyStatus: "No Attorney",
    timeline: [
      {
        time: "T+4 Days (Jan 5)",
        description: "Misses appointment (no car)",
        expectedAction: "Transportation barrier identified"
      },
      {
        time: "T+10 Days (Jan 11)",
        description: "Diary entry about depression",
        expectedAction: "Mental health concern documented"
      },
      {
        time: "T+15 Days (Jan 16)",
        description: "Reports fight with partner",
        expectedAction: "RN CM must triage and address all concurrent issues"
      }
    ]
  },
  {
    id: "scenario-26",
    name: "The Anxious Elder",
    clientProfile: "Oscar P., 75, fall. Fearful",
    corePattern: "Tests communication and reassurance with vulnerable, non-tech-savvy client.",
    attorneyStatus: "Has Attorney (Davis)",
    timeline: [
      {
        time: "T+1 Day (Jan 2)",
        description: "RN CM spends extra time on phone explaining process, building trust",
        expectedAction: "Enhanced communication documented"
      },
      {
        time: "T+3 Days (Jan 4)",
        description: "Client's daughter helps with diary entry",
        expectedAction: "Family support integrated"
      }
    ]
  },
  {
    id: "scenario-27",
    name: "Overwhelmed by Logistics",
    clientProfile: "Nina C., 42, single mom, 3 kids",
    corePattern: "Tests resource coordination for childcare, transportation, and scheduling.",
    attorneyStatus: "No Attorney",
    timeline: [
      {
        time: "T+2 Days (Jan 3)",
        description: "Misses MD appt (sick child)",
        expectedAction: "Logistical barrier documented"
      },
      {
        time: "T+3 Days (Jan 4)",
        description: "RN CM provides list of low-cost childcare and telehealth options",
        expectedAction: "Resource coordination completed"
      }
    ]
  },
  {
    id: "scenario-28",
    name: "Language & Cultural Barrier",
    clientProfile: "Ivan D., 48, non-English speaker",
    corePattern: "Tests system's capacity for clear communication and cultural sensitivity.",
    attorneyStatus: "Has Attorney (Wilson)",
    timeline: [
      {
        time: "T+0 (Jan 1)",
        description: "Intake completed with help from family member",
        expectedAction: "Language barrier noted"
      },
      {
        time: "T+1 Day (Jan 2)",
        description: "RN CM uses interpreter service for initial contact. Ensures all handouts are in correct language",
        expectedAction: "Language-appropriate materials provided"
      }
    ]
  },
  {
    id: "scenario-29",
    name: "The Billing Dispute",
    clientProfile: "Hannah J., 36",
    corePattern: "Tests handling of incorrect bills and insurance disputes.",
    attorneyStatus: "Has Attorney (Clark)",
    timeline: [
      {
        time: "T+2 Weeks (Jan 15)",
        description: "Client receives bill for $1200 that should be covered",
        expectedAction: "Billing issue identified"
      },
      {
        time: "T+2 Weeks, 1 Day (Jan 16)",
        description: "Staff uploads bill, RN CM contacts provider's billing department to resolve",
        expectedAction: "Dispute resolution initiated"
      }
    ]
  },
  {
    id: "scenario-30",
    name: "The Seemingly Minor Injury",
    clientProfile: "Leo T., 28",
    corePattern: "Tests system response when a minor complaint evolves into a major one.",
    attorneyStatus: "No Attorney",
    timeline: [
      {
        time: "T+0 (Jan 1)",
        description: "Minor ankle sprain reported",
        expectedAction: "Standard intake for minor injury"
      },
      {
        time: "T+1 Week (Jan 8)",
        description: "Diary: 'Ankle worse, can't walk, severe swelling'",
        expectedAction: "Escalation to urgent care triggered"
      },
      {
        time: "T+1 Week, 0.5 Days (Jan 8, 2:00 PM)",
        description: "RN CM orders imaging, refers to orthopedic specialist",
        expectedAction: "Care plan updated for major injury"
      }
    ]
  }
];

export function getScenarioById(id: string): TestScenario | undefined {
  return TEST_SCENARIOS.find(s => s.id === id);
}

export function getAllScenarioIds(): string[] {
  return TEST_SCENARIOS.map(s => s.id);
}
