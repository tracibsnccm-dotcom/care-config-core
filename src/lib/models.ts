// src/lib/models.ts
// Reconcile C.A.R.E. Core Data Models

export interface Client {
  id: string;
  name: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  cmDeclined?: boolean;
  cmDeclineLastDate?: string;
  lastFollowupDate?: string;
  nextFollowupDue?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Flag {
  id: string;
  clientId: string;
  type: string;
  label: string;
  severity: "Low" | "Moderate" | "High" | "Critical";
  status: "Open" | "Closed";
  createdAt: string;
  resolvedAt?: string;
  note?: string;
}

export interface Task {
  task_id: string;
  client_id: string;
  type: "FollowUp30Day" | "SupervisorReview" | string;
  title: string;
  assigned_to: string;
  due_date: string; // ISO date
  status: "Open" | "Completed" | "Cancelled";
  created_at: string; // ISO datetime
}

export interface Effect {
  type: string;
  payload?: any;
}

export interface AppState {
  client: Client;
  flags: Flag[];
  tasks: Task[];
}
