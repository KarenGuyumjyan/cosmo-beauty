import { NextRequest, NextResponse } from 'next/server'
import { sendOrderEmail } from '@/lib/email/send-order-email'

export async function POST(req: NextRequest) {
  try {
    const { email, trackingLink } = await req.json()

    await sendOrderEmail({ email, trackingLink })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send email.',
      },
      { status: 500 },
    )
  }
}
