"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { Label } from "@/app/_components/ui/label"
import { Textarea } from "@/app/_components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog"
import { Alert, AlertDescription } from "@/app/_components/ui/alert"
import { Badge } from "@/app/_components/ui/badge"
import { contactListSchema } from "@/app/_lib/validations/email"
import { AlertCircle, X, Plus } from "lucide-react"

interface CreateContactListDialogProps {
  children: React.ReactNode
}

export function CreateContactListDialog({ children }: CreateContactListDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [emailsInput, setEmailsInput] = useState("")
  const [validEmails, setValidEmails] = useState<string[]>([])
  const [invalidEmails, setInvalidEmails] = useState<string[]>([])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const validateEmails = (input: string) => {
    if (!input.trim()) {
      setValidEmails([])
      setInvalidEmails([])
      return
    }

    const emails = input
      .split(/[,\n]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0)

    const valid: string[] = []
    const invalid: string[] = []

    emails.forEach((email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (emailRegex.test(email)) {
        if (!valid.includes(email)) {
          valid.push(email)
        }
      } else {
        if (!invalid.includes(email)) {
          invalid.push(email)
        }
      }
    })

    setValidEmails(valid)
    setInvalidEmails(invalid)
  }

  const handleEmailsInputChange = (value: string) => {
    setEmailsInput(value)
    validateEmails(value)
  }

  const removeInvalidEmail = (emailToRemove: string) => {
    const updatedInput = emailsInput
      .split(/[,\n]/)
      .map((email) => email.trim())
      .filter((email) => email !== emailToRemove)
      .join(", ")

    setEmailsInput(updatedInput)
    validateEmails(updatedInput)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (invalidEmails.length > 0) {
      setError("Please remove or fix invalid email addresses before saving.")
      return
    }

    try {
      const validationResult = contactListSchema.safeParse({
        name: name.trim(),
        emails: validEmails,
      })

      if (!validationResult.success) {
        setError(validationResult.error.errors[0].message)
        return
      }

      setIsLoading(true)

      const response = await fetch("/api/contact-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationResult.data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create contact list")
      }

      setOpen(false)
      setName("")
      setEmailsInput("")
      setValidEmails([])
      setInvalidEmails([])
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Contact List</DialogTitle>
          <DialogDescription>
            Create a new contact list to organize your email recipients. You can add up to 100 email addresses.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">List Name</Label>
            <Input
              id="name"
              placeholder="e.g., Newsletter Subscribers, VIP Customers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emails">Email Addresses</Label>
            <Textarea
              id="emails"
              placeholder="Enter email addresses separated by commas or new lines&#10;example@domain.com, user@company.com&#10;another@email.com"
              value={emailsInput}
              onChange={(e) => handleEmailsInputChange(e.target.value)}
              rows={6}
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              Separate multiple emails with commas or new lines. Maximum 100 emails per list.
            </p>
          </div>

          {/* Valid emails preview */}
          {validEmails.length > 0 && (
            <div className="space-y-2">
              <Label>Valid Emails ({validEmails.length})</Label>
              <div className="max-h-32 overflow-y-auto p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex flex-wrap gap-1">
                  {validEmails.slice(0, 10).map((email, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {email}
                    </Badge>
                  ))}
                  {validEmails.length > 10 && (
                    <Badge variant="secondary" className="text-xs">
                      +{validEmails.length - 10} more...
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Invalid emails */}
          {invalidEmails.length > 0 && (
            <div className="space-y-2">
              <Label className="text-red-600">Invalid Emails ({invalidEmails.length})</Label>
              <div className="max-h-32 overflow-y-auto p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex flex-wrap gap-1">
                  {invalidEmails.map((email, index) => (
                    <Badge key={index} variant="destructive" className="text-xs flex items-center gap-1">
                      {email}
                      <button
                        type="button"
                        onClick={() => removeInvalidEmail(email)}
                        className="ml-1 hover:bg-red-700 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-sm text-red-600">Please remove or fix these invalid email addresses.</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || invalidEmails.length > 0 || validEmails.length === 0}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create List
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
