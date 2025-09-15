"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card"
import { Button } from "@/app/_components/ui/button"
import { Badge } from "@/app/_components/ui/badge"
import { EditContactListDialog } from "./edit-contact-list-dialog"
import { DeleteContactListDialog } from "./delete-contact-list-dialog"
import { Users, Mail, Edit, Trash2, Calendar } from "lucide-react"
import type { ContactList } from "@prisma/client"

interface ContactListWithCount extends ContactList {
  _count: {
    emailHistory: number
  }
}

interface ContactListsGridProps {
  contactLists: ContactListWithCount[]
}

export function ContactListsGrid({ contactLists }: ContactListsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {contactLists.map((list) => (
        <Card key={list.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">{list.name}</CardTitle>
              <div className="flex items-center space-x-1">
                <EditContactListDialog contactList={list}>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </EditContactListDialog>
                <DeleteContactListDialog contactList={list}>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DeleteContactListDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {list.emails.length} contact{list.emails.length !== 1 ? "s" : ""}
                </span>
              </div>
              <Badge variant={list.emails.length > 0 ? "default" : "secondary"}>
                {list.emails.length > 0 ? "Active" : "Empty"}
              </Badge>
            </div>

            {/* Email campaigns count */}
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {list._count.emailHistory} campaign{list._count.emailHistory !== 1 ? "s" : ""} sent
              </span>
            </div>

            {/* Created date */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Created {new Date(list.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Email preview */}
            {list.emails.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-500 mb-1">Sample contacts:</p>
                <div className="space-y-1">
                  {list.emails.slice(0, 3).map((email, index) => (
                    <p key={index} className="text-xs text-gray-700 truncate">
                      {email}
                    </p>
                  ))}
                  {list.emails.length > 3 && <p className="text-xs text-gray-500">+{list.emails.length - 3} more...</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
