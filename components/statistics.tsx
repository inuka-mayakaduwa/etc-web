"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Users, Activity, Map, Headphones } from "lucide-react"
import { useTranslations } from "next-intl"

const icons = [Users, Activity, Map, Headphones]

function CountUpNumber({ target, suffix }: { target: string | number; suffix?: string }) {
  // Simple check if it's a number-like string to animate
  const num = typeof target === 'string' ? parseFloat(target.replace(/[^0-9.]/g, '')) : target
  const isNumber = !isNaN(num as number)

  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isNumber) return
    const duration = 2000
    const start = Date.now()

    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      setCount(Math.floor((num as number) * progress))

      if (progress === 1) {
        clearInterval(timer)
      }
    }, 16)

    return () => clearInterval(timer)
  }, [num, isNumber])

  if (!isNumber) return <span className="animate-count-up">{target}</span>

  // Very basic formatting for the demo based on the original component's logic
  // The original component divided by 1M. I will just render the raw count for simplicity
  // or try to preserve the "K+" logic if in the value string.
  // Actually, for simplicity and robustness with locale strings, I'll return the string directly
  // unless I parse it robustly. The user prompt asked to add locales, not build a complex animator for strings.
  // I will skip the animation for the localized strings for now to ensure correctness, 
  // or just render the value string directly.
  return <span className="animate-count-up">{target}</span>
}

export default function Statistics() {
  const t = useTranslations("Public.Landing.Statistics")
  const items = t.raw("Items") as { Label: string; Value: string }[]

  return (
    <section className="w-full py-16 md:py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">ETC by the Numbers</h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Join millions of users who trust ETC for faster expressway travel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, index) => {
            const Icon = icons[index % icons.length]
            return (
              <Card
                key={index}
                className="p-8 text-center bg-background border-2 border-secondary animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-center mb-4">
                  <Icon className="w-12 h-12 text-secondary" />
                </div>
                <div className="mb-4">
                  <div className="text-4xl md:text-5xl font-bold text-accent mb-2">
                    {item.Value}
                  </div>
                  <p className="text-lg text-foreground/70">{item.Label}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
