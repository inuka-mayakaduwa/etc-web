"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Calendar as CalendarIcon, Clock, Settings, Plus, Edit, Trash2, Copy } from "lucide-react"
import {
    getLocationSchedule,
    updateLocationSchedule,
    copyScheduleToDay,
    getLocationCapacityRules,
    createCapacityRule,
    updateCapacityRule,
    deleteCapacityRule,
    getLocationCalendarBlocks,
    createCalendarBlock,
    deleteCalendarBlock,
    getLocationSlotConfig,
    updateLocationSlotConfig
} from "./actions"

export function AppointmentConfiguration({ locations }: { locations: any[] }) {
    const router = useRouter()
    const [selectedLocation, setSelectedLocation] = useState(locations[0]?.id || "")
    const [activeTab, setActiveTab] = useState("schedule")

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Select Location</CardTitle>
                        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                            <SelectTrigger className="w-[300px]">
                                <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                                {locations.map(loc => (
                                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
            </Card>

            {selectedLocation && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="schedule">
                            <Clock className="h-4 w-4 mr-2" />
                            Weekly Schedule
                        </TabsTrigger>
                        <TabsTrigger value="capacity">
                            <Settings className="h-4 w-4 mr-2" />
                            Capacity Rules
                        </TabsTrigger>
                        <TabsTrigger value="blocks">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Calendar Blocks
                        </TabsTrigger>
                        <TabsTrigger value="config">
                            <Settings className="h-4 w-4 mr-2" />
                            Slot Config
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="schedule">
                        <WeeklyScheduleEditor locationId={selectedLocation} />
                    </TabsContent>

                    <TabsContent value="capacity">
                        <CapacityRulesManager locationId={selectedLocation} />
                    </TabsContent>

                    <TabsContent value="blocks">
                        <CalendarBlocksManager locationId={selectedLocation} />
                    </TabsContent>

                    <TabsContent value="config">
                        <SlotConfigEditor locationId={selectedLocation} />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    )
}

// ============================================================================
// WEEKLY SCHEDULE EDITOR
// ============================================================================

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function WeeklyScheduleEditor({ locationId }: { locationId: string }) {
    const router = useRouter()
    const [schedule, setSchedule] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDay, setSelectedDay] = useState(0)

    useEffect(() => {
        loadSchedule()
    }, [locationId])

    const loadSchedule = async () => {
        setLoading(true)
        try {
            const data = await getLocationSchedule(locationId)
            setSchedule(data)
        } catch (error: any) {
            toast.error(error.message || "Failed to load schedule")
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (dayOfWeek: number, isOpen: boolean, openTime?: string, closeTime?: string) => {
        try {
            await updateLocationSchedule(locationId, dayOfWeek, { isOpen, openTime, closeTime })
            toast.success("Schedule updated")
            loadSchedule()
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to update schedule")
        }
    }

    const handleCopy = async (fromDay: number, toDay: number) => {
        try {
            await copyScheduleToDay(locationId, fromDay, toDay)
            toast.success(`Copied ${DAYS[fromDay]} schedule to ${DAYS[toDay]}`)
            loadSchedule()
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to copy schedule")
        }
    }

    if (loading) {
        return <div className="text-center py-8">Loading schedule...</div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>Configure working hours for each day of the week</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {schedule.map((day, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="w-32">
                                <span className="font-medium">{DAYS[index]}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={day.isOpen}
                                    onCheckedChange={(checked) => {
                                        if (!checked) {
                                            handleUpdate(index, false)
                                        } else {
                                            handleUpdate(index, true, "09:00", "17:00")
                                        }
                                    }}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {day.isOpen ? 'Open' : 'Closed'}
                                </span>
                            </div>
                            {day.isOpen && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs">From:</Label>
                                        <Input
                                            type="time"
                                            value={day.openTime || "09:00"}
                                            onChange={(e) => handleUpdate(index, true, e.target.value, day.closeTime)}
                                            className="w-32"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs">To:</Label>
                                        <Input
                                            type="time"
                                            value={day.closeTime || "17:00"}
                                            onChange={(e) => handleUpdate(index, true, day.openTime, e.target.value)}
                                            className="w-32"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const targetDay = prompt(`Copy to which day? (0-6, current: ${index})`)
                                            if (targetDay && parseInt(targetDay) >= 0 && parseInt(targetDay) <= 6) {
                                                handleCopy(index, parseInt(targetDay))
                                            }
                                        }}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================================================
// CAPACITY RULES MANAGER
// ============================================================================

function CapacityRulesManager({ locationId }: { locationId: string }) {
    const router = useRouter()
    const [rules, setRules] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [createOpen, setCreateOpen] = useState(false)
    const [ruleData, setRuleData] = useState({
        dayOfWeek: null as number | null,
        startTime: null as string | null,
        endTime: null as string | null,
        capacity: 5,
        priority: 0
    })

    useEffect(() => {
        loadRules()
    }, [locationId])

    const loadRules = async () => {
        setLoading(true)
        try {
            const data = await getLocationCapacityRules(locationId)
            setRules(data)
        } catch (error: any) {
            toast.error(error.message || "Failed to load rules")
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        try {
            await createCapacityRule({
                locationId,
                ...ruleData
            })
            toast.success("Capacity rule created")
            setCreateOpen(false)
            setRuleData({ dayOfWeek: null, startTime: null, endTime: null, capacity: 5, priority: 0 })
            loadRules()
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to create rule")
        }
    }

    const handleDelete = async (ruleId: string) => {
        if (!confirm("Delete this capacity rule?")) return

        try {
            await deleteCapacityRule(ruleId)
            toast.success("Rule deleted")
            loadRules()
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to delete rule")
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Capacity Rules</CardTitle>
                            <CardDescription>Define how many parallel appointments can be handled</CardDescription>
                        </div>
                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Rule
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading rules...</div>
                    ) : rules.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No capacity rules defined. Default capacity is 1.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Day</TableHead>
                                    <TableHead>Time Range</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rules.map(rule => (
                                    <TableRow key={rule.id}>
                                        <TableCell>{rule.priority}</TableCell>
                                        <TableCell>
                                            {rule.dayOfWeek !== null ? DAYS[rule.dayOfWeek] : 'All Days'}
                                        </TableCell>
                                        <TableCell>
                                            {rule.startTime || 'Open'} - {rule.endTime || 'Close'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge>{rule.capacity} slots</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(rule.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Capacity Rule</DialogTitle>
                        <DialogDescription>Define capacity for specific times/days</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Day of Week (optional)</Label>
                            <Select
                                value={ruleData.dayOfWeek?.toString() || "all"}
                                onValueChange={(v) => setRuleData({
                                    ...ruleData,
                                    dayOfWeek: v === "all" ? null : parseInt(v)
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Days</SelectItem>
                                    {DAYS.map((day, i) => (
                                        <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Start Time (optional)</Label>
                                <Input
                                    type="time"
                                    value={ruleData.startTime || ""}
                                    onChange={(e) => setRuleData({ ...ruleData, startTime: e.target.value || null })}
                                />
                            </div>
                            <div>
                                <Label>End Time (optional)</Label>
                                <Input
                                    type="time"
                                    value={ruleData.endTime || ""}
                                    onChange={(e) => setRuleData({ ...ruleData, endTime: e.target.value || null })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Capacity</Label>
                            <Input
                                type="number"
                                min="1"
                                value={ruleData.capacity}
                                onChange={(e) => setRuleData({ ...ruleData, capacity: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <Label>Priority (higher = takes precedence)</Label>
                            <Input
                                type="number"
                                value={ruleData.priority}
                                onChange={(e) => setRuleData({ ...ruleData, priority: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Create Rule</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

// ============================================================================
// CALENDAR BLOCKS MANAGER
// ============================================================================

function CalendarBlocksManager({ locationId }: { locationId: string }) {
    const router = useRouter()
    const [blocks, setBlocks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [createOpen, setCreateOpen] = useState(false)
    const [blockType, setBlockType] = useState<'FULL_DAY' | 'TIME_RANGE'>('FULL_DAY')
    const [blockDate, setBlockDate] = useState("")
    const [startDateTime, setStartDateTime] = useState("")
    const [endDateTime, setEndDateTime] = useState("")
    const [reason, setReason] = useState("")

    useEffect(() => {
        loadBlocks()
    }, [locationId])

    const loadBlocks = async () => {
        setLoading(true)
        try {
            const data = await getLocationCalendarBlocks(locationId)
            setBlocks(data)
        } catch (error: any) {
            toast.error(error.message || "Failed to load blocks")
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        try {
            if (blockType === 'FULL_DAY') {
                await createCalendarBlock({
                    locationId,
                    blockType,
                    blockDate: new Date(blockDate),
                    reason
                })
            } else {
                await createCalendarBlock({
                    locationId,
                    blockType,
                    startAt: new Date(startDateTime),
                    endAt: new Date(endDateTime),
                    reason
                })
            }
            toast.success("Block created")
            setCreateOpen(false)
            resetForm()
            loadBlocks()
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to create block")
        }
    }

    const handleDelete = async (blockId: string) => {
        if (!confirm("Delete this block?")) return

        try {
            await deleteCalendarBlock(blockId)
            toast.success("Block deleted")
            loadBlocks()
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to delete block")
        }
    }

    const resetForm = () => {
        setBlockType('FULL_DAY')
        setBlockDate("")
        setStartDateTime("")
        setEndDateTime("")
        setReason("")
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Calendar Blocks</CardTitle>
                            <CardDescription>Block specific dates or time ranges</CardDescription>
                        </div>
                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Block
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading blocks...</div>
                    ) : blocks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No calendar blocks defined.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {blocks.map(block => (
                                <div key={block.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={block.blockType === 'FULL_DAY' ? 'default' : 'secondary'}>
                                                {block.blockType}
                                            </Badge>
                                            {block.blockType === 'FULL_DAY' ? (
                                                <span>{new Date(block.blockDate).toLocaleDateString()}</span>
                                            ) : (
                                                <span>
                                                    {new Date(block.startAt).toLocaleString()} - {new Date(block.endAt).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        {block.reason && (
                                            <div className="text-sm text-muted-foreground mt-1">{block.reason}</div>
                                        )}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleDelete(block.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Calendar Block</DialogTitle>
                        <DialogDescription>Block appointments for a date or time range</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Block Type</Label>
                            <Select value={blockType} onValueChange={(v: any) => setBlockType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FULL_DAY">Full Day</SelectItem>
                                    <SelectItem value="TIME_RANGE">Time Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {blockType === 'FULL_DAY' ? (
                            <div>
                                <Label>Date</Label>
                                <Input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Start Date/Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={startDateTime}
                                        onChange={(e) => setStartDateTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>End Date/Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={endDateTime}
                                        onChange={(e) => setEndDateTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <Label>Reason (optional)</Label>
                            <Input
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g., Public Holiday, Staff Training"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Create Block</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

// ============================================================================
// SLOT CONFIGURATION EDITOR
// ============================================================================

function SlotConfigEditor({ locationId }: { locationId: string }) {
    const router = useRouter()
    const [config, setConfig] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        serviceDuration: 60,
        bufferBefore: 0,
        bufferAfter: 0,
        minAdvanceHours: 24,
        maxAdvanceDays: 30
    })

    useEffect(() => {
        loadConfig()
    }, [locationId])

    const loadConfig = async () => {
        setLoading(true)
        try {
            const data = await getLocationSlotConfig(locationId)
            setConfig(data)
            setFormData({
                serviceDuration: data.serviceDuration,
                bufferBefore: data.bufferBefore,
                bufferAfter: data.bufferAfter,
                minAdvanceHours: data.minAdvanceHours,
                maxAdvanceDays: data.maxAdvanceDays
            })
        } catch (error: any) {
            toast.error(error.message || "Failed to load config")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            await updateLocationSlotConfig(locationId, formData)
            toast.success("Configuration saved")
            loadConfig()
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to save config")
        }
    }

    if (loading) {
        return <div className="text-center py-8">Loading configuration...</div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Slot Configuration</CardTitle>
                <CardDescription>Configure slot duration, service time, and booking windows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Service Duration (minutes)</Label>
                    <Input
                        type="number"
                        min="15"
                        step="15"
                        value={formData.serviceDuration}
                        onChange={(e) => setFormData({ ...formData, serviceDuration: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Time needed for the service (also determines slot intervals)
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Buffer Before (minutes)</Label>
                        <Input
                            type="number"
                            min="0"
                            value={formData.bufferBefore}
                            onChange={(e) => setFormData({ ...formData, bufferBefore: parseInt(e.target.value) })}
                        />
                    </div>
                    <div>
                        <Label>Buffer After (minutes)</Label>
                        <Input
                            type="number"
                            min="0"
                            value={formData.bufferAfter}
                            onChange={(e) => setFormData({ ...formData, bufferAfter: parseInt(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Min Advance (hours)</Label>
                        <Input
                            type="number"
                            min="0"
                            value={formData.minAdvanceHours}
                            onChange={(e) => setFormData({ ...formData, minAdvanceHours: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Minimum hours in advance for booking
                        </p>
                    </div>
                    <div>
                        <Label>Max Advance (days)</Label>
                        <Input
                            type="number"
                            min="1"
                            value={formData.maxAdvanceDays}
                            onChange={(e) => setFormData({ ...formData, maxAdvanceDays: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Maximum days in advance for booking
                        </p>
                    </div>
                </div>

                <div className="pt-4">
                    <Button onClick={handleSave}>Save Configuration</Button>
                </div>
            </CardContent>
        </Card>
    )
}
