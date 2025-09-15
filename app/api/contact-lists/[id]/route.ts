import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/app/_lib/auth/session"
import { contactListSchema } from "@/app/_lib/validations/email"
import prisma from "@/app/_lib/db/prisma"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if the contact list exists and belongs to the user
    const existingList = await prisma.contactList.findFirst({
      where: {
        id: params.id,
        createdBy: session.user.id,
      },
    })

    if (!existingList) {
      return NextResponse.json({ error: "Contact list not found" }, { status: 404 })
    }

    const updatedContactList = await prisma.contactList.update({
      where: { id: params.id },
      data: {
        name,
        emails,
      },
    })

    return NextResponse.json(updatedContactList)
  } catch (error) {
    console.error("Error updating contact list:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the contact list exists and belongs to the user
    const existingList = await prisma.contactList.findFirst({
      where: {
        id: params.id,
        createdBy: session.user.id,
      },
    })

    if (!existingList) {
      return NextResponse.json({ error: "Contact list not found" }, { status: 404 })
    }

    // Delete the contact list (this will cascade delete email history)
    await prisma.contactList.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting contact list:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
