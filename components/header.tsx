"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"

import { useTranslations } from "next-intl"

export default function Header() {
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const t = useTranslations("Public.Landing.Navigation")
    const tCommon = useTranslations("Common")

    useEffect(() => {
        setMounted(true)
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const navItems = [
        { name: t("About"), href: "#about" },
        { name: t("Benefits"), href: "#benefits" },
        { name: t("Contact"), href: "#contact" },
    ]

    return (
        <nav
            className={cn(
                "fixed z-50 left-1/2 -translate-x-1/2 transition-all duration-500 ease-in-out",
                scrolled
                    ? "top-14 w-[98%] max-w-5xl rounded-full bg-background/80 backdrop-blur-md border border-border/40 py-2 px-2 shadow-sm dark:shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                    : "top-8 w-[98%] max-w-7xl bg-transparent py-4 border-transparent",
            )}
        >
            <div
                className={cn("flex items-center justify-between transition-all duration-500", scrolled ? "gap-4" : "gap-4")}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <Link href="/" className="flex items-center gap-2 transition-all duration-500 hover:scale-105 flex-shrink-0">
                        <img
                            src="/assets/logo.jpg"
                            alt="Logo"
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <span
                            className={cn(
                                "hidden sm:inline font-bold text-sm sm:text-lg whitespace-nowrap",
                                scrolled ? "text-foreground" : "text-primary-foreground",
                            )}
                        >
                            Electronic Toll Collection
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-4 lg:gap-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "text-sm font-medium transition-colors uppercase tracking-wide whitespace-nowrap",
                                    scrolled ? "text-foreground/80 hover:text-accent" : "text-primary-foreground/80 hover:text-white",
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex gap-1 sm:gap-2">
                        <Link
                            href="/login"
                            className={cn(
                                "px-3 sm:px-6 py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] whitespace-nowrap",
                                scrolled
                                    ? "bg-foreground text-background hover:bg-accent hover:text-white hover:shadow-[0_0_20px_rgba(232,154,92,0.5)]"
                                    : "bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20",
                            )}
                        >
                            {tCommon("Login")}
                        </Link>
                        <Link
                            href="/register"
                            className="px-3 sm:px-6 py-2 rounded-full bg-accent text-white font-bold text-xs sm:text-sm hover:bg-accent/90 transition-all duration-300 shadow-lg whitespace-nowrap"
                        >
                            {tCommon("Register")}
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}
