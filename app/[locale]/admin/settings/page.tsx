// Imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSystemUsers } from "./users/actions"
import { getRoles, getAllPermissions } from "./roles/actions"
import { UserManagement } from "./users/components"
import { RoleManagement } from "./roles/components"

import { auth } from "@/app/auth"
import { hasPermission } from "@/lib/permissions"

import { GeneralSettings } from "./general/components"
import { getVehicleTypes, getLocations, getRequestStatuses } from "./general/actions"

export default async function AdminSettingsPage() {
    const session = await auth()
    const userId = session?.user?.id

    const [canViewUsers, canViewRoles, canWriteRoles] = await Promise.all([
        userId ? hasPermission(userId, "etc.settings.users.view") : false,
        userId ? hasPermission(userId, "etc.settings.roles.view") : false,
        userId ? hasPermission(userId, "etc.settings.roles.write") : false
    ])

    const generalPermissions = {
        "etc.settings.vehicle_types.manage": userId ? await hasPermission(userId, "etc.settings.vehicle_types.manage") : false,
        "etc.settings.locations.manage": userId ? await hasPermission(userId, "etc.settings.locations.manage") : false,
        "etc.settings.statuses.manage": userId ? await hasPermission(userId, "etc.settings.statuses.manage") : false,
    }

    // Parallel Fetching
    const [users, roles, permissions, vehicleTypes, locations, statuses] = await Promise.all([
        canViewUsers ? getSystemUsers() : [],
        canViewRoles ? getRoles() : [],
        canViewRoles ? getAllPermissions() : [],
        getVehicleTypes(),
        getLocations(),
        getRequestStatuses()
    ])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            </div>

            <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                    {canViewUsers && <TabsTrigger value="users">System Users</TabsTrigger>}
                    {canViewRoles && <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>}
                    <TabsTrigger value="general">General</TabsTrigger>
                </TabsList>

                {canViewUsers && (
                    <TabsContent value="users" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>System Users</CardTitle>
                                <CardDescription>Manage administrators and staff access.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UserManagement users={users} roles={roles} locations={locations} statuses={statuses} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {canViewRoles && (
                    <TabsContent value="roles" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Roles</CardTitle>
                                <CardDescription>Configure system roles and fine-grained permissions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RoleManagement roles={roles} permissions={permissions} canWrite={canWriteRoles} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                <TabsContent value="general" className="space-y-4">
                    <GeneralSettings
                        vehicleTypes={vehicleTypes}
                        locations={locations}
                        statuses={statuses}
                        permissions={generalPermissions}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
