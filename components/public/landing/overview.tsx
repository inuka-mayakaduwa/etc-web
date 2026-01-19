"use client"
import {
    Zap,
    Wallet,
    Gauge,
    CreditCard,
    Activity,
    Clock,
    TrendingUp,
    Shield,
    Leaf,
    Fuel,
    Smartphone,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useIsMobile } from "@/hooks/use-mobile"
import CardSwap, { Card as SwapCard } from "./CardSwap"

// Map of icon names to components (combining both sets)
const iconMap: { [key: string]: any } = {
    Zap,
    Wallet,
    Gauge,
    CreditCard,
    Activity,
    Clock,
    TrendingUp,
    Shield,
    Leaf,
    Fuel,
    Smartphone,
}

export default function Overview() {
    const tAbout = useTranslations("Public.Landing.About")
    const tBenefits = useTranslations("Public.Landing.Benefits")
    const isMobile = useIsMobile()

    const aboutFeatures = tAbout.raw("Features") as { Title: string; Description: string; Icon: string }[]
    const benefitItems = tBenefits.raw("Items") as { Title: string; Description: string; Icon: string }[]

    return (
        <section id="about" className="w-full py-16 md:pt-24 md:pb-48 bg-card overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column: About Content */}
                    <div className="space-y-8 animate-slide-in-left">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">{tAbout("Title")}</h2>
                            <p className="text-lg text-foreground/70">{tAbout("Description")}</p>
                        </div>

                        <div className="space-y-6">
                            {aboutFeatures.map((feature, index) => {
                                const Icon = iconMap[feature.Icon] || Zap
                                return (
                                    <div key={index} className="flex gap-4 items-start">
                                        <div className="p-3 rounded-lg bg-background border border-border shrink-0">
                                            <Icon className="w-6 h-6 text-secondary" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground mb-1">{feature.Title}</h3>
                                            <p className="text-foreground/70">{feature.Description}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right Column: Responsive Benefits */}
                    <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                        {isMobile ? (
                            // Mobile: Responsive grid layout
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {benefitItems.map((item, index) => {
                                    const Icon = iconMap[item.Icon] || Leaf
                                    return (
                                        <div
                                            key={index}
                                            className="bg-card border-2 border-secondary p-6 rounded-lg flex flex-col items-center justify-center text-center shadow-lg"
                                        >
                                            <div className="flex justify-center mb-4">
                                                <Icon className="w-12 h-12 text-accent" />
                                            </div>
                                            <h3 className="text-lg font-bold text-foreground mb-2">{item.Title}</h3>
                                            <p className="text-foreground/70 text-sm">{item.Description}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            // Desktop: CardSwap animation
                            <div className="relative flex flex-col items-center justify-center min-h-[500px]">
                                <div style={{ height: "500px", width: "100%", position: "relative" }} className="flex justify-center">
                                    <CardSwap
                                        cardDistance={50}
                                        verticalDistance={60}
                                        delay={4000}
                                        pauseOnHover={true}
                                        width={320}
                                        height={420}
                                    >
                                        {benefitItems.map((item, index) => {
                                            const Icon = iconMap[item.Icon] || Leaf
                                            return (
                                                <SwapCard
                                                    key={index}
                                                    customClass="!bg-card !border-2 !border-secondary p-8 flex flex-col items-center justify-center text-center shadow-2xl cursor-pointer"
                                                >
                                                    <div className="flex justify-center mb-6">
                                                        <Icon className="w-16 h-16 text-accent" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-foreground mb-4">{item.Title}</h3>
                                                    <p className="text-foreground/70 text-sm md:text-base">{item.Description}</p>
                                                </SwapCard>
                                            )
                                        })}
                                    </CardSwap>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
