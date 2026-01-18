"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { verifyPayment } from "./actions"
import { toast } from "sonner"
import { Check, X, Loader2 } from "lucide-react"

export function ActionButton({ id, action }: { id: string, action: "APPROVE" | "REJECT" }) {
    const [loading, setLoading] = useState(false)

    const handleAction = async () => {
        if (!confirm(`Are you sure you want to ${action.toLowerCase()} this payment?`)) return
        setLoading(true)
        try {
            await verifyPayment(id, action)
            toast.success(`Payment ${action.toLowerCase()}d successfully`)
        } catch (err) {
            toast.error("Failed to update payment")
        } finally {
            setLoading(false)
        }
    }

    if (action === "APPROVE") {
        return (
            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleAction} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
        )
    }

    return (
        <Button size="sm" variant="destructive" onClick={handleAction} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </Button>
    )
}
