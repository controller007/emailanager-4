"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";
import {
  Mail,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface EmailDetailDialogProps {
  children: React.ReactNode;
  email: {
    id: string;
    subject: string;
    body: string;
    sentCount: number;
    deliveredCount: number;
    openedCount: number;
    failedCount: number;
    createdAt: Date;
    contactList: {
      name: string;
    };
  };
}

export function EmailDetailDialog({ children, email }: EmailDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Mail className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // const refreshStatus = async () => {
  //   setIsRefreshing(true);
  //   try {
  //     await fetch(`/api/email-history?id=${email.id}`, {
  //       method: "PATCH",
  //     });
  //     router.refresh();
  //   } catch (error) {
  //     console.error("Failed to refresh status:", error);
  //   } finally {
  //     setIsRefreshing(false);
  //   }
  // };

  const deliveryRate =
    email.sentCount > 0
      ? Math.round((email.deliveredCount / email.sentCount) * 100)
      : 0;
  const openRate =
    email.deliveredCount > 0
      ? Math.round((email.openedCount / email.deliveredCount) * 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold text-gray-900 pr-4">
                {email.subject}
              </DialogTitle>
              <DialogDescription className="mt-2">
                Campaign details and performance metrics
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* <Badge className={`${getStatusColor(email.status)} flex items-center gap-1`}>
                {getStatusIcon(email.status)}
                {email.status}
              </Badge> */}
              {/* <Button
                variant="outline"
                size="sm"
                onClick={refreshStatus}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button> */}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Campaign Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campaign Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Contact List
                    </label>
                    <p className="text-sm text-gray-900">
                      {email.contactList.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Sent Date
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(email.createdAt).toLocaleDateString()} at{" "}
                      {new Date(email.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {email.sentCount}
                    </div>
                    <div className="text-sm text-blue-600 mt-1">Sent</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {email.deliveredCount}
                    </div>
                    <div className="text-sm text-green-600 mt-1">Delivered</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">
                      {email.openedCount}
                    </div>
                    <div className="text-sm text-purple-600 mt-1">Opened</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">
                      {email.failedCount}
                    </div>
                    <div className="text-sm text-red-600 mt-1">Failed</div>
                  </div>
                </div>

                {/* Rates */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border border-gray-200 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {deliveryRate}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Delivery Rate
                    </div>
                  </div>
                  <div className="text-center p-4 border border-gray-200 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {openRate}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Open Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Subject Line
                    </label>
                    <p className="text-lg font-medium text-gray-900 mt-1">
                      {email.subject}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium   text-gray-600">
                      Email Body
                    </label>
                    <div className="mt-2 p-4 border border-gray-200  rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
                      <div
                        className="prose prose-sm max-w-none tiptap-content"
                        dangerouslySetInnerHTML={{ __html: email.body }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Detailed Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Performance Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">
                        {deliveryRate}%
                      </div>
                      <div className="text-sm text-blue-600 mt-1">
                        Delivery Success
                      </div>
                      <div className="text-xs text-blue-500 mt-1">
                        {email.deliveredCount} of {email.sentCount} delivered
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">
                        {openRate}%
                      </div>
                      <div className="text-sm text-purple-600 mt-1">
                        Open Rate
                      </div>
                      <div className="text-xs text-purple-500 mt-1">
                        {email.openedCount} of {email.deliveredCount} opened
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                      <div className="text-2xl font-bold text-red-700">
                        {email.sentCount > 0
                          ? Math.round(
                              (email.failedCount / email.sentCount) * 100
                            )
                          : 0}
                        %
                      </div>
                      <div className="text-sm text-red-600 mt-1">
                        Failure Rate
                      </div>
                      <div className="text-xs text-red-500 mt-1">
                        {email.failedCount} failed deliveries
                      </div>
                    </div>
                  </div>

                  {/* Engagement Insights */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">
                      Engagement Insights
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Total Recipients</span>
                        <span className="font-medium">{email.sentCount}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">
                          Successful Deliveries
                        </span>
                        <span className="font-medium text-green-600">
                          {email.deliveredCount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Email Opens</span>
                        <span className="font-medium text-purple-600">
                          {email.openedCount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Failed Deliveries</span>
                        <span className="font-medium text-red-600">
                          {email.failedCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
