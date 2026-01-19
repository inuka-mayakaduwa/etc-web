"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createVehicleType, updateVehicleType, deleteVehicleType, createLocation, updateLocation, deleteLocation, createStatus, updateStatus } from "./actions"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

// --- Vehicle Types ---
const vehicleTypeSchema = z.object({
    code: z.string().min(1),
    label: z.string().min(1),
    active: z.boolean().default(true)
})
type VehicleTypeData = z.infer<typeof vehicleTypeSchema>

function VehicleTypeManager({ data, canManage }: { data: any[], canManage: boolean }) {
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<any | null>(null)
    const form = useForm<VehicleTypeData>({ resolver: zodResolver(vehicleTypeSchema) })

    // reset effect would be better, but simpler inline here:
    const handleEdit = (item: any) => {
        setEditing(item)
        form.reset({ code: item.code, label: item.label, active: item.active })
        setOpen(true)
    }
    const handleCreate = () => {
        setEditing(null)
        form.reset({ code: "", label: "", active: true })
        setOpen(true)
    }
    const onSubmit = async (values: VehicleTypeData) => {
        try {
            if (editing) await updateVehicleType(editing.id, values)
            else await createVehicleType(values)
            setOpen(false)
            toast.success("Saved")
        } catch { toast.error("Failed") }
    }
    const handleDelete = async (id: string) => {
        if (!confirm("Deactivate?")) return
        try { await deleteVehicleType(id); toast.success("Deactivated") } catch { toast.error("Failed") }
    }

    return (
        <div className="space-y-4">
            {canManage && <div className="flex justify-end"><Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> Add Type</Button></div>}
            <div className="border rounded-md">
                <Table>
                    <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Label</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {data.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{item.code}</TableCell>
                                <TableCell>{item.label}</TableCell>
                                <TableCell>{item.active ? <Badge variant="default">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                                <TableCell>
                                    {canManage && (
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editing ? "Edit Type" : "Add Type"}</DialogTitle></DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div><Label>Code</Label><Input {...form.register("code")} /></div>
                        <div><Label>Label</Label><Input {...form.register("label")} /></div>
                        <DialogFooter><Button type="submit">Save</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// --- Locations ---
const locationSchema = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    address: z.string().optional(),
    contactNo: z.string().optional(),
    active: z.boolean().default(true)
})
type LocationData = z.infer<typeof locationSchema>

function LocationManager({ data, canManage }: { data: any[], canManage: boolean }) {
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<any | null>(null)
    const form = useForm<LocationData>({ resolver: zodResolver(locationSchema) })

    const handleEdit = (item: any) => {
        setEditing(item)
        form.reset({ code: item.code, name: item.name, address: item.address, contactNo: item.contactNo, active: item.active })
        setOpen(true)
    }
    const handleCreate = () => {
        setEditing(null)
        form.reset({ code: "", name: "", address: "", contactNo: "", active: true })
        setOpen(true)
    }
    const onSubmit = async (values: LocationData) => {
        try {
            if (editing) await updateLocation(editing.id, values)
            else await createLocation(values)
            setOpen(false)
            toast.success("Saved")
        } catch { toast.error("Failed") }
    }
    const handleDelete = async (id: string) => {
        if (!confirm("Deactivate?")) return
        try { await deleteLocation(id); toast.success("Deactivated") } catch { toast.error("Failed") }
    }

    return (
        <div className="space-y-4">
            {canManage && <div className="flex justify-end"><Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> Add Location</Button></div>}
            <div className="border rounded-md">
                <Table>
                    <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {data.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{item.code}</TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.contactNo}</TableCell>
                                <TableCell>{item.active ? <Badge variant="default">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                                <TableCell>
                                    {canManage && (
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editing ? "Edit Location" : "Add Location"}</DialogTitle></DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div><Label>Code</Label><Input {...form.register("code")} /></div>
                        <div><Label>Name</Label><Input {...form.register("name")} /></div>
                        <div><Label>Address</Label><Input {...form.register("address")} /></div>
                        <div><Label>Contact No</Label><Input {...form.register("contactNo")} /></div>
                        <DialogFooter><Button type="submit">Save</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// --- Statuses --- (Simplified: no create/delete usually for workflow statuses, but requested management)
const statusSchema = z.object({
    code: z.string().min(1),
    label: z.string().min(1),
    category: z.string().min(1),
    orderIndex: z.coerce.number().default(0),
    isTerminal: z.boolean().default(false),
    isEditable: z.boolean().default(false),
    active: z.boolean().default(true)
})
type StatusData = z.infer<typeof statusSchema>

function StatusManager({ data, canManage }: { data: any[], canManage: boolean }) {
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<any | null>(null)
    const form = useForm<StatusData>({ resolver: zodResolver(statusSchema) })

    const handleEdit = (item: any) => {
        setEditing(item)
        form.reset({ code: item.code, label: item.label, category: item.category, orderIndex: item.orderIndex, isTerminal: item.isTerminal, isEditable: item.isEditable, active: item.active })
        setOpen(true)
    }
    const handleCreate = () => {
        setEditing(null)
        form.reset({ code: "", label: "", category: "OPEN", orderIndex: 0, isTerminal: false, isEditable: false, active: true })
        setOpen(true)
    }
    const onSubmit = async (values: StatusData) => {
        try {
            if (editing) await updateStatus(editing.id, values)
            else await createStatus(values)
            setOpen(false)
            toast.success("Saved")
        } catch { toast.error("Failed") }
    }

    return (
        <div className="space-y-4">
            {canManage && <div className="flex justify-end"><Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> Add Status</Button></div>}
            <div className="border rounded-md">
                <Table>
                    <TableHeader><TableRow><TableHead>Index</TableHead><TableHead>Code</TableHead><TableHead>Label</TableHead><TableHead>Category</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {data.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{item.orderIndex}</TableCell>
                                <TableCell>{item.code}</TableCell>
                                <TableCell>{item.label}</TableCell>
                                <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                                <TableCell>
                                    {canManage && (
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editing ? "Edit Status" : "Add Status"}</DialogTitle></DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Code</Label><Input {...form.register("code")} /></div>
                            <div><Label>Label</Label><Input {...form.register("label")} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Category</Label><Input {...form.register("category")} placeholder="OPEN, IN_PROGRESS, DONE" /></div>
                            <div><Label>Order</Label><Input type="number" {...form.register("orderIndex")} /></div>
                        </div>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("isTerminal")} /> Terminal</label>
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("isEditable")} /> Editable</label>
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("active")} /> Active</label>
                        </div>
                        <DialogFooter><Button type="submit">Save</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}


export function GeneralSettings({ vehicleTypes, locations, statuses, permissions }: { vehicleTypes: any[], locations: any[], statuses: any[], permissions: Record<string, boolean> }) {
    return (
        <Tabs defaultValue="vehicles" className="space-y-4">
            <TabsList>
                <TabsTrigger value="vehicles">Vehicle Types</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
                <TabsTrigger value="statuses">Statuses</TabsTrigger>
            </TabsList>

            <TabsContent value="vehicles">
                <Card>
                    <CardHeader><CardTitle>Vehicle Types</CardTitle><CardDescription>Manage supported vehicle classifications</CardDescription></CardHeader>
                    <CardContent>
                        <VehicleTypeManager data={vehicleTypes} canManage={permissions["etc.settings.vehicle_types.manage"]} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="locations">
                <Card>
                    <CardHeader><CardTitle>Installation Locations</CardTitle><CardDescription>Manage field locations and centers</CardDescription></CardHeader>
                    <CardContent>
                        <LocationManager data={locations} canManage={permissions["etc.settings.locations.manage"]} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="statuses">
                <Card>
                    <CardHeader><CardTitle>Request Statuses</CardTitle><CardDescription>Configure workflow statuses</CardDescription></CardHeader>
                    <CardContent>
                        <StatusManager data={statuses} canManage={permissions["etc.settings.statuses.manage"]} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
