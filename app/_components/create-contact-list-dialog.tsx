"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Textarea } from "@/app/_components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { Alert, AlertDescription } from "@/app/_components/ui/alert";
import { Badge } from "@/app/_components/ui/badge";
import { Progress } from "@/app/_components/ui/progress";
import { contactListSchema } from "@/app/_lib/validations/email";
import {
  AlertCircle,
  X,
  Plus,
  CheckCircle,
  Clock,
  Upload,
  Users,
  Mail,
  Loader2,
} from "lucide-react";

interface CreateContactListDialogProps {
  children: React.ReactNode;
}

interface EmailValidationResult {
  email: string;
  isValid: boolean;
  hasMxRecord: boolean;
  isReachable: boolean;
  error?: string;
}

interface BatchProcessingState {
  currentStep: "creating" | "uploading" | "processing" | "completed" | "error";
  currentBatch: number;
  totalBatches: number;
  processedEmails: number;
  totalEmails: number;
  contactListId?: string;
  error?: string;
}

export function CreateContactListDialog({
  children,
}: CreateContactListDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emailsInput, setEmailsInput] = useState("");
  const [validEmails, setValidEmails] = useState<string[]>([]);
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
  const [emailValidationResults, setEmailValidationResults] = useState<
    EmailValidationResult[]
  >([]);
  const [isValidatingEmails, setIsValidatingEmails] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [batchState, setBatchState] = useState<BatchProcessingState | null>(
    null
  );
  const router = useRouter();

  const parseEmails = (input: string): string[] => {
    if (!input.trim()) return [];

    const emails = input
      .split(/[,;\s\n\t]+/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0)
      .filter((email, index, arr) => arr.indexOf(email) === index);

    return emails;
  };

  const isValidEmailFormat = (email: string): boolean => {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  };

  const validateEmailFormats = (input: string) => {
    if (!input.trim()) {
      setValidEmails([]);
      setInvalidEmails([]);
      setEmailValidationResults([]);
      return;
    }

    const emails = parseEmails(input);
    const valid: string[] = [];
    const invalid: string[] = [];

    emails.forEach((email) => {
      if (isValidEmailFormat(email)) {
        valid.push(email);
      } else {
        invalid.push(email);
      }
    });

    setValidEmails(valid);
    setInvalidEmails(invalid);
    setEmailValidationResults([]);
  };

  const handleEmailsInputChange = (value: string) => {
    setEmailsInput(value);
    validateEmailFormats(value);
  };

  const removeInvalidEmail = (emailToRemove: string) => {
    setInvalidEmails((prev) => prev.filter((email) => email !== emailToRemove));

    const emails = parseEmails(emailsInput);
    const updatedEmails = emails.filter((email) => email !== emailToRemove);
    setEmailsInput(updatedEmails.join(", "));
  };

  const validateEmailsWithMX = async () => {
    if (validEmails.length === 0) return;

    setIsValidatingEmails(true);
    setError("");

    try {
      const response = await fetch("/api/validate-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: validEmails }),
      });

      if (!response.ok) {
        throw new Error("Failed to validate emails");
      }

      const results: EmailValidationResult[] = await response.json();
      setEmailValidationResults(results);

      const mxValidEmails = results
        .filter(
          (result) => result.isValid && result.hasMxRecord && result.isReachable
        )
        .map((result) => result.email);

      const mxInvalidEmails = results
        .filter(
          (result) =>
            !result.isValid || !result.hasMxRecord || !result.isReachable
        )
        .map((result) => result.email);

      const remainingValidEmails = validEmails.filter(
        (email) => !mxInvalidEmails.includes(email)
      );
      const newInvalidEmails = [...invalidEmails, ...mxInvalidEmails];

      setValidEmails(remainingValidEmails);
      setInvalidEmails(newInvalidEmails);
    } catch (error) {
      setError(
        `Email validation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsValidatingEmails(false);
    }
  };

  const processBatches = async (contactListId: string, emails: string[]) => {
    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(emails.length / BATCH_SIZE);

    setBatchState({
      currentStep: "processing",
      currentBatch: 1,
      totalBatches,
      processedEmails: 0,
      totalEmails: emails.length,
      contactListId,
    });

    try {
      for (let batchIndex = 1; batchIndex < totalBatches; batchIndex++) {
        setBatchState((prev) =>
          prev
            ? {
                ...prev,
                currentBatch: batchIndex + 1,
              }
            : null
        );
        const start = batchIndex * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, emails.length);
        const batchEmails = emails.slice(start, end);

         simulateEmailProcessing(batchEmails.length, batchIndex);

        const response = await fetch(`/api/contact-lists?id=${contactListId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Failed to process batch ${batchIndex + 1}`);
        }

        const updatedList = await response.json();
        setBatchState((prev) =>
          prev
            ? {
                ...prev,
                processedEmails: updatedList.processedEmails,
              }
            : null
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setBatchState((prev) =>
        prev
          ? {
              ...prev,
              currentStep: "completed",
            }
          : null
      );

      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 2000);
    } catch (error) {
      setBatchState((prev) =>
        prev
          ? {
              ...prev,
              currentStep: "error",
              error: error instanceof Error ? error.message : "Unknown error",
            }
          : null
      );
    }
  };

  const resetForm = () => {
    setName("");
    setEmailsInput("");
    setValidEmails([]);
    setInvalidEmails([]);
    setEmailValidationResults([]);
    setBatchState(null);
    setError("");
  };
  const simulateEmailProcessing = async (
    batchSize: number,
    batchIndex: number
  ) => {
    const EMAILS_PER_SECOND = 2;
    const INTERVAL_MS = 500; // 500ms = 2 emails per second

    console.log(
      `[v0] Starting email simulation for batch ${batchIndex + 1}, processing ${batchSize} emails at 2 emails/second`
    );

    for (let i = 0; i < batchSize; i += EMAILS_PER_SECOND) {
      const emailsToProcess = Math.min(EMAILS_PER_SECOND, batchSize - i);

      setBatchState((prev) => {
        if (!prev) return null;
        const newProcessedEmails = prev.processedEmails + emailsToProcess;
        console.log(
          `[v0] Processed ${emailsToProcess} emails, total: ${newProcessedEmails}/${prev.totalEmails}`
        );

        return {
          ...prev,
          processedEmails: newProcessedEmails,
        };
      });

      // Wait 500ms before processing next batch of 2 emails
      if (i + EMAILS_PER_SECOND < batchSize) {
        await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
      }
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (invalidEmails.length > 0) {
      setError("Please remove or fix invalid email addresses before saving.");
      return;
    }

    try {
      const validationResult = contactListSchema.safeParse({
        name: name.trim(),
        emails: validEmails,
      });

      if (!validationResult.success) {
        setError(validationResult.error.errors[0].message);
        return;
      }

      setIsLoading(true);

      const totalBatches = Math.ceil(validEmails.length / 50);
      setBatchState({
        currentStep: "creating",
        currentBatch: 1,
        totalBatches,
        processedEmails: 0,
        totalEmails: validEmails.length,
      });
      simulateEmailProcessing(50, 1);
      const response = await fetch("/api/contact-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationResult.data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create contact list");
      }

      const contactList = await response.json();

      setBatchState((prev) =>
        prev
          ? {
              ...prev,
              currentStep: "uploading",
              contactListId: contactList.id,
              processedEmails: Math.min(50, validEmails.length),
            }
          : null
      );

      if (validEmails.length > 50) {
        await processBatches(contactList.id, validEmails);
      } else {
        setBatchState((prev) =>
          prev
            ? {
                ...prev,
                currentStep: "completed",
              }
            : null
        );

        setTimeout(() => {
          setOpen(false);
          resetForm();
        }, 2000);
      }

      router.refresh();
    } catch (error) {
      console.log(error);

      setError(error instanceof Error ? error.message : "An error occurred");
      setBatchState((prev) =>
        prev
          ? {
              ...prev,
              currentStep: "error",
              error:
                error instanceof Error ? error.message : "An error occurred",
            }
          : null
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getEmailStatus = (email: string) => {
    const result = emailValidationResults.find((r) => r.email === email);
    if (!result) return null;

    if (result.isValid && result.hasMxRecord && result.isReachable) {
      return { status: "valid", icon: CheckCircle, color: "text-green-600" };
    } else if (result.isValid && result.hasMxRecord && !result.isReachable) {
      return { status: "warning", icon: AlertCircle, color: "text-yellow-600" };
    } else {
      return { status: "invalid", icon: X, color: "text-red-600" };
    }
  };

  const BatchProcessingLoader = () => {
    if (!batchState) return null;

    const getStepIcon = (step: string) => {
      switch (step) {
        case "creating":
          return <Plus className="h-5 w-5" />;
        case "uploading":
          return <Upload className="h-5 w-5" />;
        case "processing":
          return <Users className="h-5 w-5" />;
        case "completed":
          return <CheckCircle className="h-5 w-5 text-green-600" />;
        case "error":
          return <AlertCircle className="h-5 w-5 text-red-600" />;
        default:
          return <Loader2 className="h-5 w-5 animate-spin" />;
      }
    };

    const getStepText = (step: string) => {
      switch (step) {
        case "creating":
          return "Creating contact list...";
        case "uploading":
          return `Uploading batch ${batchState.currentBatch} of ${batchState.totalBatches}...`;
        case "processing":
          return `Processing batch ${batchState.currentBatch} of ${batchState.totalBatches}...`;
        case "completed":
          return "All emails processed successfully!";
        case "error":
          return `Error: ${batchState.error}`;
        default:
          return "Processing...";
      }
    };

    const progress =
      (batchState.processedEmails / batchState.totalEmails) * 100;

    return (
      <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div
            className={`${batchState.currentStep === "error" ? "" : "animate-pulse"}`}
          >
            {getStepIcon(batchState.currentStep)}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">
              {getStepText(batchState.currentStep)}
            </p>
            <p className="text-xs text-gray-600">
              {batchState.processedEmails} of {batchState.totalEmails} emails
              processed
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              Batch {batchState.currentBatch} of {batchState.totalBatches}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>

        {batchState.currentStep === "processing" && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <Mail className="h-4 w-4 animate-bounce" />
            <span>Adding emails to your audience...</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Contact List</DialogTitle>
          <DialogDescription>
            Create a new contact list to organize your email recipients. You can
            add unlimited email addresses. Emails will be validated for format
            and domain deliverability.
          </DialogDescription>
        </DialogHeader>

        {batchState && <BatchProcessingLoader />}

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
              disabled={isLoading || !!batchState}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emails">Email Addresses</Label>
            <Textarea
              id="emails"
              placeholder="Enter email addresses separated by commas, spaces, or new lines&#10;example@domain.com user@company.com&#10;another@email.com, test@site.com"
              value={emailsInput}
              onChange={(e) => handleEmailsInputChange(e.target.value)}
              rows={12}
              disabled={isLoading || !!batchState}
            />
            <div className="flex flex-col justify-between gap-2">
              <p className="text-sm text-gray-500">
                Separate emails with commas, spaces, or new lines. Supports
                unlimited emails with automatic batch processing.
              </p>
              {validEmails.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-blue-500 text-white hover:bg-blue-400 w-fit hover:text-white"
                  onClick={validateEmailsWithMX}
                  disabled={isValidatingEmails || isLoading || !!batchState}
                >
                  {isValidatingEmails ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Validate Domains
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {validEmails.length > 0 && (
            <div className="space-y-2">
              <Label>Valid Emails ({validEmails.length})</Label>
              <div className="max-h-40 overflow-y-auto p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex flex-wrap gap-1">
                  {validEmails.slice(0, 15).map((email, index) => {
                    const status = getEmailStatus(email);
                    return (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs flex items-center gap-1"
                      >
                        {email}
                        {status && (
                          <status.icon className={`h-3 w-3 ${status.color}`} />
                        )}
                      </Badge>
                    );
                  })}
                  {validEmails.length > 15 && (
                    <Badge variant="secondary" className="text-xs">
                      +{validEmails.length - 15} more...
                    </Badge>
                  )}
                </div>
              </div>
              {emailValidationResults.length > 0 && (
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Deliverable domain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-yellow-600" />
                    <span>Valid domain, delivery uncertain</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {invalidEmails.length > 0 && (
            <div className="space-y-2">
              <Label className="text-red-600">
                Invalid Emails ({invalidEmails.length})
              </Label>
              <div className="max-h-40 overflow-y-auto p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex flex-wrap gap-1">
                  {invalidEmails.map((email, index) => (
                    <Badge
                      key={index}
                      variant="destructive"
                      className="text-xs flex items-center gap-1"
                    >
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
              <p className="text-sm text-red-600">
                Please remove or fix these invalid email addresses.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={isLoading || !!batchState}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !!batchState ||
                invalidEmails.length > 0 ||
                validEmails.length === 0
              }
            >
              {isLoading || batchState ? (
                <>
                  <Loader2 className="animate-spin rounded-full h-4 w-4 mr-2" />
                  {batchState?.currentStep === "creating"
                    ? "Creating..."
                    : batchState?.currentStep === "uploading"
                      ? "Uploading..."
                      : batchState?.currentStep === "processing"
                        ? "Processing..."
                        : "Creating..."}
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
  );
}
