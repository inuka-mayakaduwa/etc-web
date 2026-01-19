"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Search, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

export default function TrackPage() {
    const t = useTranslations("Public.Track")
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const formSchema = z.object({
        requestNo: z
            .string()
            .min(1, t("Error.Required"))
            .regex(/^RQ-[A-Z0-9]{5}$/, t("Error.InvalidFormat")),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            requestNo: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        // Simulate a small delay for better UX or actual validation check if needed
        // For now, we trust the regex and redirect
        setTimeout(() => {
            router.push(`/etc/track/${values.requestNo}`)
            setIsLoading(false)
        }, 500)
    }

    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-2">
                <CardHeader>
                    <Link href="/" className="text-sm text-muted-foreground flex items-center gap-1 mb-2 hover:text-primary transition-colors">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                    <CardTitle className="text-2xl font-bold text-primary">{t("Title")}</CardTitle>
                    <CardDescription className="text-base">
                        {t("Description")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="requestNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="sr-only">Request Number</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                                <Input
                                                    placeholder={t("InputPlaceholder")}
                                                    className="pl-10 h-12 text-lg"
                                                    maxLength={8}
                                                    {...field}
                                                    onChange={(e) => {
                                                        // Auto-uppercase
                                                        const val = e.target.value.toUpperCase();
                                                        field.onChange(val);
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Checking...
                                    </>
                                ) : (
                                    t("Button")
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center bg-muted/20 py-4 mt-2">
                    <p className="text-xs text-muted-foreground text-center">
                        Need help? Contact support at <a href="tel:1969" className="font-medium underline hover:text-primary">1969</a>
                    </p>
                </CardFooter>
            </Card>
        </main>
    )
}
