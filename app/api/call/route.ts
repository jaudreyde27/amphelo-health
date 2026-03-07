import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const {
    pharmacyPhone,
    patientName,
    patientDOB,
    patientPhone,
    medicationName,
    medicationDosage,
    prescriptionNumber,
    workflowType,
  } = await req.json()

  const apiKey      = process.env.VAPI_API_KEY
  const assistantId = process.env.VAPI_ASSISTANT_ID
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID

  if (!apiKey || !assistantId || !phoneNumberId) {
    return NextResponse.json({ error: 'Missing Vapi configuration' }, { status: 500 })
  }

  if (!pharmacyPhone) {
    return NextResponse.json({ error: 'Pharmacy phone number required' }, { status: 400 })
  }

  // Normalize phone: ensure E.164 format (+1XXXXXXXXXX)
  const normalizePhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 10) return `+1${digits}`
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
    return `+${digits}`
  }

  const body = {
    phoneNumberId,
    assistantId,
    customer: {
      number: normalizePhone(pharmacyPhone),
    },
    assistantOverrides: {
      variableValues: {
        patientName:        patientName        ?? '',
        patientDOB:         patientDOB         ?? '',
        patientPhone:       patientPhone       ?? '',
        medicationName:     medicationName     ?? '',
        medicationDosage:   medicationDosage   ?? '',
        prescriptionNumber: prescriptionNumber ?? '',
        workflowType:       workflowType       ?? 'refill',
      },
    },
  }

  try {
    const res = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Vapi error:', data)
      return NextResponse.json({ error: data.message ?? 'Vapi API error' }, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Call error:', err)
    return NextResponse.json({ error: 'Failed to initiate call' }, { status: 500 })
  }
}
