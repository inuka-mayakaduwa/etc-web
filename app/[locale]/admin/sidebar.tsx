"use client"

import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarInset } from "@/components/ui/sidebar"
import { FileText, CreditCard, Settings, LogOut, Calendar, Command } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { CommandPalette } from "@/components/admin/command-palette"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AdminSidebarEnhanced({ children, permissions }: { children: React.ReactNode, permissions: Record<string, boolean> }) {
    const pathname = usePathname()

    const isActive = (path: string) => pathname?.includes(path)

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar>
                    <SidebarHeader className="p-4 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight">ETC Admin</h2>
                                <p className="text-xs text-muted-foreground">Management Portal</p>
                            </div>
                        </div>
                    </SidebarHeader>
                    
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <div className="px-3 py-2">
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start gap-2"
                                        onClick={() => {
                                            const event = new KeyboardEvent('keydown', {
                                                key: 'k',
                                                metaKey: true,
                                                bubbles: true
                                            })
                                            document.dispatchEvent(event)
                                        }}
                                    >
                                        <Command className="h-4 w-4" />
                                        <span className="flex-1 text-left">Command Menu</span>
                                        <Badge variant="secondary" className="text-xs">⌘K</Badge>
                                    </Button>
                                </div>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarGroup>
                            <SidebarGroupLabel>Management</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {permissions["etc.requests.view"] && (
                                        <SidebarMenuItem>
                                            <SidebarMenuButton asChild isActive={isActive("/admin/requests") || pathname?.endsWith("/admin")}>
                                                <Link href="/admin/requests">
                                                    <FileText />
                                                    <span>Requests</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )}
                                    {permissions["etc.payment.view"] && (
                                        <SidebarMenuItem>
                                            <SidebarMenuButton asChild isActive={isActive("/admin/payments")}>
                                                <Link href="/admin/payments">
                                                    <CreditCard />
                                                    <span>Payments</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )}
                                    {permissions["etc.appointments.manage"] && (
                                        <SidebarMenuItem>
                                            <SidebarMenuButton asChild isActive={isActive("/admin/appointments")}>
                                                <Link href="/admin/appointments">
                                                    <Calendar />
                                                    <span>Appointments</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarGroup>
                            <SidebarGroupLabel>System</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {permissions["etc.settings.view"] && (
                                        <SidebarMenuItem>
                                            <SidebarMenuButton asChild isActive={isActive("/admin/settings")}>
                                                <Link href="/admin/settings">
                                                    <Settings />
                                                    <span>Settings</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                    
                    <SidebarFooter className="p-4 border-t">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => signOut({ callbackUrl: "/admin/login" })}>
                                    <LogOut />
                                    <span>Log Out</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>
                
                <SidebarInset className="flex-1">
                    <main className="p-6">
                        {children}
                    </main>
                </SidebarInset>
            </div>
            <CommandPalette permissions={permissions} />
        </SidebarProvider>
    )
}
