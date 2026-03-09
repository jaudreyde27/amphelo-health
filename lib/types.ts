export interface PatientProfile {
  id: string
  name: string
  dateOfBirth: string
  phone: string
  email: string
  createdAt: string
}

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  prescriptionNumber: string
  refillsRemaining: number
  lastFilled: string
  daysSupply: number
  pharmacyId: string
}

export interface Pharmacy {
  id: string
  name: string
  phone: string
  address: string
}

export type WorkflowStatus = 'needs_approval' | 'scheduled' | 'in_progress' | 'completed' | 'failed'
export type WorkflowType = 'refill' | 'status_check' | 'new_prescription' | 'custom'

export interface Workflow {
  id: string
  type: WorkflowType
  title: string
  description: string
  medicationId?: string
  medicationName?: string
  pharmacyId?: string
  pharmacyName?: string
  pharmacyPhone?: string
  status: WorkflowStatus
  scheduledAt: string
  completedAt?: string
  notes?: string
  callId?: string
  isRecurring: boolean
  recurringInterval?: 'monthly' | 'weekly'
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  workflowId?: string
  callId?: string
  callStatus?: 'initiating' | 'in_progress' | 'completed' | 'failed'
}

export interface AppState {
  profile: PatientProfile | null
  medications: Medication[]
  pharmacies: Pharmacy[]
  workflows: Workflow[]
  messages: ChatMessage[]
  onboardingComplete: boolean
}

export interface OnboardingData {
  profile: Omit<PatientProfile, 'id' | 'createdAt'>
  medications: Omit<Medication, 'id'>[]
  pharmacies: Omit<Pharmacy, 'id'>[]
  preferences: {
    callTimePreference: 'morning' | 'afternoon' | 'evening'
    refillReminderDays: number
  }
}
