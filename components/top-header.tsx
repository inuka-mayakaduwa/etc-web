"use client"

import { useTranslations, useLocale } from "next-intl"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"

export default function TopHeader() {
    const t = useTranslations("Common")
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()

    // Function to switch language
    const switchLanguage = (newLocale: string) => {
        // Strip off the existing locale prefix
        const segments = pathname.split("/")

        let pathWithoutLocale = pathname
        if (segments.length > 1 && ["en", "si", "ta"].includes(segments[1])) {
            // remove the locale part
            const rest = segments.slice(2).join("/")
            pathWithoutLocale = `/${rest}`
        } else if (pathname === "/en" || pathname === "/si" || pathname === "/ta") {
            pathWithoutLocale = "/"
        }

        router.push(`/${newLocale}${pathWithoutLocale}`)
    }

    // Helper to build button classes
    const langButtonClass = (lang: string) =>
        `h-6 px-2 text-xs font-medium hover:bg-gray-200 ${locale === lang ? "font-bold underline" : ""
        }`

    return (
        <div className="w-full bg-gray-100 border-b border-gray-200 py-1">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <div className="relative h-4 w-6">
                            <Image
                                src="/assets/sl-flag.svg"
                                alt="Sri Lanka Flag"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="text-xs text-gray-700">{t("GovWebDeclare")}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={langButtonClass("si")}
                            onClick={() => switchLanguage("si")}
                        >
                            සිංහල
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={langButtonClass("en")}
                            onClick={() => switchLanguage("en")}
                        >
                            English
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={langButtonClass("ta")}
                            onClick={() => switchLanguage("ta")}
                        >
                            தமிழ்
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
