"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Filter } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterPopoverProps {
  children: React.ReactNode
  activeCount?: number
  title?: string
}

export function FilterPopover({ children, activeCount = 0, title = "Filter" }: FilterPopoverProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Filter className="h-4 w-4" />
          {title}
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 rounded-sm px-1 font-normal">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="font-medium text-sm">{title}</div>
          {children}
        </div>
      </PopoverContent>
    </Popover>
  )
}
