import { requireAuth } from "@/app/_lib/auth/session";
import DashboardLayout from "@/app/_components/dashboard-layout";
import { ContactListsGrid } from "@/app/_components/contact-lists-grid";
import { CreateContactListDialog } from "@/app/_components/create-contact-list-dialog";
import { Button } from "@/app/_components/ui/button";
import prisma from "@/app/_lib/db/prisma";
import { Plus, Users } from "lucide-react";

async function getContactLists(userId: string) {
  return await prisma.contactList.findMany({
    where: { createdBy: userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { emailHistory: true },
      },
    },
  });
}

export default async function ContactListsPage() {
  const user = await requireAuth();
  const contactLists = await getContactLists(user.id);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contact Lists</h1>
            <p className="text-gray-600 mt-1">
              Manage your email contact lists and recipients
            </p>
          </div>
          <CreateContactListDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create List
            </Button>
          </CreateContactListDialog>
        </div>

        {/* Contact Lists Grid */}
        {contactLists.length > 0 ? (
          <ContactListsGrid contactLists={contactLists} />
        ) : (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No contact lists yet
            </h3>
            <p className="mt-2 text-gray-500">
              Create your first contact list to start sending emails to your
              audience.
            </p>
            <div className="mt-6">
              <CreateContactListDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First List
                </Button>
              </CreateContactListDialog>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
