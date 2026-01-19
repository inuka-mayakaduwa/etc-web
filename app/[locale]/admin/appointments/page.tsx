import { getLocations } from "./actions"
import { requirePermission } from "@/lib/permissions"
import { AppointmentConfiguration } from "./components"

export default async function AppointmentsPage() {
    await requirePermission("etc.appointments.manage")

    const locations = await getLocations()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Appointment Configuration</h2>
                    <p className="text-muted-foreground">
                        Configure schedules, capacity, and availability for each location
                    </p>
                </div>
            </div>

            <AppointmentConfiguration locations={locations} />
        </div>
    )
}
