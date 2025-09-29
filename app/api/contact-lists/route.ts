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

  // 1. Create audience in Resend
  const audience = await resend.audiences.create({ name });

  // 2. Save contact list
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

  // 3. Start first batch in background
  console.log("first batch \n\n");

  await processBatch(contactList.id);
  console.log("processed first... 000");
  processBatch(contactList.id).catch((err) =>
    console.error("Batch processing failed:", err)
  );

  return NextResponse.json(contactList, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const list = await prisma.contactList.findUnique({
    where: { id },
  });

  if (!list) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
console.log("awaiting");

  await processBatch(list.id);
  console.log("processed batch");
  
  const updated = await prisma.contactList.findUnique({
    where: { id: list.id },
  });

  return NextResponse.json(updated);
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
  const list = await prisma.contactList.findUnique({ where: { id: contactListId } });
  if (!list || list.status === "completed") return;

  const nextBatch = list.emails.slice(
    list.processedEmails,
    list.processedEmails + batchSize
  );

  console.log(nextBatch,"his is the nest natch",list.processedEmails);
  

  if (nextBatch.length === 0) return;

  let processed = 0;

  await Promise.all(
    nextBatch.map((email) =>
      queue.add(
        async () => {
          let attempts = 0;
          while (attempts < 3) {
            try {
              const res = await resend.contacts.create({
                email,
                audienceId: list.audienceId!,
              });

              if (res.error) {
                throw new Error(res.error.message || "Unknown error");
              }

              console.log(`Added ${email} to audience ${list.audienceId}`);
              return;
            } catch (err) {
              attempts++;
              console.error(`Error adding ${email}, attempt ${attempts}:`, err);
              if (attempts >= 3) {
                console.error(`Giving up on ${email} after 3 retries`);
              }
            }
          }
        },
        { priority: 1 }
      ).then(() => processed++)
    )
  );

  const newProcessed = list.processedEmails + processed;
  const isCompleted = newProcessed >= list.totalEmails;

  await prisma.contactList.update({
    where: { id: contactListId },
    data: {
      processedEmails: newProcessed,
      status: isCompleted ? "completed" : "in_progress",
    },
  });
}
