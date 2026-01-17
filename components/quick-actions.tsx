"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UserPlus, LogIn, MapPin } from "lucide-react"
import { useTranslations } from "next-intl"

export default function QuickActions() {
  const t = useTranslations("Public.Landing.QuickActions")

  const actions = [
    {
      key: "Register",
      icon: UserPlus,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      key: "Login",
      icon: LogIn,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      key: "Track",
      icon: MapPin,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ]

  return (
    <section className="w-full py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Card
                key={index}
                className="p-8 text-center hover:shadow-xl transition-all duration-300 border border-border/50 bg-card hover:border-accent/30 hover:bg-accent/5 rounded-xl"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-center mb-6">
                  <div className={`w-16 h-16 flex items-center justify-center rounded-lg ${action.bgColor}`}>
                    <Icon className={`w-8 h-8 ${action.color}`} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{t(`${action.key}.Title`)}</h3>
                <p className="text-sm text-foreground/70 mb-6 leading-relaxed">{t(`${action.key}.Description`)}</p>
                <Button className="w-full bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition-colors">
                  {t(`${action.key}.Button`)}
                </Button>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
