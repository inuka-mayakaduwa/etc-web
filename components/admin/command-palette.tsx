"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { FileText, CreditCard, Calendar, Settings, Users, MapPin, Tag } from "lucide-react"

interface CommandPaletteProps {
  permissions: Record<string, boolean>
}

export function CommandPalette({ permissions }: CommandPaletteProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const navigate = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {permissions["etc.requests.view"] && (
          <CommandGroup heading="Requests">
            <CommandItem onSelect={() => navigate("/admin/requests")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>All Requests</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate("/admin/requests?status=PENDING_PAYMENT")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Pending Payment</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate("/admin/requests?status=PENDING_INFORMATION_REVIEW")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Pending Review</span>
            </CommandItem>
          </CommandGroup>
        )}

        {permissions["etc.payment.view"] && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Payments">
              <CommandItem onSelect={() => navigate("/admin/payments")}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Payment Management</span>
              </CommandItem>
              <CommandItem onSelect={() => navigate("/admin/payments?tab=pending")}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Pending Reviews</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {permissions["etc.appointments.manage"] && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Appointments">
              <CommandItem onSelect={() => navigate("/admin/appointments")}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Appointment Configuration</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {permissions["etc.settings.view"] && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem onSelect={() => navigate("/admin/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>System Settings</span>
              </CommandItem>
              <CommandItem onSelect={() => navigate("/admin/settings?tab=users")}>
                <Users className="mr-2 h-4 w-4" />
                <span>User Management</span>
              </CommandItem>
              <CommandItem onSelect={() => navigate("/admin/settings?tab=roles")}>
                <Tag className="mr-2 h-4 w-4" />
                <span>Roles & Permissions</span>
              </CommandItem>
              <CommandItem onSelect={() => navigate("/admin/settings?tab=general")}>
                <MapPin className="mr-2 h-4 w-4" />
                <span>General Settings</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
