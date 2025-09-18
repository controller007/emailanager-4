import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/_lib/auth/session";
import { emailComposeSchema } from "@/app/_lib/validations/email";
import {
  resend,
  emailConfig,
  generateEmailTemplate,
} from "@/app/_lib/email/resend-client";
import prisma from "@/app/_lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = emailComposeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { subject, body: emailBody, contactListId } = validationResult.data;

    const contactList = await prisma.contactList.findFirst({
      where: { id: contactListId, createdBy: session.user.id },
    });

    if (!contactList) {
      return NextResponse.json(
        { error: "Contact list not found" },
        { status: 404 }
      );
    }

    if (!contactList.audienceId) {
      return NextResponse.json(
        { error: "Contact list is not linked to a Resend audience" },
        { status: 400 }
      );
    }

    if (contactList.emails.length === 0) {
      return NextResponse.json(
        { error: "Contact list is empty" },
        { status: 400 }
      );
    }

    const emailHistory = await prisma.emailHistory.create({
      data: {
        subject,
        body: emailBody,
        contactListId,
        userId: session.user.id,
      },
    });

    const htmlContent = generateEmailTemplate(emailBody, subject);
    const fromEmail = `${emailConfig.fromName} <${emailConfig.user}>`;

    const broadcast = await resend.broadcasts.create({
      name: `Broadcast-${emailHistory.id}`,
      audienceId: contactList.audienceId,
      from: fromEmail,
      subject,
      html: htmlContent,
    });

    await resend.broadcasts.send(broadcast.data?.id as string)

    await prisma.emailHistory.update({
      where: { id: emailHistory.id },
      data: {
        resendIds: [broadcast.data?.id as string],
        sentCount: contactList.emails.length,
        failedCount: 0,
      },
    });

    return NextResponse.json({
      success: true,
      emailHistoryId: emailHistory.id,
      broadcastId: broadcast.data?.id as string,
      audienceId: contactList.audienceId,
      recipientCount: contactList.emails.length,
      message: `Broadcast created for ${contactList.emails.length} recipients.`,
    });
  } catch (error) {
    console.error("Error sending broadcast:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
