import { z } from "zod"

export const userSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    mobile: z.string().min(10, "Invalid mobile number"),
    active: z.boolean().default(true),
    roleIds: z.array(z.string()).optional(),
})

export type UserFormData = z.infer<typeof userSchema>
