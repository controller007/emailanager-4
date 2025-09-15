"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { Label } from "@/app/_components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select"
import { Alert, AlertDescription } from "@/app/_components/ui/alert"
import { Badge } from "@/app/_components/ui/badge"
import RichTextEditor from "./rich-text-editor"
import { emailComposeSchema } from "@/app/_lib/validations/email"
import { AlertCircle, Send, Eye, Users, Mail } from "lucide-react"

interface ContactList {
  id: string
  name: string
  emails: string[]
  createdAt: Date
}

interface EmailComposerProps {
  contactLists: ContactList[]
}

export function EmailComposer({ contactLists }: EmailComposerProps) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [selectedListId, setSelectedListId] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter()

  const selectedList = contactLists.find((list) => list.id === selectedListId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const validationResult = emailComposeSchema.safeParse({
        subject: subject.trim(),
        body: body.trim(),
        contactListId: selectedListId,
      })

      if (!validationResult.success) {
        setError(validationResult.error.errors[0].message)
        return
      }

      setIsLoading(true)

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationResult.data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send email")
      }

      setSuccess(`Email campaign sent successfully to ${result.recipientCount} recipients!`)
      setSubject("")
      setBody("")
      setSelectedListId("")

      // Redirect to email history after a short delay
      setTimeout(() => {
        router.push("/email-history")
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const togglePreview = () => {
    setShowPreview(!showPreview)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Email Composer Form */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>Create and send your email campaign to a contact list</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <Mail className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {/* Contact List Selection */}
              <div className="space-y-2">
                <Label htmlFor="contactList">Select Contact List</Label>
                <Select value={selectedListId} onValueChange={setSelectedListId} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a contact list to send to" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{list.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {list.emails.length} contacts
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedList && (
                  <p className="text-sm text-gray-500">
                    This email will be sent to {selectedList.emails.length} recipient
                    {selectedList.emails.length !== 1 ? "s" : ""} in "{selectedList.name}"
                  </p>
                )}
              </div>

              {/* Subject Line */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  placeholder="Enter your email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  disabled={isLoading}
                  maxLength={200}
                />
                <p className="text-sm text-gray-500">{subject.length}/200 characters</p>
              </div>

              {/* Email Body */}
              <div className="space-y-2">
                <Label htmlFor="body">Email Content</Label>
                <RichTextEditor content={body} onChange={setBody} placeholder="Write your email content here..." />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={togglePreview}
                  disabled={!subject || !body || !selectedListId}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showPreview ? "Hide Preview" : "Preview Email"}
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading || !subject || !body || !selectedListId}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Selected List Info */}
        {selectedList && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selected List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">{selectedList.name}</h3>
                <p className="text-sm text-gray-500">Created {new Date(selectedList.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {selectedList.emails.length} recipient{selectedList.emails.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Sample Recipients:</Label>
                <div className="space-y-1">
                  {selectedList.emails.slice(0, 5).map((email, index) => (
                    <p key={index} className="text-xs text-gray-600 truncate">
                      {email}
                    </p>
                  ))}
                  {selectedList.emails.length > 5 && (
                    <p className="text-xs text-gray-500">+{selectedList.emails.length - 5} more...</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Preview */}
        {showPreview && subject && body && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Preview</CardTitle>
              <CardDescription>How your email will appear to recipients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white">
                <div className="border-b pb-3 mb-3">
                  <h3 className="font-semibold text-gray-900">{subject}</h3>
                  <p className="text-sm text-gray-500">From: Email Management Platform</p>
                </div>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: body }} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Email Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900">Subject Line</h4>
              <p>Keep it concise and compelling. Avoid spam trigger words.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Content</h4>
              <p>Use clear formatting and include a call-to-action.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Testing</h4>
              <p>Preview your email before sending to ensure proper formatting.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
