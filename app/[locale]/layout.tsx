import type React from "react"
import { NextIntlClientProvider } from "next-intl"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import Header from "@/components/header"
import TopHeader from "@/components/top-header"

// statically import each file so the bundler knows about them
import en from "../../messages/en.json"
import si from "../../messages/si.json"
import ta from "../../messages/ta.json"

// Define a more accurate type for the messages
type Messages = typeof en

const messagesMap: Record<string, Messages> = {
    en,
    si,
    ta,
}

// Map locales to language codes
const localeToLang: Record<string, string> = {
    en: "en",
    si: "si",
    ta: "ta",
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    // Await the params object before destructuring
    const { locale } = await params

    // Type check locale to ensure it's a valid key
    if (!routing.locales.includes(locale as any)) {
        notFound()
    }

    const messages = messagesMap[locale] || messagesMap.en
    const lang = localeToLang[locale] || "en"

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <div className="flex flex-col min-h-screen" lang={lang}>
                <TopHeader />
                <Header />
                {children}
            </div>
        </NextIntlClientProvider>
    )
}
