import { requireAuth } from "@/app/_lib/auth/session";
import DashboardLayout from "@/app/_components/dashboard-layout";
import { EmailComposer } from "@/app/_components/email-composer";
import prisma from "@/app/_lib/db/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Users, Plus } from "lucide-react";
import Link from "next/link";

async function getContactLists(userId: string) {
  return await prisma.contactList.findMany({
    where: {
      createdBy: userId,
      emails: {
        isEmpty: false,
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      emails: true,
      createdAt: true,
    },
  });
}

export default async function SendEmailPage() {
  const user = await requireAuth();
  const contactLists = await getContactLists(user.id);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Send Email</h1>
            <p className="text-gray-600 mt-1">
              Compose and send emails to your contact lists
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/contact-lists">
              <Users className="mr-2 h-4 w-4" />
              Manage Lists
            </Link>
          </Button>
        </div>

        {/* Email Composer */}
        {contactLists.length > 0 ? (
          <EmailComposer contactLists={contactLists} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Contact Lists Available</CardTitle>
              <CardDescription>
                You need to create at least one contact list with email
                addresses before you can send emails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Create your first contact list
                </h3>
                <p className="mt-2 text-gray-500">
                  Start by adding email addresses to a contact list, then return
                  here to send your first campaign.
                </p>
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/contact-lists">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Contact List
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
