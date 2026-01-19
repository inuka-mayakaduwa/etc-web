"use client"

import React from "react"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react"
import { format, addMonths, startOfToday } from "date-fns"
import { toast } from "sonner"
import { getAvailableDates, getAvailableSlots, bookAppointment, rescheduleAppointment } from "./actions"
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

    const isDateDisabled = (date: Date) => {
        const match = availableDates.find(d =>
            format(d.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        )
        return !match?.available
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" aria-hidden="true" />
                    Book Appointment
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                    Schedule your ETC tag installation at <span className="font-medium">{request.preferredLocation?.name}</span>
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Date Selection */}
                <fieldset>
                    <legend className="text-sm font-semibold mb-3 block">Select Date</legend>
                    <div className="border rounded-lg p-4 bg-card overflow-x-auto">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={isDateDisabled}
                            fromDate={startOfToday()}
                            toDate={addMonths(startOfToday(), 1)}
                            className="w-full"
                        />
                    </div>
                </fieldset>

                {/* Time Selection */}
                {selectedDate && (
                    <fieldset>
                        <legend className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4" aria-hidden="true" />
                            Select Time for {format(selectedDate, 'MMM dd')}
                        </legend>
                        {availableSlots.length === 0 ? (
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" aria-hidden="true" />
                                <p className="text-sm text-amber-800">No available slots for this date</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-2">
                                {availableSlots.map(slot => (
                                    <button
                                        key={slot.time}
                                        onClick={() => setSelectedSlot(slot.time)}
                                        disabled={!slot.available}
                                        aria-pressed={selectedSlot === slot.time}
                                        className={`py-2 px-3 rounded-md text-sm font-medium transition-colors min-h-12 flex items-center justify-center ${selectedSlot === slot.time
                                                ? 'bg-primary text-primary-foreground'
                                                : slot.available
                                                    ? 'bg-muted hover:bg-muted/80 text-foreground'
                                                    : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                                            }`}
                                    >
                                        {slot.time}
                                    </button>
                                ))}
                            </div>
                        )}
                    </fieldset>
                )}

                {/* Summary */}
                {selectedDate && selectedSlot && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-2">Appointment Summary</p>
                        <div className="space-y-1 text-sm text-blue-800">
                            <p><span className="font-medium">Date:</span> {format(selectedDate, 'EEEE, MMMM dd, yyyy')}</p>
                            <p><span className="font-medium">Time:</span> {selectedSlot}</p>
                            <p><span className="font-medium">Location:</span> {request.preferredLocation?.name}</p>
                        </div>
                    </div>
                )}

                <Button
                    onClick={handleBooking}
                    disabled={!selectedDate || !selectedSlot || loading}
                    className="w-full"
                    size="lg"
                    aria-busy={loading}
                >
                    {loading ? "Booking..." : "Confirm Appointment"}
                </Button>
            </CardContent>
        </Card>
    )
}

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
                <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" aria-hidden="true" />
                    Scheduled Appointment
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {!isRescheduling ? (
                    <>
                        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg space-y-3">
                            <div className="flex items-start gap-3">
                                <CalendarIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                <div>
                                    <p className="text-xs font-semibold text-green-800 uppercase">Date</p>
                                    <p className="text-sm font-semibold text-green-900 mt-1">
                                        {format(new Date(appointment.scheduledStartAt), 'EEEE, MMMM dd, yyyy')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                <div>
                                    <p className="text-xs font-semibold text-green-800 uppercase">Time</p>
                                    <p className="text-sm font-semibold text-green-900 mt-1">
                                        {format(new Date(appointment.scheduledStartAt), 'h:mm a')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 pt-2 border-t border-green-200">
                                <span className="text-xs font-semibold text-green-800 uppercase">Location</span>
                                <p className="text-sm font-medium text-green-900">
                                    {appointment.location?.name || request.preferredLocation?.name}
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-900">
                                <span className="font-semibold">Note:</span> Please arrive 10 minutes early
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
                        <fieldset>
                            <legend className="text-sm font-semibold mb-3 block">Select New Date</legend>
                            <div className="border rounded-lg p-4 bg-card overflow-x-auto">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    disabled={isDateDisabled}
                                    fromDate={startOfToday()}
                                    toDate={addMonths(startOfToday(), 1)}
                                    className="w-full"
                                />
                            </div>
                        </fieldset>

                        {selectedDate && (
                            <fieldset>
                                <legend className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Clock className="h-4 w-4" aria-hidden="true" />
                                    Select New Time
                                </legend>
                                {availableSlots.length === 0 ? (
                                    <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" aria-hidden="true" />
                                        <p className="text-sm text-amber-800">No available slots for this date</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-2">
                                        {availableSlots.map(slot => (
                                            <button
                                                key={slot.time}
                                                onClick={() => setSelectedSlot(slot.time)}
                                                disabled={!slot.available}
                                                aria-pressed={selectedSlot === slot.time}
                                                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors min-h-12 flex items-center justify-center ${selectedSlot === slot.time
                                                        ? 'bg-primary text-primary-foreground'
                                                        : slot.available
                                                            ? 'bg-muted hover:bg-muted/80 text-foreground'
                                                            : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                                                    }`}
                                            >
                                                {slot.time}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </fieldset>
                        )}

                        {selectedDate && selectedSlot && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm font-medium text-blue-900 mb-2">New Appointment</p>
                                <div className="space-y-1 text-sm text-blue-800">
                                    <p>{format(selectedDate, 'EEEE, MMMM dd, yyyy')} at {selectedSlot}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
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
                                aria-busy={loading}
                            >
                                {loading ? "Rescheduling..." : "Confirm"}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

export function CollapsibleSection({
    title,
    defaultOpen = true,
    children
}: {
    title: string
    defaultOpen?: boolean
    children: React.ReactNode
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <Card>
            <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <button
                    className="flex items-center justify-between w-full hover:opacity-70 transition-opacity"
                    onClick={(e) => {
                        e.preventDefault()
                        setIsOpen(!isOpen)
                    }}
                    aria-expanded={isOpen}
                >
                    <CardTitle className="text-base">{title}</CardTitle>
                    <ChevronDown
                        className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
                        aria-hidden="true"
                    />
                </button>
            </CardHeader>
            {isOpen && (
                <CardContent>
                    {children}
                </CardContent>
            )}
        </Card>
    )
}
