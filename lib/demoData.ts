import { clearState } from './storage'
import type { AppState } from './types'

const ts = (daysOffset: number, hour = 9, minute = 0) => {
  const dt = new Date('2026-03-10T00:00:00.000Z')
  dt.setUTCDate(dt.getUTCDate() + daysOffset)
  dt.setUTCHours(hour, minute, 0, 0)
  return dt.toISOString()
}

const CVS = 'pharm-cvs'
const WG  = 'pharm-wg'

export function loadDemoState() {
  const state = {
    onboardingComplete: true,

    profile: {
      id: 'patient-demo',
      name: 'Audrey De',
      dateOfBirth: '1989-04-15',
      phone: '(415) 204-8823',
      email: 'audrey.de@gmail.com',
      createdAt: ts(-60),
    },

    medications: [
      {
        id: 'med-1', name: 'Humalog', dosage: '100u/mL KwikPen',
        frequency: 'Daily', prescriptionNumber: 'Rx #4421089',
        refillsRemaining: 3, lastFilled: ts(-26), daysSupply: 30, pharmacyId: CVS,
      },
      {
        id: 'med-2', name: 'Tresiba', dosage: '100u/mL FlexTouch',
        frequency: 'Daily', prescriptionNumber: 'Rx #4421092',
        refillsRemaining: 2, lastFilled: ts(-23), daysSupply: 30, pharmacyId: CVS,
      },
      {
        id: 'med-3', name: 'Dexcom G7 Sensor', dosage: '10-pack',
        frequency: 'Every 10 days', prescriptionNumber: 'Rx #8813047',
        refillsRemaining: 5, lastFilled: ts(-9), daysSupply: 10, pharmacyId: WG,
      },
      {
        id: 'med-4', name: 'Omnipod 5 Pods', dosage: '10-pack',
        frequency: 'Monthly', prescriptionNumber: 'Rx #8813051',
        refillsRemaining: 4, lastFilled: ts(-18), daysSupply: 30, pharmacyId: WG,
      },
    ],

    pharmacies: [
      { id: CVS, name: 'CVS Pharmacy', phone: '(415) 842-7700', address: '1420 Market St, San Francisco, CA 94102' },
      { id: WG,  name: 'Walgreens',    phone: '(415) 931-4450', address: '498 Castro St, San Francisco, CA 94114' },
    ],

    // Extended care network (used by dashboard Care Network section)
    prescribers: [
      { id: 'dr-1', name: 'Dr. Anita Patel', specialty: 'Endocrinology', practice: 'UCSF Diabetes Center', phone: '(415) 353-2350', manages: ['med-1','med-2'] },
      { id: 'dr-2', name: 'Dr. James Liu', specialty: 'Primary Care', practice: 'One Medical SF', phone: '(415) 291-1100', manages: ['med-3','med-4'] },
    ],
    devices: [
      { id: 'dev-1', devType: 'CGM Sensor', brand: 'Dexcom', model: 'G7', isPrescription: true, qty: '10', pickupFrequency: '10 days' },
      { id: 'dev-2', devType: 'Insulin Pump Pod', brand: 'Omnipod', model: '5', isPrescription: true, qty: '10', pickupFrequency: 'monthly' },
    ],
    manufacturers: [
      { id: 'mfr-1', name: 'Dexcom Support', phone: '1-888-738-3646' },
      { id: 'mfr-2', name: 'Insulet (Omnipod)', phone: '1-800-591-3455' },
    ],
    insurancePlans: [
      { id: 'ins-1', planName: 'Blue Shield PPO', planType: 'Commercial', memberId: 'BSC291048', groupNumber: 'GRP-40921', phone: '1-800-393-6130', coverageType: 'Medical + Pharmacy' },
    ],

    workflows: [
      // ── needs_approval ──────────────────────────────
      {
        id: 'wf-1', type: 'refill', title: 'Refill Tresiba 100u/mL FlexTouch',
        description: 'Monthly recurring refill — due in 7 days. Approve to schedule automated call.',
        medicationId: 'med-2', medicationName: 'Tresiba',
        pharmacyId: CVS, pharmacyName: 'CVS Pharmacy', pharmacyPhone: '(415) 842-7700',
        status: 'needs_approval', scheduledAt: ts(7), isRecurring: true, recurringInterval: 'monthly',
        createdAt: ts(-1),
      },
      // ── scheduled ────────────────────────────────────
      {
        id: 'wf-2', type: 'refill', title: 'Refill Humalog 100u/mL KwikPen',
        description: 'Monthly recurring refill — Amphelo will call CVS in 4 days.',
        medicationId: 'med-1', medicationName: 'Humalog',
        pharmacyId: CVS, pharmacyName: 'CVS Pharmacy', pharmacyPhone: '(415) 842-7700',
        status: 'scheduled', scheduledAt: ts(4), isRecurring: true, recurringInterval: 'monthly',
        createdAt: ts(-2),
      },
      {
        id: 'wf-3', type: 'refill', title: 'Reorder Dexcom G7 Sensor',
        description: '10-day sensor supply — Amphelo will call Walgreens tomorrow.',
        medicationId: 'med-3', medicationName: 'Dexcom G7 Sensor',
        pharmacyId: WG, pharmacyName: 'Walgreens', pharmacyPhone: '(415) 931-4450',
        status: 'scheduled', scheduledAt: ts(1), isRecurring: true, recurringInterval: 'monthly',
        createdAt: ts(-3),
      },
      // ── failed (action needed) ────────────────────────
      {
        id: 'wf-4', type: 'status_check', title: 'Status check — Omnipod 5 Pods',
        description: 'Ad hoc status check via chat request.',
        medicationId: 'med-4', medicationName: 'Omnipod 5 Pods',
        pharmacyId: WG, pharmacyName: 'Walgreens', pharmacyPhone: '(415) 931-4450',
        status: 'failed', scheduledAt: ts(-2), isRecurring: false,
        notes: 'Call ended before confirmation — pharmacy may be experiencing high call volume. Tap Retry to try again.',
        createdAt: ts(-2),
      },
      // ── appointments (custom / recurring) ────────────
      {
        id: 'wf-8', type: 'custom',
        title: 'Endocrinology: Next appt in 3 months',
        description: 'Quarterly check-in with Dr. Anita Patel — UCSF Diabetes Center',
        status: 'completed', scheduledAt: ts(90), completedAt: ts(-1),
        isRecurring: true,
        notes: 'Confirmed: Next appointment with Dr. Anita Patel on Tuesday, June 9 at 3:30pm. UCSF Diabetes Center, 400 Parnassus Ave, San Francisco.',
        createdAt: ts(-7),
      },
      {
        id: 'wf-9', type: 'custom',
        title: 'Ophthalmology: Annual eye exam due in 10 months',
        description: 'Annual diabetic eye exam — no appointment booked yet',
        status: 'scheduled', scheduledAt: ts(60),
        isRecurring: true,
        notes: 'No appointment booked. To schedule, launch an Ad Hoc Request.',
        createdAt: ts(-1),
      },
      // ── completed ─────────────────────────────────────
      {
        id: 'wf-5', type: 'refill', title: 'Refill Humalog 100u/mL KwikPen',
        description: 'Monthly recurring refill — handled automatically.',
        medicationId: 'med-1', medicationName: 'Humalog',
        pharmacyId: CVS, pharmacyName: 'CVS Pharmacy', pharmacyPhone: '(415) 842-7700',
        status: 'completed', scheduledAt: ts(-30), completedAt: ts(-30, 10, 14),
        notes: 'Confirmed: Humalog 100u/mL KwikPen (Rx #4421089) is ready for pickup at CVS Pharmacy. 3 refills remaining.',
        callId: 'demo-call-1', isRecurring: true, recurringInterval: 'monthly',
        createdAt: ts(-37),
      },
      {
        id: 'wf-6', type: 'refill', title: 'Reorder Dexcom G7 Sensor',
        description: 'Sensor reorder — handled automatically.',
        medicationId: 'med-3', medicationName: 'Dexcom G7 Sensor',
        pharmacyId: WG, pharmacyName: 'Walgreens', pharmacyPhone: '(415) 931-4450',
        status: 'completed', scheduledAt: ts(-10), completedAt: ts(-10, 9, 47),
        notes: 'Confirmed: Dexcom G7 Sensor 10-pack (Rx #8813047) is ready for pickup at Walgreens. 5 refills remaining.',
        callId: 'demo-call-2', isRecurring: true, recurringInterval: 'monthly',
        createdAt: ts(-17),
      },
      {
        id: 'wf-7', type: 'status_check', title: 'Status check — Tresiba',
        description: 'Ad hoc status check requested via chat.',
        medicationId: 'med-2', medicationName: 'Tresiba',
        pharmacyId: CVS, pharmacyName: 'CVS Pharmacy', pharmacyPhone: '(415) 842-7700',
        status: 'completed', scheduledAt: ts(-5), completedAt: ts(-5, 14, 22),
        notes: 'CVS confirmed Tresiba refill is on hold pending prescriber reauthorization. Dr. Patel\'s office has been notified. Expected turnaround: 1–2 business days.',
        callId: 'demo-call-3', isRecurring: false,
        createdAt: ts(-5),
      },
    ],

    messages: [
      {
        id: 'msg-welcome', role: 'assistant', timestamp: ts(-5, 14, 0),
        content: "Hi Audrey! I'm your Amphelo care coordinator. I can request prescription refills, check statuses, and handle any pharmacy needs on your behalf. What can I help you with today?",
      },
      {
        id: 'msg-u1', role: 'user', timestamp: ts(-5, 14, 2),
        content: 'Can you check the status of my Tresiba at CVS?',
      },
      {
        id: 'msg-a1', role: 'assistant', timestamp: ts(-5, 14, 2),
        content: 'On it — checking your Tresiba prescription status at CVS Pharmacy now.',
        callStatus: 'initiating',
      },
      {
        id: 'msg-a2', role: 'assistant', timestamp: ts(-5, 14, 3),
        callId: 'demo-call-3', workflowId: 'wf-7',
        content: 'Status check placed with CVS Pharmacy. I\'ll update you here as soon as the call completes.',
        callStatus: 'in_progress',
      },
      {
        id: 'msg-a3', role: 'assistant', timestamp: ts(-5, 14, 22),
        workflowId: 'wf-7', callStatus: 'completed',
        content: '✅ Call to CVS Pharmacy completed. CVS confirmed Tresiba refill is on hold pending prescriber reauthorization. Dr. Patel\'s office has been notified — expected turnaround 1–2 business days.',
      },
    ],
  }

  clearState()
  if (typeof window !== 'undefined') {
    localStorage.setItem('healthcare_app_state', JSON.stringify(state))
  }
}
