import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/_lib/auth/session";
import { contactListSchema } from "@/app/_lib/validations/email";
import prisma from "@/app/_lib/db/prisma";
import { resend } from "@/app/_lib/email/resend-client";
import PQueue from "p-queue";

const queue = new PQueue({
  interval: 1000,
  intervalCap: 2,
  carryoverConcurrencyCount: true,
  concurrency: 1,
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { name, emails } = contactListSchema.parse(body);
  const audience = await resend.audiences.create({ name });
  const contactList = await prisma.contactList.create({
    data: {
      name,
      emails,
      totalEmails: emails.length,
      processedEmails: 0,
      createdBy: session.user.id,
      audienceId: audience.data?.id!,
      status: "pending",
    },
  });
  return NextResponse.json(contactList, { status: 201 });
}

export async function PUT() {
  const lists = await prisma.contactList.findMany({
    where: { status: { not: "completed" } },
    take: 1,
  });

  const results = await Promise.allSettled(
    lists.map((list) => processBatch(list.id))
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({
    processed: lists.length,
    successful,
    failed,
    message: "Batch processing completed",
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const contactLists = await prisma.contactList.findMany({
      where: { createdBy: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { emailHistory: true },
        },
      },
    });
    return NextResponse.json(contactLists);
  } catch (error) {
    console.error("Error fetching contact lists:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function processBatch(contactListId: string, batchSize = 50) {
  const list = await prisma.contactList.findUnique({
    where: { id: contactListId },
  });
  if (!list || list.status === "completed") return;

  const nextBatch = list.emails.slice(
    list.processedEmails,
    list.processedEmails + batchSize
  );
  if (nextBatch.length === 0) return;

  await prisma.contactList.update({
    where: { id: contactListId },
    data: { status: "in_progress" },
  });

  const emailPromises = nextBatch.map((email) =>
    queue.add(async () => {
      let attempts = 0;
      while (attempts < 3) {
        try {
          const res = await resend.contacts.create({
            email,
            audienceId: list.audienceId!,
          });
          if (res.error) throw new Error(res.error.message || "Unknown error");
          console.log(`Added ${email} to audience ${list.audienceId}`);
          
          const updated = await prisma.contactList.update({
            where: { id: contactListId },
            data: {
              processedEmails: { increment: 1 },
            },
          });

          if (updated.processedEmails >= updated.totalEmails) {
            await prisma.contactList.update({
              where: { id: contactListId },
              data: { status: "completed" },
            });
          }
          
          return { success: true, email };
        } catch (err) {
          attempts++;
          console.error(`Error adding ${email}, attempt ${attempts}:`, err);
          if (attempts >= 3) {
            console.error(`Giving up on ${email} after 3 retries`);
            return { success: false, email, error: err };
          }
        }
      }
    })
  );

  await Promise.allSettled(emailPromises);
  
  return "Batch completed";
}