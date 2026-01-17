"use client"

import { Card } from "@/components/ui/card"
import { useTranslations } from "next-intl"

const partners = [
  {
    name: "TransWay",
    logo: "🚗",
  },
  {
    name: "HighRoute",
    logo: "🛣️",
  },
  {
    name: "FastLane",
    logo: "⚡",
  },
]

export default function Partners() {
  const t = useTranslations("Public.Landing.Partners")

  return (
    <section className="w-full py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("Title")}
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            {t("Description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {partners.map((partner, index) => (
            <Card
              key={index}
              className="p-8 flex flex-col items-center justify-center text-center bg-card border-border hover:border-secondary hover:shadow-md transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-6xl mb-4">{partner.logo}</div>
              <h3 className="text-xl font-bold text-foreground">{partner.name}</h3>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
