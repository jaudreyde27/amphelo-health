import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const callId = req.nextUrl.searchParams.get('id')
  if (!callId) return NextResponse.json({ error: 'Missing call id' }, { status: 400 })

  const apiKey = process.env.VAPI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Missing Vapi configuration' }, { status: 500 })

  try {
    const res = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.message ?? 'Vapi error' }, { status: res.status })

    // Map Vapi status → our WorkflowStatus
    const vapiStatus: string = data.status ?? ''
    let status: 'in_progress' | 'completed' | 'failed' = 'in_progress'
    if (['ended'].includes(vapiStatus)) status = 'completed'
    else if (['failed', 'error'].includes(vapiStatus)) status = 'failed'

    return NextResponse.json({
      status,
      vapiStatus,
      transcript: data.transcript ?? null,
      summary: data.summary ?? null,
      endedReason: data.endedReason ?? null,
      startedAt: data.startedAt ?? null,
      endedAt: data.endedAt ?? null,
      duration: data.costBreakdown?.duration ?? null,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch call status' }, { status: 500 })
  }
}
