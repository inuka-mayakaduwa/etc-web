"use client"

import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

export default function Hero() {
  const t = useTranslations("Public.Landing.Hero")

  return (
    <section className="relative w-full bg-gradient-to-b from-primary to-secondary overflow-hidden pt-20 md:pt-16 pb-16 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div
            className="text-primary-foreground space-y-6 animate-slide-in-left order-2 md:order-1"
            style={{ animationDelay: "0.1s" }}
          >
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance">
                {t("Title")}
              </h1>
            </div>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90 leading-relaxed">
              {t("Subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 pb-8 md:pb-0">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white font-semibold flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {t("GetStarted")} <ChevronRight size={20} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 font-semibold bg-transparent w-full sm:w-auto"
              >
                {t("LearnMore")}
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <div
            className="flex items-center justify-center animate-fade-in-up order-1 md:order-2"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="relative w-full max-w-sm md:max-w-md lg:max-w-lg">
              <img
                src="https://pub-4515856afb144f48b424b21c14a3d927.r2.dev/uploads/1768607974459-etc-img.png"
                alt="ETC Lane"
                className="w-full h-auto rounded-lg shadow-2xl object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:flex absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="flex flex-col items-center gap-2 text-primary-foreground/60">
          <span className="text-sm font-medium">{t("ScrollToExplore")}</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  )
}
