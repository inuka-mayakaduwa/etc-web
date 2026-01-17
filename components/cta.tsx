"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

export default function CTA() {
    const t = useTranslations("Public.Landing.CTA")

    return (
        <section className="w-full py-16 md:py-24 bg-accent text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
                    {t("Title")}
                </h2>
                <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
                    {t("Description")}
                </p>
                <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-accent hover:bg-white/90 font-bold"
                >
                    {t("Button")}
                </Button>
            </div>
        </section>
    )
}
