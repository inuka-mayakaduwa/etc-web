import { redirect } from "next/navigation"

export default function AdminDashboardPage() {
    // Redirect to requests page as default
    redirect("/admin/requests")
}
