"use client"

import type React from "react"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/app/_components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select"
import { Button } from "@/app/_components/ui/button"
import { Search, X } from "lucide-react"
import { useState } from "react"

export function EmailHistoryFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [status, setStatus] = useState(searchParams.get("status") || "all")

  const updateFilters = (newSearch?: string, newStatus?: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (newSearch !== undefined) {
      if (newSearch) {
        params.set("search", newSearch)
      } else {
        params.delete("search")
      }
    }

    if (newStatus !== undefined) {
      if (newStatus && newStatus !== "all") {
        params.set("status", newStatus)
      } else {
        params.delete("status")
      }
    }

    params.delete("page") // Reset to first page when filtering
    router.push(`/email-history?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters(search, status)
  }

  const clearFilters = () => {
    setSearch("")
    setStatus("all")
    router.push("/email-history")
  }

  const hasActiveFilters = search || (status && status !== "all")

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-gray-200 rounded-lg">
      <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by subject or contact list..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="flex gap-2">
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value)
            updateFilters(search, value)
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
