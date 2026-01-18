"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createRole, updateRole, deleteRole } from "./actions" // Assuming imported here
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

// Re-defining schema here or importing it? Better to export from actions.
const roleSchema = z.object({
    name: z.string().min(1, "Name is required"),
    permissionIds: z.array(z.string()).optional()
})
type RoleFormData = z.infer<typeof roleSchema>

export function RoleManagement({ roles, permissions, canWrite = false }: { roles: any[], permissions: any[], canWrite?: boolean }) {
    const [open, setOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<any | null>(null)

    const handleEdit = (role: any) => {
        setEditingRole(role)
        setOpen(true)
    }

    const handleCreate = () => {
        setEditingRole(null)
        setOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this role?")) return;
        try {
            await deleteRole(id)
            toast.success("Role deleted")
        } catch {
            toast.error("Failed")
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                {canWrite && (
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Add Role
                    </Button>
                )}
            </div>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role Name</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.map((role) => (
                            <TableRow key={role.id}>
                                <TableCell className="font-medium">{role.name}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1 max-w-lg">
                                        {role.rolePermissions.length > 0 ? (
                                            role.rolePermissions.slice(0, 5).map((rp: any) => (
                                                <Badge key={rp.permission.id} variant="outline" className="text-xs">
                                                    {rp.permission.node}
                                                </Badge>
                                            ))
                                        ) : <span className="text-muted-foreground text-xs">No permissions</span>}
                                        {role.rolePermissions.length > 5 && (
                                            <Badge variant="secondary" className="text-xs">+{role.rolePermissions.length - 5} more</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {canWrite && (
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(role)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(role.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <RoleFormDialog
                open={open}
                onOpenChange={setOpen}
                initialData={editingRole}
                permissions={permissions}
            />
        </div>
    )
}

function RoleFormDialog({ open, onOpenChange, initialData, permissions }: { open: boolean, onOpenChange: (open: boolean) => void, initialData?: any, permissions: any[] }) {
    const form = useForm<RoleFormData>({
        resolver: zodResolver(roleSchema),
        defaultValues: { name: "", permissionIds: [] }
    })
    const [loading, setLoading] = useState(false)

    // Reset form when initialData changes
    const { reset } = form

    // We need useEffect to update the form values when the dialog opens with new data
    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    permissionIds: initialData.rolePermissions?.map((rp: any) => rp.permissionId) || []
                })
            } else {
                reset({
                    name: "",
                    permissionIds: []
                })
            }
        }
    }, [initialData, open, reset])

    const onSubmit = async (data: RoleFormData) => {
        setLoading(true)
        try {
            if (initialData) {
                await updateRole(initialData.id, data)
                toast.success("Role updated")
            } else {
                await createRole(data)
                toast.success("Role created")
            }
            onOpenChange(false)
        } catch (e) {
            toast.error("Failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Role" : "Create Role"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    <div>
                        <Label>Name</Label>
                        <Input {...form.register("name")} defaultValue={initialData?.name} />
                        {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
                    </div>

                    {initialData && (
                        <div>
                            <Label className="mb-2 block">Assigned Users</Label>
                            <div className="border rounded-md p-2 bg-muted/30 max-h-[150px] overflow-y-auto">
                                {initialData.userRoles && initialData.userRoles.length > 0 ? (
                                    <ul className="space-y-1">
                                        {initialData.userRoles.map((ur: any) => (
                                            <li key={ur.systemUser.id} className="text-sm flex flex-col sm:flex-row sm:justify-between sm:items-center p-1 hover:bg-muted/50 rounded">
                                                <span className="font-medium">{ur.systemUser.name}</span>
                                                <span className="text-xs text-muted-foreground">{ur.systemUser.email}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic p-2">No users currently assigned to this role.</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-hidden flex flex-col">
                        <Label className="mb-2 block">Permissions</Label>
                        <ScrollArea className="flex-1 border rounded-md p-4 max-h-[400px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {permissions.map((perm) => (
                                    <div key={perm.id} className="flex items-start space-x-2">
                                        <input
                                            type="checkbox"
                                            value={perm.id}
                                            {...form.register("permissionIds")}
                                            defaultChecked={initialData?.rolePermissions?.some((rp: any) => rp.permissionId === perm.id)}
                                            className="mt-1"
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {perm.node}
                                            </label>
                                            <p className="text-xs text-muted-foreground">{perm.description || "No description"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
