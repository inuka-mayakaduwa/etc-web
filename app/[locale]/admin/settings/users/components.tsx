"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createSystemUser, updateSystemUser, toggleSystemUserActive } from "./actions"
import { userSchema, UserFormData } from "./schema"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
// ... other imports
import { Check, X, Pencil, Plus, Loader2, Shield } from "lucide-react"
import { getUserAccess, updateUserAccess } from "./actions"

// ... existing types ...

export function UserManagement({ users, roles, locations, statuses }: { users: any[], roles: any[], locations: any[], statuses: any[] }) {
    const [open, setOpen] = useState(false)
    const [accessOpen, setAccessOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<any | null>(null)

    const handleEdit = (user: any) => {
        setEditingUser(user)
        setOpen(true)
    }

    const handleAccess = (user: any) => {
        setEditingUser(user)
        setAccessOpen(true)
    }

    const handleCreate = () => {
        setEditingUser(null)
        setOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </div>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Mobile</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.mobile}</TableCell>
                                <TableCell>
                                    <div className="flex gap-1 flex-wrap">
                                        {user.userRoles.map((ur: any) => (
                                            <Badge key={ur.role.id} variant="secondary">{ur.role.name}</Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusToggle user={user} />
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleAccess(user)} title="Manage Access">
                                            <Shield className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <UserFormDialog
                open={open}
                onOpenChange={setOpen}
                initialData={editingUser}
                roles={roles}
            />

            <UserAccessDialog
                open={accessOpen}
                onOpenChange={setAccessOpen}
                user={editingUser}
                locations={locations}
                statuses={statuses}
            />
        </div>
    )
}

function UserAccessDialog({ open, onOpenChange, user, locations, statuses }: { open: boolean, onOpenChange: (open: boolean) => void, user: any, locations: any[], statuses: any[] }) {
    const [loading, setLoading] = useState(false)
    const [selectedLocations, setSelectedLocations] = useState<string[]>([])
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

    // Load initial access when opening
    useEffect(() => {
        if (open && user) {
            setLoading(true)
            getUserAccess(user.id).then(data => {
                setSelectedLocations(data.locationIds)
                setSelectedStatuses(data.statusIds)
            }).finally(() => setLoading(false))
        } else {
            setSelectedLocations([])
            setSelectedStatuses([])
        }
    }, [open, user])

    const handleSave = async () => {
        if (!user) return
        setLoading(true)
        try {
            await updateUserAccess(user.id, selectedLocations, selectedStatuses)
            toast.success("Access updated")
            onOpenChange(false)
        } catch {
            toast.error("Failed to update access")
        } finally {
            setLoading(false)
        }
    }

    const toggleLocation = (id: string) => {
        setSelectedLocations(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const toggleStatus = (id: string) => {
        setSelectedStatuses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Start Access Management - {user?.name}</DialogTitle>
                    <DialogDescription>Assign specific installation locations and status capabilities.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6 py-4">
                    <Card>
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">Locations</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0 h-60 overflow-y-auto space-y-2">
                            {locations.map(loc => (
                                <div key={loc.id} className="flex items-center space-x-2">
                                    <input type="checkbox" checked={selectedLocations.includes(loc.id)} onChange={() => toggleLocation(loc.id)} />
                                    <span className="text-sm">{loc.name}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">Statuses</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0 h-60 overflow-y-auto space-y-2">
                            {statuses.map(st => (
                                <div key={st.id} className="flex items-center space-x-2">
                                    <input type="checkbox" checked={selectedStatuses.includes(st.id)} onChange={() => toggleStatus(st.id)} />
                                    <span className="text-sm">{st.code} <span className="text-xs text-muted-foreground">({st.label})</span></span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter>
                    <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save Access"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ... existing StatusToggle ...
function StatusToggle({ user }: { user: any }) {
    const [loading, setLoading] = useState(false)
    const toggle = async () => {
        setLoading(true)
        try {
            await toggleSystemUserActive(user.id, user.active)
            toast.success("Status updated")
        } catch {
            toast.error("Failed to update status")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Switch checked={user.active} onCheckedChange={toggle} disabled={loading} />
    )
}

// ... existing UserFormDialog ...
function UserFormDialog({ open, onOpenChange, initialData, roles }: { open: boolean, onOpenChange: (Open: boolean) => void, initialData?: any, roles: any[] }) {
    // ... existing implementation ...
    const form = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: "",
            email: "",
            mobile: "",
            active: true,
            roleIds: []
        }
    })

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                email: initialData.email,
                mobile: initialData.mobile,
                active: initialData.active,
                roleIds: initialData.userRoles.map((ur: any) => ur.role.id)
            })
        } else {
            form.reset({
                name: "",
                email: "",
                mobile: "",
                active: true,
                roleIds: []
            })
        }
    }, [initialData, form])

    const onSubmit = async (data: UserFormData) => {
        setLoading(true)
        try {
            if (initialData) {
                await updateSystemUser(initialData.id, data)
                toast.success("User updated")
            } else {
                await createSystemUser(data)
                toast.success("User created")
            }
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || "Operation failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit User" : "Add User"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input {...form.register("name")} />
                        {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input {...form.register("email")} />
                        {form.formState.errors.email && <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Mobile</Label>
                        <Input {...form.register("mobile")} />
                        {form.formState.errors.mobile && <p className="text-red-500 text-sm">{form.formState.errors.mobile.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Roles</Label>
                        <div className="flex flex-wrap gap-2">
                            {roles.map(role => (
                                <div key={role.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        value={role.id}
                                        {...form.register("roleIds")}
                                    />
                                    <span>{role.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {initialData ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
