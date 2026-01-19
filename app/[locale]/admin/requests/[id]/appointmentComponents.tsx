"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Clock, Tag } from "lucide-react"
import { format, addMonths, startOfToday } from "date-fns"
import { toast } from "sonner"
import { adminBookAppointment, getAvailableSlots, getAvailableDates } from "./appointmentActions"
import { markInstallationCompleted, provisionCompleted } from "./provisioningActions"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"

export function AdminAppointmentBooking({ request }: { request: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>()
    const [availableDates, setAvailableDates] = useState<any[]>([])
    const [availableSlots, setAvailableSlots] = useState<any[]>([])
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

    useEffect(() => {
        loadAvailableDates()
    }, [])

    useEffect(() => {
        if (selectedDate) {
            loadAvailableSlots()
        }
    }, [selectedDate])

    const loadAvailableDates = async () => {
        try {
            const locationId = request.preferredLocation?.id
            if (!locationId) {
                toast.error("No location selected for this request")
                return
            }

            const dates = await getAvailableDates(locationId, startOfToday(), 30)
            setAvailableDates(dates)
        } catch (error: any) {
            toast.error(error.message || "Failed to load available dates")
        }
    }

    const loadAvailableSlots = async () => {
        if (!selectedDate) return

        try {
            const locationId = request.preferredLocation?.id
            if (!locationId) return

            const result = await getAvailableSlots(locationId, selectedDate)
            if (result.message) {
                toast.error(result.message)
                setAvailableSlots([])
            } else {
                setAvailableSlots(result.slots)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load time slots")
        }
    }

    const handleBooking = async () => {
        if (!selectedDate || !selectedSlot) {
            toast.error("Please select a date and time")
            return
        }

        const locationId = request.preferredLocation?.id
        if (!locationId) {
            toast.error("No location configured")
            return
        }

        // Parse time and combine with date
        const [hours, minutes] = selectedSlot.split(':').map(Number)
        const datetime = new Date(selectedDate)
        datetime.setHours(hours, minutes, 0, 0)

        setLoading(true)
        try {
            await adminBookAppointment({
                requestId: request.id,
                locationId,
                datetime
            })

            toast.success("Appointment booked successfully!")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to book appointment")
        } finally {
            setLoading(false)
        }
    }

    // Disable dates that aren't available
    const isDateDisabled = (date: Date) => {
        const match = availableDates.find(d =>
            format(d.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        )
        return !match?.available
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Book Appointment (Admin)
                </CardTitle>
                <CardDescription>
                    Manually book an appointment for this customer at {request.preferredLocation?.name}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-sm font-medium mb-3">Select Date</h3>
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={isDateDisabled}
                        fromDate={startOfToday()}
                        toDate={addMonths(startOfToday(), 1)}
                        className="rounded-md border"
                    />
                </div>

                {selectedDate && (
                    <div>
                        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Available Times for {format(selectedDate, 'MMM dd, yyyy')}
                        </h3>
                        {availableSlots.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No available slots for this date
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {availableSlots.map(slot => (
                                    <Button
                                        key={slot.time}
                                        variant={selectedSlot === slot.time ? "default" : "outline"}
                                        disabled={!slot.available}
                                        onClick={() => setSelectedSlot(slot.time)}
                                        className="text-sm"
                                    >
                                        {slot.time}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {selectedDate && selectedSlot && (
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm">
                            <strong>Selected Appointment:</strong><br />
                            {format(selectedDate, 'EEEE, MMMM dd, yyyy')} at {selectedSlot}
                            <br />
                            <span className="text-muted-foreground">
                                Location: {request.preferredLocation?.name}
                            </span>
                            <br />
                            <span className="text-xs text-orange-600">
                                ⚠️ Booking as admin on behalf of customer
                            </span>
                        </div>
                    </div>
                )}

                <Button
                    onClick={handleBooking}
                    disabled={!selectedDate || !selectedSlot || loading}
                    className="w-full"
                    size="lg"
                >
                    {loading ? "Booking..." : "Confirm Appointment (Admin)"}
                </Button>
            </CardContent>
        </Card>
    )
}

// Component for managing existing scheduled appointments
export function AdminAppointmentManagement({ request }: { request: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showNoShowDialog, setShowNoShowDialog] = useState(false)
    const [showCancelDialog, setShowCancelDialog] = useState(false)
    const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
    const [showCompleteDialog, setShowCompleteDialog] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>()
    const [availableDates, setAvailableDates] = useState<any[]>([])
    const [availableSlots, setAvailableSlots] = useState<any[]>([])
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

    const appointment = request.activeAppointmentAttempt

    if (!appointment) return null

    const handleNoShow = async () => {
        setLoading(true)
        try {
            const { markNoShow } = await import('./appointmentActions')
            await markNoShow(appointment.id, request.id)
            toast.success("Appointment marked as no-show")
            setShowNoShowDialog(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to mark no-show")
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = async () => {
        setLoading(true)
        try {
            const { cancelAppointment } = await import('./appointmentActions')
            await cancelAppointment(appointment.id, request.id)
            toast.success("Appointment cancelled and status reverted")
            setShowCancelDialog(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to cancel appointment")
        } finally {
            setLoading(false)
        }
    }

    const handleCompleteInstallation = async () => {
        setLoading(true)
        try {
            await markInstallationCompleted(request.id)
            toast.success("Installation marked as completed")
            setShowCompleteDialog(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to mark installation completed")
        } finally {
            setLoading(false)
        }
    }

    const loadDatesForReschedule = async () => {
        try {
            const locationId = request.preferredLocation?.id
            if (!locationId) return

            const dates = await getAvailableDates(locationId, startOfToday(), 30)
            setAvailableDates(dates)
        } catch (error: any) {
            toast.error(error.message || "Failed to load dates")
        }
    }

    const loadSlotsForDate = async (date: Date) => {
        try {
            const locationId = request.preferredLocation?.id
            if (!locationId) return

            const result = await getAvailableSlots(locationId, date)
            if (result.message) {
                toast.error(result.message)
                setAvailableSlots([])
            } else {
                setAvailableSlots(result.slots)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load slots")
        }
    }

    const handleReschedule = async () => {
        if (!selectedDate || !selectedSlot) return

        const locationId = request.preferredLocation?.id
        if (!locationId) return

        const [hours, minutes] = selectedSlot.split(':').map(Number)
        const datetime = new Date(selectedDate)
        datetime.setHours(hours, minutes, 0, 0)

        setLoading(true)
        try {
            const { rescheduleAppointmentAdmin } = await import('./appointmentActions')
            await rescheduleAppointmentAdmin({
                requestId: request.id,
                locationId,
                datetime
            })
            toast.success("Appointment rescheduled")
            setShowRescheduleDialog(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to reschedule")
        } finally {
            setLoading(false)
        }
    }

    const isDateDisabled = (date: Date) => {
        const match = availableDates.find(d =>
            format(d.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        )
        return !match?.available
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Scheduled Appointment
                    </CardTitle>
                    <CardDescription>Manage customer appointment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-primary/5 rounded-lg border">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 font-semibold">
                                <CalendarIcon className="h-4 w-4" />
                                {format(new Date(appointment.scheduledStartAt), 'EEEE, MMMM dd, yyyy')}
                            </div>
                            <div className="flex items-center gap-2 font-semibold">
                                <Clock className="h-4 w-4" />
                                {format(new Date(appointment.scheduledStartAt), 'h:mm a')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                📍 {appointment.location?.name || request.preferredLocation?.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                                Mode: {appointment.mode === 'STAFF_ASSIGNED' ? 'Admin Booked' : 'Customer Booked'}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setShowCompleteDialog(true)}
                        >
                            Mark Installation As Completed
                        </Button>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    loadDatesForReschedule()
                                    setShowRescheduleDialog(true)
                                }}
                            >
                                Reschedule
                            </Button>
                            <Button
                                variant="outline"
                                className="text-orange-600"
                                onClick={() => setShowNoShowDialog(true)}
                            >
                                No-Show
                            </Button>
                            <Button
                                variant="outline"
                                className="text-red-600"
                                onClick={() => setShowCancelDialog(true)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Complete Installation Dialog */}
            <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Installation Completion?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will mark the installation as completed and change the status to "Pending Provisioning".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCompleteInstallation} disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading ? "Completing..." : "Confirm Completion"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* No-Show Dialog */}
            <AlertDialog open={showNoShowDialog} onOpenChange={setShowNoShowDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mark as No-Show?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will mark that the customer did not attend their appointment and revert the request status to AWAITING_APPOINTMENT.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleNoShow} disabled={loading}>
                            {loading ? "Marking..." : "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Dialog */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will cancel the appointment and revert the request status to AWAITING_APPOINTMENT.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} disabled={loading} className="bg-red-600">
                            {loading ? "Cancelling..." : "Confirm Cancellation"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reschedule Dialog */}
            <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Reschedule Appointment</DialogTitle>
                        <DialogDescription>Select a new date and time for the customer</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium mb-3">Select Date</h3>
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                    setSelectedDate(date)
                                    if (date) loadSlotsForDate(date)
                                }}
                                disabled={isDateDisabled}
                                fromDate={startOfToday()}
                                toDate={addMonths(startOfToday(), 1)}
                                className="rounded-md border"
                            />
                        </div>

                        {selectedDate && availableSlots.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium mb-3">Available Times</h3>
                                <div className="grid grid-cols-5 gap-2">
                                    {availableSlots.map(slot => (
                                        <Button
                                            key={slot.time}
                                            variant={selectedSlot === slot.time ? "default" : "outline"}
                                            disabled={!slot.available}
                                            onClick={() => setSelectedSlot(slot.time)}
                                            size="sm"
                                        >
                                            {slot.time}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRescheduleDialog(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReschedule}
                            disabled={!selectedDate || !selectedSlot || loading}
                        >
                            {loading ? "Rescheduling..." : "Confirm Reschedule"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export function AdminProvisioningManagement({ request }: { request: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showProvisionDialog, setShowProvisionDialog] = useState(false)

    const handleProvision = async () => {
        setLoading(true)
        try {
            await provisionCompleted(request.id)
            toast.success("Provisioning completed and request finalized")
            setShowProvisionDialog(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to provision")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Pending Provisioning
                    </CardTitle>
                    <CardDescription>
                        Installation is completed. Finalize provisioning to complete the request.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={() => setShowProvisionDialog(true)}
                        className="w-full"
                        size="lg"
                    >
                        Provision Completed
                    </Button>
                </CardContent>
            </Card>

            <AlertDialog open={showProvisionDialog} onOpenChange={setShowProvisionDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Provisioning?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will finish the request workflow and mark it as COMPLETED.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleProvision} disabled={loading}>
                            {loading ? "Provisioning..." : "Confirm & Complete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export function AppointmentHistory({ request }: { request: any }) {
    const attempts = request.appointmentAttempts || []

    if (attempts.length === 0) {
        return null
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            'CONFIRMED': { variant: 'default', label: 'Confirmed' },
            'PENDING': { variant: 'secondary', label: 'Pending' },
            'MISSED': { variant: 'destructive', label: 'No-Show' },
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
                            {attempt.status === 'MISSED' && (
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
