"use client"

import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar"
import { Home, CreditCard, Settings, LogOut, FileText, Calendar } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

export default function AdminSidebar({ children, permissions }: { children: React.ReactNode, permissions: Record<string, boolean> }) {
    const pathname = usePathname()

    // Simple active check. adjust for locale if needed or uses matches
    const isActive = (path: string) => pathname?.includes(path)

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar>
                    <SidebarHeader className="p-4 border-b">
                        <h2 className="text-lg font-bold tracking-tight">ETC Admin</h2>
                    </SidebarHeader>
                    <SidebarContent>
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
                <main className="flex-1 overflow-auto bg-background p-6">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    )
}
