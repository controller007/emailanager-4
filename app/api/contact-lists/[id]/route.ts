import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/_lib/auth/session";
import { contactListSchema } from "@/app/_lib/validations/email";
import prisma from "@/app/_lib/db/prisma";
import { resend } from "@/app/_lib/email/resend-client";


function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validationResult = contactListSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: validationResult.error.errors[0].message },
      { status: 400 }
    );
  }

  const { name, emails } = validationResult.data;

  // Check list exists
  const existingList = await prisma.contactList.findFirst({
    where: { id: params.id, createdBy: session.user.id },
  });

  if (!existingList) {
    return NextResponse.json({ error: "Contact list not found" }, { status: 404 });
  }

  let audienceId = existingList.audienceId;

  // // If no audience in Resend yet, create one
  // if (!audienceId) {
  //   const newAudience = await resend.audiences.create({ name });
  //   audienceId = newAudience.data?.id as string;
  // } else {
  //   // (Optional) update audience name if changed
  //   await resend.audiences.update(audienceId, { name });
  // }

  // 1. Fetch existing contacts in this audience
  const existingContactsRes = await resend.contacts.list({ audienceId });
  const existingEmails = existingContactsRes.data?.data?.map((c: any) => c.email) || [];

  const toAdd = emails.filter((e: string) => !existingEmails.includes(e));

  const toRemove = existingEmails.filter((e: string) => !emails.includes(e));

  for (const email of toAdd) {
    try {
      await resend.contacts.create({ email, audienceId });
      await sleep(600); 
    } catch (err) {
      console.error(`Error adding ${email}:`, err);
    }
  }

  for (const email of toRemove) {
    try {
      await resend.contacts.remove({ email, audienceId });
      await sleep(600);
    } catch (err) {
      console.error(`Error removing ${email}:`, err);
    }
  }

  const updatedContactList = await prisma.contactList.update({
    where: { id: params.id },
    data: { name, emails, audienceId },
  });

  return NextResponse.json(updatedContactList);
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingList = await prisma.contactList.findFirst({
      where: {
        id: params.id,
        createdBy: session.user.id,
      },
    });

    if (!existingList) {
      return NextResponse.json(
        { error: "Contact list not found" },
        { status: 404 }
      );
    }

    if (existingList.audienceId) {
      try {
        await resend.audiences.remove(existingList.audienceId);
      } catch (err) {
        console.warn("Failed to remove audience in Resend:", err);
      }
    }

    await prisma.contactList.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
