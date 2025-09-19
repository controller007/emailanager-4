import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/_lib/auth/session";
import { emailComposeSchema } from "@/app/_lib/validations/email";
import {
  resend,
  emailConfig,
  generateEmailTemplate,
} from "@/app/_lib/email/resend-client";
import prisma from "@/app/_lib/db/prisma";
    function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

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
    if (contactList.emails.length === 0) {
      return NextResponse.json(
        { error: "Contact list is empty" },
        { status: 400 }
      );
    }

    // Create email history record
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


    let failedCount=0
    for (const email of contactList.emails) {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: email, // send to one email
        subject,
        html: htmlContent,
        tags: [
          {
            name: "emailHistoryId", // removed leading space
            value: emailHistory.id,
          },
        ],
      });

      if (error) {
       failedCount++
      }

      // Sleep 600 ms before next send
      await sleep(600);
    }

    if (failedCount>0) {
      await prisma.emailHistory.update({
        where: { id: emailHistory.id },
        data: { failedCount },
      });
      return NextResponse.json(
        { error: "Failed to send emails" },
        { status: 500 }
      );
    }

    // Save recipients + update counts
    await prisma.$transaction([
      prisma.emailHistory.update({
        where: { id: emailHistory.id },
        data: {
          sentCount: contactList.emails.length,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      emailHistoryId: emailHistory.id,
      recipientCount: contactList.emails.length,
      successCount: contactList.emails.length,
      failedCount: 0,
      message: `Email sent to ${contactList.emails.length} recipients`,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
