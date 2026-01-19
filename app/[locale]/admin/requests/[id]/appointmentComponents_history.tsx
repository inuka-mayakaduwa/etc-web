// Continue from existing AdminAppointmentManagement component...

// Component to display appointment history
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"

export function AppointmentHistory({ request }: { request: any }) {
    const attempts = request.appointmentAttempts || []

    if (attempts.length === 0) {
        return null
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            'CONFIRMED': { variant: 'default', label: 'Confirmed' },
            'PENDING': { variant: 'secondary', label: 'Pending' },
            'NO_SHOW': { variant: 'destructive', label: 'No-Show' },
            'CANCELLED': { variant: 'outline', label: 'Cancelled' },
            'COMPLETED': { variant: 'default', label: 'Completed' }
        }
        const config = variants[status] || { variant: 'secondary', label: status }
        return <Badge variant={config.variant as any}>{config.label}</Badge>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Appointment History
                </CardTitle>
                <CardDescription>Previous appointment attempts</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {attempts.map((attempt: any) => (
                        <div
                            key={attempt.id}
                            className="p-3 rounded-lg border bg-muted/30 space-y-2"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Attempt #{attempt.attemptNo}</span>
                                    {getStatusBadge(attempt.status)}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {attempt.mode === 'STAFF_ASSIGNED' ? '👤 Admin' : '🏠 Customer'}
                                </span>
                            </div>
                            <div className="text-sm space-y-1">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-3 w-3" />
                                    {format(new Date(attempt.scheduledStartAt), 'MMM dd, yyyy')}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(attempt.scheduledStartAt), 'h:mm a')} - {format(new Date(attempt.scheduledEndAt), 'h:mm a')}
                                </div>
                                {attempt.location && (
                                    <div className="text-xs text-muted-foreground">
                                        📍 {attempt.location.name}
                                    </div>
                                )}
                            </div>
                            {attempt.status === 'NO_SHOW' && (
                                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                    ⚠️ Customer did not attend
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
