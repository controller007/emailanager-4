import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/app/_lib/auth/session"
import { contactListSchema } from "@/app/_lib/validations/email"
import prisma from "@/app/_lib/db/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = contactListSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.errors[0].message }, { status: 400 })
    }

    const { name, emails } = validationResult.data

    const contactList = await prisma.contactList.create({
      data: {
        name,
        emails,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json(contactList, { status: 201 })
  } catch (error) {
    console.error("Error creating contact list:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contactLists = await prisma.contactList.findMany({
      where: { createdBy: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { emailHistory: true },
        },
      },
    })

    return NextResponse.json(contactLists)
  } catch (error) {
    console.error("Error fetching contact lists:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
