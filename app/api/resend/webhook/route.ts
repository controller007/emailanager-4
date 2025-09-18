import { NextRequest, NextResponse } from "next/server"
import prisma from "@/app/_lib/db/prisma"

export async function POST(req: NextRequest) {
  try {
    const event = await req.json()
    const { type, data } = event
    const { broadcast_id: broadcastId} = data



    if (!broadcastId) {
      console.warn("Webhook: Missing broadcast_id ")
      return NextResponse.json({ ok: true })
    }

    const emailHistory = await prisma.emailHistory.findFirst({
      where: { broadcastId },
    })

    if (!emailHistory) {
      console.warn(`Webhook: No EmailHistory found for id ${broadcastId}`)
      return NextResponse.json({ ok: true })
    }

    let updateData: Record<string, any> = {}
    let recipientStatus = ""

    switch (type) {
      case "email.delivered":
        updateData = { deliveredCount: { increment: 1 } }
        recipientStatus = "delivered"
        break
      case "email.opened":
        updateData = { openedCount: { increment: 1 } }
        recipientStatus = "opened"
        break
      case "email.clicked":
        updateData = { openedCount: { increment: 1 } }
        recipientStatus = "clicked"
        break
      case "email.bounced":
      case "email.failed":
        updateData = { failedCount: { increment: 1 } }
        recipientStatus = "failed"
        break
      default:
        console.log("Unhandled event type:", type)
        return NextResponse.json({ ok: true })
    }

    await prisma.emailHistory.update({
      where: { id: emailHistory.id },
      data: updateData,
    })

    console.log(`Webhook updated  (broadCastId=${broadcastId}) → ${recipientStatus}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Webhook error:", err)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}
