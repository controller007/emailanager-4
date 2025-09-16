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

    let successCount = 0;
    let failedCount = 0;
    const resendIds: string[] = [];

    for (const recipient of contactList.emails) {
      try {
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: recipient,
          subject,
          html: htmlContent,
          tags: [
            {
              name: "emailHistoryId",
              value: emailHistory.id.toString(),
            },
          ],
        });

        if (error) {
          console.error(`Failed to send email to ${recipient}:`, error);
          failedCount++;
        } else {
          successCount++;
          if (data?.id) resendIds.push(data.id);
        }
      } catch (err) {
        console.error(`Error sending to ${recipient}:`, err);
        failedCount++;
      }

      await sleep(100);
    }

    await prisma.emailHistory.update({
      where: { id: emailHistory.id },
      data: {
        sentCount: successCount,
        failedCount,
        resendIds,
      },
    });

    return NextResponse.json({
      success: true,
      emailHistoryId: emailHistory.id,
      recipientCount: contactList.emails.length,
      successCount,
      failedCount,
      message: `Personalized emails sent: ${successCount} success, ${failedCount} failed`,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
