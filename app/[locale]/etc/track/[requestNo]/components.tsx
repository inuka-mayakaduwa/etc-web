"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { format, addMonths, startOfToday } from "date-fns"
import { toast } from "sonner"
import { getAvailableDates, getAvailableSlots, bookAppointment } from "./actions"
import { Calendar } from "@/components/ui/calendar"

export function AppointmentBooking({ request }: { request: any }) {
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
            await bookAppointment({
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
                    Book Your Installation Appointment
                </CardTitle>
                <CardDescription>
                    Select a convenient date and time for your ETC tag installation at {request.preferredLocation?.name}
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
                        </div>
                    </div>
                )}

                <Button
                    onClick={handleBooking}
                    disabled={!selectedDate || !selectedSlot || loading}
                    className="w-full"
                    size="lg"
                >
                    {loading ? "Booking..." : "Confirm Appointment"}
                </Button>
            </CardContent>
        </Card>
    )
}

// Component to display scheduled appointment with reschedule option
export function AppointmentDetails({ request }: { request: any }) {
    const router = useRouter()
    const [isRescheduling, setIsRescheduling] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>()
    const [availableDates, setAvailableDates] = useState<any[]>([])
    const [availableSlots, setAvailableSlots] = useState<any[]>([])
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

    const appointment = request.activeAppointmentAttempt

    useEffect(() => {
        if (isRescheduling) {
            loadAvailableDates()
        }
    }, [isRescheduling])

    useEffect(() => {
        if (selectedDate) {
            loadAvailableSlots()
        }
    }, [selectedDate])

    const loadAvailableDates = async () => {
        try {
            const locationId = request.preferredLocation?.id
            if (!locationId) return

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

    const handleReschedule = async () => {
        if (!selectedDate || !selectedSlot) {
            toast.error("Please select a date and time")
            return
        }

        const locationId = request.preferredLocation?.id
        if (!locationId) return

        const [hours, minutes] = selectedSlot.split(':').map(Number)
        const datetime = new Date(selectedDate)
        datetime.setHours(hours, minutes, 0, 0)

        setLoading(true)
        try {
            const { rescheduleAppointment } = await import('./actions')
            await rescheduleAppointment({
                requestId: request.id,
                locationId,
                datetime
            })

            toast.success("Appointment rescheduled successfully!")
            setIsRescheduling(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to reschedule appointment")
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

    if (!appointment) {
        return null
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Your Scheduled Appointment
                </CardTitle>
                <CardDescription>
                    Your installation appointment details
                </CardDescription>
            </CardHeader>           <CardContent className="space-y-4">
                {!isRescheduling ? (
                    <>
                        <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-lg font-semibold">
                                    <CalendarIcon className="h-5 w-5 text-primary" />
                                    {format(new Date(appointment.scheduledStartAt), 'EEEE, MMMM dd, yyyy')}
                                </div>
                                <div className="flex items-center gap-2 text-lg font-semibold">
                                    <Clock className="h-5 w-5 text-primary" />
                                    {format(new Date(appointment.scheduledStartAt), 'h:mm a')}
                                </div>
                                <div className="text-sm text-muted-foreground mt-2">
                                    📍 {appointment.location?.name || request.preferredLocation?.name}
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-muted rounded-md text-sm">
                            <p className="text-muted-foreground">
                                ℹ️ Please arrive 10 minutes early for your appointment. If you're unable to make it, you can reschedule below.
                            </p>
                        </div>

                        <Button
                            onClick={() => setIsRescheduling(true)}
                            variant="outline"
                            className="w-full"
                        >
                            Reschedule Appointment
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium mb-3">Select New Date</h3>
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
                                        <strong>New Appointment:</strong><br />
                                        {format(selectedDate, 'EEEE, MMMM dd, yyyy')} at {selectedSlot}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => {
                                        setIsRescheduling(false)
                                        setSelectedDate(undefined)
                                        setSelectedSlot(null)
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleReschedule}
                                    disabled={!selectedDate || !selectedSlot || loading}
                                    className="flex-1"
                                >
                                    {loading ? "Rescheduling..." : "Confirm Reschedule"}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
