import { Workflow, Medication, Pharmacy, PatientProfile } from './types'

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function nextRefillDate(daysSupply: number, lastFilled: string, reminderDays: number): string {
  const filled = new Date(lastFilled)
  const refillOn = new Date(filled)
  refillOn.setDate(refillOn.getDate() + daysSupply - reminderDays)
  // If date is in the past, schedule for next month
  if (refillOn < new Date()) {
    refillOn.setMonth(refillOn.getMonth() + 1)
  }
  return refillOn.toISOString()
}

export function generateWorkflowsFromOnboarding(
  medications: Medication[],
  pharmacies: Pharmacy[],
  reminderDays: number = 7
): Workflow[] {
  const workflows: Workflow[] = []

  for (const med of medications) {
    const pharmacy = pharmacies.find(p => p.id === med.pharmacyId)
    if (!pharmacy) continue

    const scheduledAt = nextRefillDate(med.daysSupply, med.lastFilled, reminderDays)

    workflows.push({
      id: uuid(),
      type: 'refill',
      title: `Refill ${med.name}`,
      description: `Call ${pharmacy.name} to request a refill for ${med.name} ${med.dosage}`,
      medicationId: med.id,
      medicationName: `${med.name} ${med.dosage}`,
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name,
      pharmacyPhone: pharmacy.phone,
      status: 'needs_approval',
      scheduledAt,
      isRecurring: true,
      recurringInterval: 'monthly',
      createdAt: new Date().toISOString(),
    })
  }

  return workflows
}

export function createAdHocWorkflow(
  type: Workflow['type'],
  title: string,
  description: string,
  medication?: Medication,
  pharmacy?: Pharmacy
): Workflow {
  return {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    type,
    title,
    description,
    medicationId: medication?.id,
    medicationName: medication ? `${medication.name} ${medication.dosage}` : undefined,
    pharmacyId: pharmacy?.id,
    pharmacyName: pharmacy?.name,
    pharmacyPhone: pharmacy?.phone,
    status: 'in_progress',
    scheduledAt: new Date().toISOString(),
    isRecurring: false,
    createdAt: new Date().toISOString(),
  }
}

export function buildAssistantOverrides(
  profile: PatientProfile,
  medication?: Medication,
  pharmacy?: Pharmacy,
  customInstructions?: string
) {
  return {
    variableValues: {
      patientName: profile.name,
      patientDOB: profile.dateOfBirth,
      patientPhone: profile.phone,
      medicationName: medication?.name ?? '',
      medicationDosage: medication?.dosage ?? '',
      prescriptionNumber: medication?.prescriptionNumber ?? '',
      pharmacyName: pharmacy?.name ?? '',
      customInstructions: customInstructions ?? '',
    },
  }
}

export function formatScheduledDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 7) return `In ${diff} days`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
