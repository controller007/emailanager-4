import { requireAuth } from "@/app/_lib/auth/session"
import DashboardLayout from "@/app/_components/dashboard-layout"
import { StatsCard } from "@/app/_components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card"
import { Button } from "@/app/_components/ui/button"
import prisma from "@/app/_lib/db/prisma"
import Link from "next/link"
import { Mail, Send, CheckCircle, Eye, AlertCircle, Users, Plus, ArrowRight } from "lucide-react"

async function getDashboardStats(userId: string) {
  // Get email statistics
  const emailStats = await prisma.emailHistory.aggregate({
    where: { userId },
    _sum: {
      sentCount: true,
      deliveredCount: true,
      openedCount: true,
      failedCount: true,
    },
    _count: {
      id: true,
    },
  })

  // Get contact lists count
  const contactListsCount = await prisma.contactList.count({
    where: { createdBy: userId },
  })

  // Get recent emails
  const recentEmails = await prisma.emailHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      contactList: {
        select: { name: true },
      },
    },
  })

  return {
    totalEmails: emailStats._count.id || 0,
    sentCount: emailStats._sum.sentCount || 0,
    deliveredCount: emailStats._sum.deliveredCount || 0,
    openedCount: emailStats._sum.openedCount || 0,
    failedCount: emailStats._sum.failedCount || 0,
    contactListsCount,
    recentEmails,
  }
}

export default async function DashboardPage() {
  const user = await requireAuth()
  const stats = await getDashboardStats(user.id)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.firstName || user.email}</p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/contact-lists">
                <Users className="mr-2 h-4 w-4" />
                Manage Lists
              </Link>
            </Button>
            <Button asChild>
              <Link href="/send-email">
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Total Emails" value={stats.totalEmails} icon={Mail} description="Total campaigns sent" />
          <StatsCard title="Emails Sent" value={stats.sentCount} icon={Send} description="Successfully sent emails" />
          <StatsCard title="Delivered" value={stats.deliveredCount} icon={CheckCircle} description="Emails delivered" />
          <StatsCard title="Opened" value={stats.openedCount} icon={Eye} description="Emails opened by recipients" />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard title="Failed" value={stats.failedCount} icon={AlertCircle} description="Failed deliveries" />
          <StatsCard
            title="Contact Lists"
            value={stats.contactListsCount}
            icon={Users}
            description="Active contact lists"
          />
          <StatsCard
            title="Open Rate"
            value={stats.deliveredCount > 0 ? `${Math.round((stats.openedCount / stats.deliveredCount) * 100)}%` : "0%"}
            icon={Eye}
            description="Email open rate"
          />
        </div>

        {/* Recent Emails */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Email Campaigns</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/email-history">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentEmails.length > 0 ? (
              <div className="space-y-4">
                {stats.recentEmails.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{email.subject}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Sent to: {email.contactList.name} • {email.sentCount} recipients
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(email.createdAt).toLocaleDateString()} at{" "}
                        {new Date(email.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{email.deliveredCount}</div>
                        <div className="text-gray-500">Delivered</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{email.openedCount}</div>
                        <div className="text-gray-500">Opened</div>
                      </div>
                      {/* <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          email.sentCount >0
                            ? "bg-green-100 text-green-800"
                            : email.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : email.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {email.status}
                      </div> */}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No emails sent yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a contact list and sending your first email.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button asChild>
                    <Link href="/contact-lists">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Contact List
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/send-email">
                      <Send className="mr-2 h-4 w-4" />
                      Send Email
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
