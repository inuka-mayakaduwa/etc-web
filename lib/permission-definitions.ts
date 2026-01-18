export const DEFINED_PERMISSIONS = [
    { category: "Settings", node: "etc.settings.roles.view", description: "View Roles" },
    { category: "Settings", node: "etc.settings.roles.write", description: "Create/Edit/Delete Roles" },
    { category: "Settings", node: "etc.settings.users.view", description: "View Users" },
    { category: "Settings", node: "etc.settings.users.write", description: "Create/Edit/Delete Users" },
    { category: "Settings", node: "etc.settings.vehicle_types.manage", description: "Manage Vehicle Types" },
    { category: "Settings", node: "etc.settings.locations.manage", description: "Manage Installation Locations" },
    { category: "Settings", node: "etc.settings.statuses.manage", description: "Manage Request Statuses" },
    { node: 'etc.payment.view', description: 'View payment records' },
    { node: 'etc.payment.verify', description: 'Approve or reject payments' },

    // Appointments
    { node: 'etc.appointments.manage', description: 'Manage appointment slots and schedules' },

    // Settings
    { node: 'etc.settings.view', description: 'View system settings' },
    { category: "Request", node: "etc.requests.view", description: "View Requests" },
    { category: "Request", node: "etc.requests.approve_info", description: "Approve Request Information" },
    { category: "Request", node: "etc.requests.review_info", description: "Request Information Edits" },
    { category: "Request", node: "etc.requests.reject", description: "Reject Requests" },
    { category: "Request", node: "etc.requests.manage_tags", description: "Manage RFID Tags" },
    { category: "Request", node: "etc.requests.cancel", description: "Cancel Requests" },
    { category: "Request", node: "etc.requests.refund", description: "Process Refunds" },
    // { category: "Appointment", node: "etc.appointments.manage", description: "Manage Appointments" }, // Duplicate
    { category: "Installation", node: "etc.installations.complete", description: "Complete Installations" },
    // { category: "System", node: "etc.settings.view", description: "View Settings Menu" }, // Duplicate
    { category: "System", node: "etc.provisioning.manage", description: "Manage Provisioning" },
]
